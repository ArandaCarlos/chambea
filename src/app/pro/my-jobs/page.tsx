"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { JobCard } from "@/components/job/JobCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProfessionalMyJobsPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState<any[]>([]);

    useEffect(() => {
        loadMyJobs();
    }, []);

    async function loadMyJobs() {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            // Get profile id
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!profile) return;

            // Get proposals and related jobs
            const { data: proposals, error } = await supabase
                .from('proposals')
                .select(`
                    status,
                    job:jobs (
                        *,
                        client:profiles!client_id (
                            full_name,
                            avatar_url
                        )
                    )
                `)
                .eq('professional_id', profile.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const transformedJobs = proposals.map((p: any) => ({
                ...p.job,
                proposal_status: p.status,
                client: p.job.client || { full_name: "Cliente", avatar_url: null },
                location: {
                    address: p.job.address,
                    city: p.job.city,
                },
                budget: p.job.client_budget_max,
            }));

            setJobs(transformedJobs);
        } catch (error) {
            console.error("Error loading jobs:", error);
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

    const activeJobs = jobs.filter(j => j.proposal_status === 'accepted' && j.status !== 'completed');
    const pendingProposals = jobs.filter(j => j.proposal_status === 'pending');
    const completedJobs = jobs.filter(j => j.status === 'completed');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mis Trabajos</h1>
                <p className="text-muted-foreground">
                    Gestioná tus postulaciones y trabajos activos
                </p>
            </div>

            <Tabs defaultValue="active" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="active">Activos ({activeJobs.length})</TabsTrigger>
                    <TabsTrigger value="pending">Postulaciones ({pendingProposals.length})</TabsTrigger>
                    <TabsTrigger value="completed">Finalizados ({completedJobs.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                    {activeJobs.length === 0 ? (
                        <div className="text-center py-12 bg-muted/20 rounded-lg">
                            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="font-semibold mb-2">No tenés trabajos activos</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Postulate a ofertas para empezar a trabajar
                            </p>
                            <Button asChild>
                                <Link href="/pro/browse-jobs">Buscar trabajos</Link>
                            </Button>
                        </div>
                    ) : (
                        activeJobs.map(job => (
                            <div key={job.id} className="relative">
                                <div className="absolute top-4 right-4 z-10">
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                        Activo
                                    </span>
                                </div>
                                <JobCard job={job} />
                            </div>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="pending" className="space-y-4">
                    {pendingProposals.length === 0 ? (
                        <div className="text-center py-12 bg-muted/20 rounded-lg">
                            <p className="text-muted-foreground">No tenés postulaciones pendientes</p>
                        </div>
                    ) : (
                        pendingProposals.map(job => (
                            <div key={job.id} className="relative">
                                <div className="absolute top-4 right-4 z-10">
                                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                                        Pendiente
                                    </span>
                                </div>
                                <JobCard job={job} />
                            </div>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-4">
                    {completedJobs.length === 0 ? (
                        <div className="text-center py-12 bg-muted/20 rounded-lg">
                            <p className="text-muted-foreground">No tenés trabajos finalizados aún</p>
                        </div>
                    ) : (
                        completedJobs.map(job => (
                            <JobCard key={job.id} job={job} />
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
