"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CompleteJobPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [job, setJob] = useState<any | null>(null);
    const [alreadyReviewed, setAlreadyReviewed] = useState(false);

    const jobId = params?.id ? String(params.id) : null;

    useEffect(() => {
        if (jobId) loadJob(jobId);
    }, [jobId]);

    async function loadJob(id: string) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }

            const { data: jobData, error } = await supabase
                .from('jobs')
                .select(`*, professional:professional_id(id, full_name, phone)`)
                .eq('id', id)
                .single();

            if (error) throw error;
            setJob(jobData);

            // Check if the client already left a review
            const { data: existingReview } = await supabase
                .from('reviews')
                .select('id')
                .eq('job_id', id)
                .maybeSingle();

            if (existingReview) setAlreadyReviewed(true);

        } catch (error) {
            console.error(error);
            toast.error("Error al cargar el trabajo");
            router.push('/client/jobs');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
    }

    if (!job) return null;

    // Already reviewed
    if (alreadyReviewed || job.status === 'completed') {
        return (
            <div className="max-w-md mx-auto py-10 text-center space-y-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold">Trabajo finalizado</h1>
                <p className="text-muted-foreground">Ya calificaste este trabajo. ¡Gracias por usar Chambea!</p>
                <Button asChild><Link href="/client/dashboard">Volver al inicio</Link></Button>
            </div>
        );
    }

    const proName = job.professional?.full_name || "el profesional";
    const amount = job.quoted_price || job.client_budget_max;

    return (
        <div className="max-w-md mx-auto py-10 space-y-8">
            <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold">¡Trabajo Completado!</h1>
                <p className="text-muted-foreground">
                    Confirmá que todo está en orden y dejá tu calificación para {proName}.
                </p>
            </div>

            <Card>
                <CardHeader className="text-center border-b bg-muted/20 pb-4">
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    {amount && (
                        <p className="font-mono text-2xl font-bold mt-2 text-green-700">
                            ${amount.toLocaleString('es-AR')}
                        </p>
                    )}
                </CardHeader>
                <CardContent className="pt-6">
                    <ReviewForm
                        jobId={job.id}
                        professionalId={job.professional?.id}
                        professionalName={proName}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
