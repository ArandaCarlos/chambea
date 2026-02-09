"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, AlertTriangle, DollarSign, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Stats {
    totalUsers: number;
    activeJobs: number;
    pendingVerifications: number;
    totalRevenue: number;
}

export default function AdminDashboard() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        activeJobs: 0,
        pendingVerifications: 0,
        totalRevenue: 0
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    async function loadDashboardData() {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            // Get total users
            const { count: usersCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            // Get active jobs
            const { count: activeJobsCount } = await supabase
                .from('jobs')
                .select('*', { count: 'exact', head: true })
                .in('status', ['open', 'in_progress', 'pending_quote']);

            // Get pending verifications
            const { count: pendingVerifications } = await supabase
                .from('professional_profiles')
                .select('*', { count: 'exact', head: true })
                .eq('verification_status', 'pending');

            setStats({
                totalUsers: usersCount || 0,
                activeJobs: activeJobsCount || 0,
                pendingVerifications: pendingVerifications || 0,
                totalRevenue: 0 // TODO: Calculate from transactions table
            });

        } catch (error) {
            console.error("Error loading admin dashboard:", error);
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

    const statsCards = [
        {
            title: "Usuarios Totales",
            value: stats.totalUsers.toString(),
            description: "Registrados en la plataforma",
            icon: Users,
        },
        {
            title: "Trabajos Activos",
            value: stats.activeJobs.toString(),
            description: "Abiertos o en progreso",
            icon: Briefcase,
        },
        {
            title: "Verificaciones Pendientes",
            value: stats.pendingVerifications.toString(),
            description: stats.pendingVerifications > 0 ? "Requieren atención" : "Todo al día",
            icon: AlertTriangle,
            alert: stats.pendingVerifications > 0
        },
        {
            title: "Ingresos Totales",
            value: `$${stats.totalRevenue.toLocaleString('es-AR')}`,
            description: "Acumulado (TODO)",
            icon: DollarSign,
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
                <p className="text-muted-foreground mt-2">
                    Visión general del estado de la plataforma.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsCards.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon
                                className={`h-4 w-4 ${stat.alert ? 'text-red-500' : 'text-muted-foreground'}`}
                            />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Activity / Quick Actions */}
            <Card className="min-h-[400px] flex items-center justify-center border-dashed">
                <div className="text-center">
                    <p className="text-muted-foreground mb-2">Gráficos de actividad (Próximamente)</p>
                    <p className="text-sm text-muted-foreground">
                        Stats cargadas desde Supabase: ✓ Usuarios, ✓ Trabajos, ✓ Verificaciones
                    </p>
                </div>
            </Card>
        </div>
    );
}
