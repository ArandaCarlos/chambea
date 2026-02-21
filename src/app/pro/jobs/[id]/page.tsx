"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, MapPin, Calendar, DollarSign, MessageSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ProposalForm } from "@/components/proposal/ProposalForm";

export const dynamic = "force-dynamic";

export default function ProfessionalJobManagePage() {
    const router = useRouter();
    const params = useParams();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [job, setJob] = useState<any | null>(null);

    const jobId = params?.id ? String(params.id) : null;

    useEffect(() => {
        if (jobId) {
            loadJob(jobId);
        }
    }, [jobId]);

    async function loadJob(id: string) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return router.push('/login');

            // Fetch Job details
            const { data: jobData, error } = await supabase
                .from('jobs')
                .select(`
                    *,
                    client:client_id (
                        id,
                        full_name,
                        avatar_url,
                        phone,
                        email
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            // Get the professional's profile id
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            // Check if this pro already has a proposal (null is OK — they haven't proposed yet)
            const { data: proposal } = await supabase
                .from('proposals')
                .select('status')
                .eq('job_id', id)
                .eq('professional_id', profile?.id)
                .maybeSingle();

            // proposal_status = null means they can still submit a proposal
            setJob({ ...jobData, proposal_status: proposal?.status ?? null });

        } catch (error) {
            console.error(error);
            toast.error("Error al cargar el trabajo");
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;
    if (!job) return <div>Trabajo no encontrado</div>;

    const isAccepted = job.proposal_status === 'accepted';
    const hasProposal = job.proposal_status !== null;
    const isOpenForBidding = !hasProposal && job.status === 'open';

    return (
        <div className="space-y-6 max-w-4xl">
            <Button variant="ghost" size="sm" asChild>
                <Link href="/pro/browse-jobs">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a trabajos
                </Link>
            </Button>

            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold">{job.title}</h1>
                    <div className="flex items-center gap-2">
                        <Badge variant={isAccepted ? "secondary" : "outline"}>
                            {isAccepted
                                ? "Trabajo Aceptado"
                                : hasProposal
                                    ? "Postulación Pendiente"
                                    : "Sin postulación"}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Client Info Card - Only if Accepted */}
            {isAccepted && (
                <Card className="border-blue-200 bg-blue-50/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-800">
                            <User className="h-5 w-5" />
                            Cliente
                        </CardTitle>
                        <CardDescription>
                            Contactá al cliente para coordinar el trabajo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                                {job.client.full_name[0]}
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{job.client.full_name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {job.client.phone || "Teléfono no visible"}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button className="flex-1" asChild>
                                <Link href={`/pro/messages?job=${job.id}&client=${job.client.id}`}>
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Chatear
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Job Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Detalles del Trabajo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="whitespace-pre-wrap text-muted-foreground">{job.description}</p>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{job.address}, {job.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span>Presupuesto: ${job.client_budget_max?.toLocaleString() || 'A convenir'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Fecha: {job.preferred_date ? new Date(job.preferred_date).toLocaleDateString() : 'A coordinar'}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Photos */}
            {job.work_photos && job.work_photos.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Fotos del trabajo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {job.work_photos.map((photo: string, idx: number) => (
                                <img
                                    key={idx}
                                    src={photo}
                                    alt={`Foto ${idx + 1}`}
                                    className="rounded-lg object-cover aspect-square"
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ProposalForm: only show if job is open and pro hasn't proposed yet */}
            {isOpenForBidding && (
                <ProposalForm jobId={job.id} />
            )}

            {/* Message for pros who already proposed but aren't accepted yet */}
            {hasProposal && !isAccepted && (
                <Card className="border-muted bg-muted/30">
                    <CardContent className="py-6 text-center">
                        <p className="text-muted-foreground">
                            Ya enviaste una propuesta para este trabajo. El cliente la está revisando.
                        </p>
                        <Button variant="outline" className="mt-4" onClick={() => router.push("/pro/my-jobs")}>
                            Ver mis postulaciones
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
