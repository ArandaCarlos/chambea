"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { JobCard } from "@/components/job/JobCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Job {
    id: string;
    title: string;
    description: string;
    status: "accepted" | "cancelled" | "completed" | "open" | "draft" | "pending_quote" | "quoted" | "in_progress" | "pending_client_approval" | "disputed" | "expired";
    category_id: string;
    urgency: "low" | "medium" | "high" | "emergency";
    professional_id: string | null;
    proposal_status: string;
    client: {
        full_name: string;
        avatar_url?: string;
    };
    location: {
        address: string;
        city: string;
    };
    budget?: number;
    created_at: string;
}

function MyJobsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'active';
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [profileId, setProfileId] = useState<string | null>(null);

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

            setProfileId(profile.id);

            // Get proposals and related jobs
            const { data: proposals, error } = await supabase
                .from('proposals')
                .select(`
                    id,
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

            const transformedJobs = proposals.map((p: any) => {
                if (!p.job) return null;
                return {
                    ...p.job,
                    proposal_status: p.status,
                    client: p.job.client || { full_name: "Cliente", avatar_url: null },
                    location: {
                        address: p.job.address,
                        city: p.job.city || "CABA",
                    },
                    budget: p.job.client_budget_max,
                } as Job;
            }).filter((job): job is Job => job !== null);

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

    // ROBUST FILTERING LOGIC:
    // Active if:
    // 1. Proposal is accepted
    // 2. OR Job's professional_id matches me (regardless of proposal status sync)
    // 3. AND Job is not cancelled/completed (unless I finished it)
    const activeJobs = jobs.filter(j =>
        (j.proposal_status === 'accepted' || j.professional_id === profileId) &&
        (j.status !== 'cancelled') &&
        (j.status !== 'completed' || j.proposal_status === 'accepted') // Include completed if it was mine
    );

    // Pending if:
    // 1. Proposal is pending
    // 2. AND Job is OPEN (if it's accepted by someone else, it's not pending for me)
    // 3. AND I am not the assigned professional (otherwise it's active)
    const pendingProposals = jobs.filter(j =>
        j.proposal_status === 'pending' &&
        j.status === 'open' &&
        j.professional_id !== profileId
    );

    // Completed if:
    // Status is completed AND it was my job
    const completedJobs = jobs.filter(j =>
        j.status === 'completed' &&
        (j.proposal_status === 'accepted' || j.professional_id === profileId)
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mis Trabajos</h1>
                <p className="text-muted-foreground">
                    Gestioná tus postulaciones y trabajos activos
                </p>
            </div>

            <Tabs defaultValue={initialTab} className="space-y-4">
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
                                Si te aceptaron una propuesta, aparecerá acá.
                            </p>
                            {/* BROWSE-JOBS HIDDEN: Boton "Buscar trabajos" removido */}
                        </div>
                    ) : (
                        activeJobs.map(job => (
                            <div key={job.id} className="relative">
                                <div className="absolute top-4 right-4 z-10">
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                        Activo / Aceptado
                                    </span>
                                </div>
                                {/* HERE: We need to pass a property to JobCard or wrap it to change the link logic */}
                                {/* For now, we'll keep JobCard but rely on the detail page to handle the view */}
                                <JobCard job={job} />
                                <div className="mt-2 flex justify-end px-4 pb-4">
                                    <Button size="sm" className="w-full md:w-auto" asChild>
                                        <Link href={`/pro/jobs/${job.id}`}>
                                            Gestionar Trabajo
                                        </Link>
                                    </Button>
                                </div>
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

export default function ProfessionalMyJobsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><span className="h-8 w-8 animate-spin text-primary">⏳</span></div>}>
            <MyJobsContent />
        </Suspense>
    );
}
