"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
    ShieldCheck, Zap, FileText, Loader2, Search, Plus,
    DollarSign, MessageSquare, Bell, ArrowRight
} from "lucide-react";

interface Profile { id: string; full_name: string; }

interface Notification {
    type: "quote_offer" | "quote_accepted" | "new_message";
    jobId: string;
    jobTitle: string;
    proName: string;
    proId: string;
    amount?: number;
    time: string;
}

export default function ClientDashboard() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/login"); return; }

            const { data: profileData } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('user_id', user.id)
                .single();

            if (!profileData) return;
            setProfile(profileData);

            // Fetch recent job-related messages sent TO this client (quotes, etc.)
            // that arrived in the last 7 days
            const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

            const { data: msgs } = await supabase
                .from('messages')
                .select('id, job_id, sender_id, message_type, metadata, created_at, content')
                .eq('receiver_id', profileData.id)
                .in('message_type', ['quote_offer'])
                .gte('created_at', since)
                .order('created_at', { ascending: false })
                .limit(10);

            if (!msgs || msgs.length === 0) {
                setLoading(false);
                return;
            }

            // Enrich with job + pro names
            const built: Notification[] = [];
            const seen = new Set<string>(); // deduplicate by job_id

            for (const msg of msgs) {
                if (seen.has(msg.job_id)) continue;
                seen.add(msg.job_id);

                const [jobRes, proRes] = await Promise.all([
                    supabase.from('jobs').select('title, status').eq('id', msg.job_id).single(),
                    supabase.from('profiles').select('full_name').eq('id', msg.sender_id).single(),
                ]);

                if (!jobRes.data || !proRes.data) continue;
                // Only show notification if the job is still in a state where action is needed
                if (['completed', 'cancelled'].includes(jobRes.data.status)) continue;

                built.push({
                    type: msg.message_type as Notification["type"],
                    jobId: msg.job_id,
                    jobTitle: jobRes.data.title,
                    proName: proRes.data.full_name,
                    proId: msg.sender_id,
                    amount: msg.metadata?.price,
                    time: msg.created_at,
                });
            }

            setNotifications(built);
        } catch (error) {
            console.error("Error loading dashboard:", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Welcome Hero */}
            <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
                <h1 className="text-3xl font-bold tracking-tight">
                    Hola, {profile?.full_name || 'Usuario'}! 👋
                </h1>
                <p className="text-muted-foreground mt-2 max-w-xl">
                    Publicá tu problema y recibí presupuestos de profesionales verificados en minutos.
                    Tu dinero está protegido hasta que el trabajo esté terminado.
                </p>
                <div className="flex items-center gap-2 mt-4">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Garantía Chambea
                    </Badge>
                </div>
            </div>

            {/* Notifications — quotes received */}
            {notifications.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-primary" />
                        <h2 className="font-semibold text-base">Novedades recientes</h2>
                        <Badge className="bg-primary text-primary-foreground text-xs">{notifications.length}</Badge>
                    </div>
                    <div className="space-y-2">
                        {notifications.map((n, i) => (
                            <Link key={i} href={`/client/messages?jobId=${n.jobId}&proId=${n.proId}`}>
                                <Card className="border-orange-200 bg-orange-50/60 hover:bg-orange-50 transition-colors cursor-pointer">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                                            <DollarSign className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm">
                                                {n.proName} te envió un presupuesto
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {n.jobTitle}
                                                {n.amount ? ` · $${n.amount.toLocaleString('es-AR')}` : ""}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(n.time).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                                            </span>
                                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-2 border-orange-200 bg-orange-50/50">
                    <CardContent className="p-6 flex flex-col gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base">Contactar un profesional directamente</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Elegís vos a quién contratar, negociás el precio por chat y lo contratás al instante.
                                </p>
                                <p className="text-sm font-medium text-orange-700 mt-1">Ideal para urgencias o cuando ya sabés quién querés.</p>
                            </div>
                        </div>
                        <Button asChild className="bg-orange-500 hover:bg-orange-600 w-full">
                            <Link href="/client/search">
                                <Search className="w-4 h-4 mr-2" /> Buscar profesional
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-2 border-primary/20 bg-primary/5">
                    <CardContent className="p-6 flex flex-col gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base">Publicar un trabajo y recibir presupuestos</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Describís lo que necesitás, los profesionales de la zona te mandan propuestas y elegís la mejor.
                                </p>
                                <p className="text-sm font-medium text-primary mt-1">Ideal para comparar precios y elegir con calma.</p>
                            </div>
                        </div>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/client/post-job">
                                <Plus className="w-4 h-4 mr-2" /> Publicar trabajo
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
