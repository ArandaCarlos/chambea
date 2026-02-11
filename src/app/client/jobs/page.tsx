"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/job/JobCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Job {
    id: string;
    title: string;
    description: string;
    status: string;
    category_id: string;
    subcategory_id: string;
    address: string;
    city: string;
    client_budget_max: number | null;
    urgency: string;
    created_at: string;
    _count?: {
        proposals: number;
    };
}

export default function ClientJobsPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState<Job[]>([]);

    useEffect(() => {
        loadJobs();
    }, []);

    async function loadJobs() {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            // Get profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!profile) {
                toast.error("No se pudo cargar tu perfil");
                return;
            }

            // Get jobs
            const { data, error } = await supabase
                .from('jobs')
                .select(`
                    *,
                    proposals(count)
                `)
                .eq('client_id', profile.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform data to match JobCard expectations
            const transformedJobs = data.map((job: any) => ({
                ...job,
                _count: {
                    proposals: job.proposals?.length || 0
                },
                client: {
                    full_name: "Tú",
                    avatar_url: null
                },
                location: {
                    address: job.address,
                    city: job.city
                },
                budget: job.client_budget_max
            }));

            setJobs(transformedJobs);
        } catch (error) {
            console.error("Error loading jobs:", error);
            toast.error("Error al cargar tus trabajos");
        } finally {
            setLoading(false);
        }
    }

    const openJobs = jobs.filter(j => j.status === 'open');
    const activeJobs = jobs.filter(j => ['accepted', 'in_progress'].includes(j.status));
    const completedJobs = jobs.filter(j => ['completed', 'cancelled'].includes(j.status));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Mis Trabajos</h1>
                    <p className="text-muted-foreground mt-2">
                        Administrá tus solicitudes de trabajo
                    </p>
                </div>
                <Button asChild>
                    <Link href="/client/post-job">
                        <Plus className="mr-2 h-4 w-4" />
                        Publicar Trabajo
                    </Link>
                </Button>
            </div>

            <Tabs defaultValue="open" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="open">
                        Abiertos ({openJobs.length})
                    </TabsTrigger>
                    <TabsTrigger value="active">
                        Activos ({activeJobs.length})
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                        Finalizados ({completedJobs.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="open" className="space-y-4 mt-6">
                    {openJobs.length === 0 ? (
                        <div className="text-center py-12 bg-muted/50 rounded-lg">
                            <p className="text-muted-foreground">
                                No tenés trabajos abiertos
                            </p>
                            <Button asChild className="mt-4">
                                <Link href="/client/post-job">
                                    Publicar tu primer trabajo
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        openJobs.map((job) => (
                            <div key={job.id} className="relative">
                                <JobCard job={job as any} href={`/client/jobs/${job.id}`} />
                                {job._count && job._count.proposals > 0 && (
                                    <div className="absolute top-4 right-4">
                                        <Button size="sm" asChild variant="secondary">
                                            <Link href={`/client/jobs/${job.id}/proposals`}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                Ver {job._count.proposals} propuesta{job._count.proposals !== 1 ? 's' : ''}
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="active" className="space-y-4 mt-6">
                    {activeJobs.length === 0 ? (
                        <div className="text-center py-12 bg-muted/50 rounded-lg">
                            <p className="text-muted-foreground">
                                No tenés trabajos activos
                            </p>
                        </div>
                    ) : (
                        activeJobs.map((job) => (
                            <JobCard key={job.id} job={job as any} href={`/client/jobs/${job.id}`} />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-4 mt-6">
                    {completedJobs.length === 0 ? (
                        <div className="text-center py-12 bg-muted/50 rounded-lg">
                            <p className="text-muted-foreground">
                                No tenés trabajos finalizados
                            </p>
                        </div>
                    ) : (
                        completedJobs.map((job) => (
                            <JobCard key={job.id} job={job as any} href={`/client/jobs/${job.id}`} />
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
