"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, MapPin, Calendar, DollarSign, MessageSquare, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProposalForm } from "@/components/proposal/ProposalForm";
import { FinalQuoteForm } from "@/components/proposal/FinalQuoteForm";

export const dynamic = "force-dynamic";

export default function ProfessionalJobManagePage() {
    const router = useRouter();
    const params = useParams();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [job, setJob] = useState<any | null>(null);

    const jobId = params?.id ? String(params.id) : null;

    useEffect(() => {
        if (jobId) loadJob(jobId);
    }, [jobId]);

    async function loadJob(id: string) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return router.push('/login');

            const { data: jobData, error } = await supabase
                .from('jobs')
                .select(`*, client:client_id (id, full_name, avatar_url, phone, email)`)
                .eq('id', id)
                .single();

            if (error) throw error;

            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            const { data: proposal } = await supabase
                .from('proposals')
                .select('status, proposal_type, visit_date, visit_time_slot')
                .eq('job_id', id)
                .eq('professional_id', profile?.id)
                .maybeSingle();

            setJob({ ...jobData, proposal_status: proposal?.status ?? null, proposal_type: proposal?.proposal_type ?? null });
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar el trabajo");
        } finally {
            setLoading(false);
        }
    }

    function getStatusLabel(): { label: string; variant: "default" | "secondary" | "outline" | "destructive"; color: string } {
        if (!job) return { label: "", variant: "outline", color: "" };
        const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; color: string }> = {
            open: { label: "Abierto", variant: "outline", color: "" },
            visit_scheduled: { label: "Visita Agendada", variant: "secondary", color: "bg-amber-100 text-amber-800 border-amber-200" },
            quoted: { label: "Presupuesto Enviado", variant: "secondary", color: "bg-blue-100 text-blue-800 border-blue-200" },
            accepted: { label: "Contratado", variant: "secondary", color: "bg-green-100 text-green-800 border-green-200" },
            in_progress: { label: "En Progreso", variant: "secondary", color: "" },
            completed: { label: "Completado", variant: "outline", color: "" },
        };
        return map[job.status] ?? { label: job.status, variant: "outline", color: "" };
    }

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;
    if (!job) return <div>Trabajo no encontrado</div>;

    const isAccepted = job.status === 'accepted' || job.status === 'in_progress' || job.status === 'completed';
    const isVisitScheduled = job.status === 'visit_scheduled';
    const isQuoted = job.status === 'quoted';
    const hasProposal = job.proposal_status !== null;
    const isOpenForBidding = !hasProposal && job.status === 'open';
    const statusInfo = getStatusLabel();

    return (
        <div className="space-y-6 max-w-4xl">
            <Button variant="ghost" size="sm" asChild>
                <Link href="/pro/my-jobs">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a mis trabajos
                </Link>
            </Button>

            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold">{job.title}</h1>
                    <Badge className={statusInfo.color || ""} variant={statusInfo.variant}>
                        {statusInfo.label}
                    </Badge>
                </div>
            </div>

            {/* Client Info - Only if accepted/visit/quoted */}
            {(isAccepted || isVisitScheduled || isQuoted) && job.client && (
                <Card className="border-blue-200 bg-blue-50/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-800">
                            <User className="h-5 w-5" /> Cliente
                        </CardTitle>
                        <CardDescription>
                            {isVisitScheduled
                                ? "Confirmaste la visita. Coordiná con el cliente."
                                : "Contactá al cliente para coordinar el trabajo."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                                {job.client.full_name[0]}
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{job.client.full_name}</h3>
                                <p className="text-sm text-muted-foreground">{job.client.phone || "Teléfono no visible"}</p>
                            </div>
                        </div>
                        <Button className="w-full" asChild>
                            <Link href={`/pro/messages?job=${job.id}&client=${job.client.id}`}>
                                <MessageSquare className="mr-2 h-4 w-4" /> Chatear
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Visit scheduled banner */}
            {isVisitScheduled && (
                <Card className="border-amber-300 bg-amber-50/50">
                    <CardContent className="py-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Clock className="h-6 w-6 text-amber-600" />
                            <div>
                                <p className="font-semibold text-amber-800">Visita confirmada</p>
                                <p className="text-sm text-amber-700">
                                    Coordiná la fecha con el cliente por el chat.
                                    Después de la visita, enviá el presupuesto final.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Job Details */}
            <Card>
                <CardHeader><CardTitle>Detalles del Trabajo</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <p className="whitespace-pre-wrap text-muted-foreground">{job.description}</p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{job.address}, {job.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span>Presupuesto cliente: ${job.client_budget_max?.toLocaleString() || 'A convenir'}</span>
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
                    <CardHeader><CardTitle>Fotos del trabajo</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {job.work_photos.map((photo: string, idx: number) => (
                                <img key={idx} src={photo} alt={`Foto ${idx + 1}`} className="rounded-lg object-cover aspect-square" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ProposalForm: open jobs without a proposal */}
            {isOpenForBidding && <ProposalForm jobId={job.id} />}

            {/* FinalQuoteForm: after visit is done */}
            {isVisitScheduled && (
                <FinalQuoteForm jobId={job.id} onSuccess={() => loadJob(job.id)} />
            )}

            {/* Quoted state: waiting for client to accept */}
            {isQuoted && (
                <Card className="border-blue-200 bg-blue-50/30">
                    <CardContent className="py-6 text-center">
                        <p className="font-semibold text-blue-800 text-lg mb-1">Presupuesto enviado</p>
                        <p className="text-sm text-blue-700">El cliente está revisando tu presupuesto final. Te avisaremos cuando lo acepte.</p>
                    </CardContent>
                </Card>
            )}

            {/* Already proposed, not yet accepted */}
            {hasProposal && !isAccepted && !isVisitScheduled && !isQuoted && (
                <Card className="border-muted bg-muted/30">
                    <CardContent className="py-6 text-center">
                        <p className="text-muted-foreground">Ya enviaste una propuesta. El cliente la está revisando.</p>
                        <Button variant="outline" className="mt-4" onClick={() => router.push("/pro/my-jobs")}>Ver mis postulaciones</Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
