"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, DollarSign, TrendingUp, CreditCard, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const COMMISSION_RATE = 0.10; // 10% platform commission

export default function ProfessionalEarningsPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        thisMonth: 0,
        total: 0,
        completedJobs: 0,
    });
    const [completedJobs, setCompletedJobs] = useState<any[]>([]);

    useEffect(() => {
        loadEarnings();
    }, []);

    async function loadEarnings() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }

            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!profile) return;

            // Get all completed jobs for this pro
            const { data: jobs } = await supabase
                .from('jobs')
                .select('id, title, quoted_price, client_budget_max, completed_at, created_at, client:client_id(full_name)')
                .eq('professional_id', profile.id)
                .eq('status', 'completed')
                .order('completed_at', { ascending: false });

            if (!jobs) return;

            setCompletedJobs(jobs);

            const now = new Date();
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

            let total = 0;
            let thisMonth = 0;

            jobs.forEach((job: any) => {
                const amount = (job.quoted_price || job.client_budget_max || 0) * (1 - COMMISSION_RATE);
                total += amount;
                const completedAt = job.completed_at ? new Date(job.completed_at) : null;
                if (completedAt && completedAt >= thisMonthStart) {
                    thisMonth += amount;
                }
            });

            setStats({
                thisMonth: Math.round(thisMonth),
                total: Math.round(total),
                completedJobs: jobs.length,
            });

        } catch (error) {
            console.error(error);
            toast.error("Error al cargar las ganancias");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mis Ganancias</h1>
                <p className="text-muted-foreground">Resumen de tus ingresos y trabajos completados</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ganado este mes</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.thisMonth.toLocaleString('es-AR')}</div>
                        <p className="text-xs text-muted-foreground">Neto después de comisión Chambea (10%)</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Trabajos completados</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.completedJobs}</div>
                        <p className="text-xs text-muted-foreground">Total histórico</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total histórico</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.total.toLocaleString('es-AR')}</div>
                        <p className="text-xs text-muted-foreground">Neto acumulado</p>
                    </CardContent>
                </Card>
            </div>

            {/* Completed jobs list */}
            <Card>
                <CardHeader>
                    <CardTitle>Historial de trabajos</CardTitle>
                </CardHeader>
                <CardContent>
                    {completedJobs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p>Todavía no tenés trabajos completados.</p>
                            <p className="text-sm mt-1">Cuando finalices trabajos, aparecerán aquí.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {completedJobs.map((job: any) => {
                                const gross = job.quoted_price || job.client_budget_max || 0;
                                const commission = gross * COMMISSION_RATE;
                                const net = gross - commission;
                                return (
                                    <div key={job.id} className="py-4 flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{job.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {job.client?.full_name} •{" "}
                                                {job.completed_at
                                                    ? formatDistanceToNow(new Date(job.completed_at), { addSuffix: true, locale: es })
                                                    : "Completado"}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-semibold text-green-700">${net.toLocaleString('es-AR')}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Bruto ${gross.toLocaleString('es-AR')} — comisión ${commission.toLocaleString('es-AR')}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex-shrink-0">
                                            Completado
                                        </Badge>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
