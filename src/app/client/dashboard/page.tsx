"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Search, MapPin, ShieldCheck, Loader2 } from "lucide-react";
import { JobCard } from "@/components/job/JobCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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

export default function ClientDashboard() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [recentJobs, setRecentJobs] = useState<Job[]>([]);
    const [stats, setStats] = useState({
        activeJobs: 0,
        totalProposals: 0,
        unreadMessages: 0,
        totalSpent: 0,
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

            // Get recent jobs (last 5)
            const { data: jobsData, error: jobsError } = await supabase
                .from('jobs')
                .select('*')
                .eq('client_id', profileData.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (jobsError) throw jobsError;

            const transformedJobs = jobsData.map((job: any) => ({
                ...job,
                client: {
                    full_name: "Tú",
                    avatar_url: null,
                },
                location: {
                    address: job.address,
                    city: job.city,
                },
                budget: job.client_budget_max,
            }));

            setRecentJobs(transformedJobs);

            // Count active jobs
            const { count: activeCount } = await supabase
                .from('jobs')
                .select('*', { count: 'exact', head: true })
                .eq('client_id', profileData.id)
                .in('status', ['open', 'accepted', 'in_progress']);

            // Count total proposals received
            const { count: proposalsCount } = await supabase
                .from('proposals')
                .select('*', { count: 'exact', head: true })
                .in('job_id', jobsData.map(j => j.id));

            // Count unread messages (if messages table exists)
            const { count: messagesCount } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', profileData.id)
                .eq('read', false);

            setStats({
                activeJobs: activeCount || 0,
                totalProposals: proposalsCount || 0,
                unreadMessages: messagesCount || 0,
                totalSpent: 0, // TODO: Calculate from transactions
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
            {/* Welcome & Quick Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-primary/5 p-6 rounded-xl border border-primary/10">
                <div>
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

                <div className="w-full md:w-auto">
                    <Button asChild size="lg" className="w-full md:w-auto text-lg h-14 px-8 shadow-lg hover:shadow-xl transition-all">
                        <Link href="/client/post-job">
                            <Plus className="mr-2 h-6 w-6" />
                            PUBLICAR TRABAJO
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Trabajos Activos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeJobs}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Postulaciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalProposals}</div>
                        <p className="text-xs text-muted-foreground">Recibidas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Mensajes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.unreadMessages}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gastado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.totalSpent}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Main Column */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Tus trabajos recientes</h2>
                        <Button variant="link" asChild>
                            <Link href="/client/jobs">Ver todos</Link>
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {recentJobs.length === 0 ? (
                            <Card className="p-12 text-center">
                                <p className="text-muted-foreground mb-4">
                                    No tenés trabajos publicados todavía
                                </p>
                                <Button asChild>
                                    <Link href="/client/post-job">
                                        Publicar tu primer trabajo
                                    </Link>
                                </Button>
                            </Card>
                        ) : (
                            recentJobs.map((job) => (
                                <JobCard key={job.id} job={job as any} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

