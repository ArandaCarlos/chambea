"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { JobDetails } from "@/components/job/JobDetails";
import { ProposalForm } from "@/components/proposal/ProposalForm";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";



export default function ProfessionalJobPage({ params }: { params: { id: string } }) {
    const supabase = createClient();
    const router = useRouter();
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        if (!params.id || params.id === 'undefined') {
            console.error("Invalid Job ID:", params.id);
            // toast.error("ID de trabajo inválido"); // Optional
            router.push("/pro/dashboard");
            return;
        }
        loadJobDetails();
    }, [params.id]);

    async function loadJobDetails() {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Get profile to check if user is professional
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, user_type')
                    .eq('user_id', user.id)
                    .single();

                if (profile) {
                    setCurrentUserId(profile.id);
                }
            }

            console.log("Fetching job with ID:", params.id);

            // Fetch job details with client info
            const { data: jobData, error } = await supabase
                .from('jobs')
                .select(`
                    *,
                    client:profiles!client_id (
                        id,
                        full_name,
                        avatar_url,
                        rating:reviews!reviewee_id(rating)
                    )
                `)
                .eq('id', params.id)
                .single();

            if (error) {
                console.error("Supabase error fetching job:", error);
                throw error;
            }

            console.log("Job data found:", jobData);

            // Calculate average rating if exists
            let avgRating = 0;
            if (jobData.client?.rating && Array.isArray(jobData.client.rating)) {
                const ratings = jobData.client.rating.map((r: any) => r.rating);
                if (ratings.length > 0) {
                    avgRating = ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length;
                }
            }

            setJob({
                ...jobData,
                client: {
                    ...jobData.client,
                    rating: avgRating
                },
                location: {
                    address: jobData.address,
                    city: jobData.city,
                }
            });

        } catch (error) {
            console.error("Error loading job:", error);
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

    if (!job) {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-semibold">Trabajo no encontrado</h3>
                <Button asChild className="mt-4" variant="outline">
                    <Link href="/pro/browse-jobs">Volver al listado</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <JobDetails job={job} isOwner={false} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ProposalForm jobId={params.id} />
                </div>
            </div>
        </div>
    );
}
