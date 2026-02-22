"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, DollarSign, Star, TrendingUp, Search, Loader2 } from "lucide-react";
import { JobCard } from "@/components/job/JobCard";
import { createClient } from "@/lib/supabase/client";

interface Profile {
    full_name: string;
}

interface Job {
    id: string;
    title: string;
    description: string;
    category_id: string;
    status: string;
    address: string;
    city: string;
    client_budget_max: number | null;
    urgency: string;
    created_at: string;
}

export default function ProfessionalDashboard() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [nearbyJobs, setNearbyJobs] = useState<Job[]>([]);
    const [stats, setStats] = useState({
        activeJobs: 0,
        pendingProposals: 0,
        monthlyEarnings: 0,
        rating: 0,
        profileViews: 0
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

            // Get profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('user_id', user.id)
                .single();

            if (profileError) throw profileError;
            setProfile(profileData);

            // Get nearby open jobs (last 10)
            const { data: jobsData, error: jobsError } = await supabase
                .from('jobs')
                .select('*')
                .eq('status', 'open')
                .order('created_at', { ascending: false })
                .limit(10);

            if (jobsError) throw jobsError;

            const transformedJobs = jobsData.map((job: any) => ({
                ...job,
                client: {
                    full_name: "Cliente",
                    avatar_url: null,
                },
                location: {
                    address: job.address,
                    city: job.city,
                },
                budget: job.client_budget_max,
            }));

            setNearbyJobs(transformedJobs);

            // Active jobs: jobs where this pro is hired and still in progress
            const { count: activeCount } = await supabase
                .from('jobs')
                .select('*', { count: 'exact', head: true })
                .eq('professional_id', profileData.id)
                .in('status', ['accepted', 'in_progress']);

            // Pending proposals (pro sent, waiting for client decision)
            const { count: pendingCount } = await supabase
                .from('proposals')
                .select('*', { count: 'exact', head: true })
                .eq('professional_id', profileData.id)
                .eq('status', 'pending');

            // Rating from professional_profiles (kept updated by trigger)
            const { data: proProfile } = await supabase
                .from('professional_profiles')
                .select('average_rating, total_reviews')
                .eq('profile_id', profileData.id)
                .maybeSingle();

            // Monthly earnings: sum of completed jobs this month
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const { data: completedThisMonth } = await supabase
                .from('jobs')
                .select('quoted_price, client_budget_max')
                .eq('professional_id', profileData.id)
                .eq('status', 'completed')
                .gte('completed_at', monthStart);

            const monthlyEarnings = (completedThisMonth || []).reduce((sum: number, j: any) => {
                return sum + ((j.quoted_price || j.client_budget_max || 0) * 0.9); // 10% commission
            }, 0);

            setStats({
                activeJobs: activeCount || 0,
                pendingProposals: pendingCount || 0,
                monthlyEarnings: Math.round(monthlyEarnings),
                rating: proProfile?.average_rating || 0,
                profileViews: 0,
            });

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
            {/* Welcome & Status */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Hola, {profile?.full_name || 'Profesional'}! 👋
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Tu perfil está activo y visible para clientes cercanos.
                    </p>
                </div>
                <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link href="/pro/browse-jobs">
                        <Search className="mr-2 h-5 w-5" />
                        Buscar Trabajos
                    </Link>
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Link href="/pro/my-jobs?tab=active" className="block">
                    <Card className="cursor-pointer transition-all hover:shadow-md hover:ring-2 hover:ring-primary/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Trabajos Activos</CardTitle>
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeJobs}</div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/pro/my-jobs?tab=pending" className="block">
                    <Card className="cursor-pointer transition-all hover:shadow-md hover:ring-2 hover:ring-primary/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Propuestas Pendientes</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pendingProposals}</div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/pro/earnings" className="block">
                    <Card className="cursor-pointer transition-all hover:shadow-md hover:ring-2 hover:ring-primary/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ganado (mes)</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${stats.monthlyEarnings.toLocaleString('es-AR')}</div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/pro/reviews" className="block">
                    <Card className="cursor-pointer transition-all hover:shadow-md hover:ring-2 hover:ring-primary/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rating</CardTitle>
                            <Star className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.rating > 0 ? stats.rating.toFixed(1) : '—'}</div>
                            {stats.rating > 0 && <p className="text-xs text-muted-foreground">⭐ Promedio</p>}
                        </CardContent>
                    </Card>
                </Link>

                {/* Vistas Perfil: read-only, no link */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vistas Perfil</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.profileViews}</div>
                        <p className="text-xs text-muted-foreground">Próximamente</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Nearby Jobs Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Oportunidades cerca tuyo</h2>
                        <Button variant="link" asChild>
                            <Link href="/pro/browse-jobs">Ver todas</Link>
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {nearbyJobs.length === 0 ? (
                            <Card className="p-12 text-center">
                                <p className="text-muted-foreground mb-4">
                                    No hay trabajos disponibles en este momento
                                </p>
                                <Button asChild>
                                    <Link href="/pro/browse-jobs">
                                        Buscar trabajos
                                    </Link>
                                </Button>
                            </Card>
                        ) : (
                            nearbyJobs.map((job) => (
                                <JobCard
                                    key={job.id}
                                    job={job as any}
                                    showActions={true}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Acciones rápidas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button asChild variant="outline" className="w-full justify-start">
                                <Link href="/pro/my-jobs">
                                    <Briefcase className="mr-2 h-4 w-4" />
                                    Ver mis trabajos
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full justify-start">
                                <Link href="/profile">
                                    <Star className="mr-2 h-4 w-4" />
                                    Editar perfil
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
