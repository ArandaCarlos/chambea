"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, ShieldCheck, Loader2, RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfessionalCard } from "@/components/professional/ProfessionalCard";
import { formatRelativeTime } from "@/lib/utils/dates";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";

const BASE_SELECT = `
    id,
    quoted_price,
    estimated_hours,
    message,
    status,
    created_at,
    professional:professional_id (
        id,
        full_name,
        avatar_url,
        latitude,
        longitude,
        identity_verified,
        professional:professional_profiles (
            trade,
            hourly_rate,
            average_rating,
            total_reviews,
            available_now,
            service_areas
        )
    )
`;

const FULL_SELECT = `
    id,
    quoted_price,
    estimated_hours,
    message,
    status,
    created_at,
    proposal_type,
    visit_date,
    visit_time_slot,
    visit_cost,
    visit_notes,
    professional:professional_id (
        id,
        full_name,
        avatar_url,
        latitude,
        longitude,
        identity_verified,
        professional:professional_profiles (
            trade,
            hourly_rate,
            average_rating,
            total_reviews,
            available_now,
            service_areas
        )
    )
`;

function mapProposal(p: any) {
    return {
        id: p.id,
        quoted_price: p.quoted_price,
        estimated_hours: p.estimated_hours,
        message: p.message,
        status: p.status,
        created_at: p.created_at,
        proposal_type: p.proposal_type || 'price',
        visit_date: p.visit_date ?? null,
        visit_time_slot: p.visit_time_slot ?? null,
        visit_cost: p.visit_cost ?? null,
        visit_notes: p.visit_notes ?? null,
        professional: {
            id: p.professional?.id,
            full_name: p.professional?.full_name || 'Profesional',
            avatar_url: p.professional?.avatar_url,
            trade: p.professional?.professional?.trade || 'general',
            hourly_rate: p.professional?.professional?.hourly_rate || 0,
            rating: p.professional?.professional?.average_rating || 0,
            reviews_count: p.professional?.professional?.total_reviews || 0,
            is_verified: p.professional?.identity_verified || false,
            available_now: p.professional?.professional?.available_now || false,
            location: { city: "CABA", distance: undefined }
        }
    };
}

export default function JobProposalsPage() {
    const params = useParams();
    const supabase = createClient();
    const [proposals, setProposals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [acceptedProposalId, setAcceptedProposalId] = useState<string | null>(null);
    const [jobStatus, setJobStatus] = useState<string | null>(null);

    const jobId = params?.id ? String(params.id) : null;

    useEffect(() => {
        if (jobId && jobId !== 'undefined') {
            fetchProposals(jobId);
        }
    }, [jobId]);

    async function fetchProposals(id: string) {
        setLoading(true);
        try {
            // Get Job Status
            const { data: job, error: jobError } = await supabase
                .from('jobs')
                .select('status, professional_id')
                .eq('id', id)
                .single();

            if (jobError) throw jobError;
            setJobStatus(job.status);

            // Try full query (with visit columns added by Step 1 SQL)
            // Fall back to base query if those columns don't exist yet
            let rawProposals: any[] = [];

            const fullResult = await supabase
                .from('proposals')
                .select(FULL_SELECT)
                .eq('job_id', id)
                .order('created_at', { ascending: false });

            if (!fullResult.error) {
                rawProposals = fullResult.data || [];
            } else {
                // Fallback: columns from Step 1 SQL don't exist yet
                console.warn('Full proposal query failed, using base query:', fullResult.error.message);
                const baseResult = await supabase
                    .from('proposals')
                    .select(BASE_SELECT)
                    .eq('job_id', id)
                    .order('created_at', { ascending: false });

                if (baseResult.error) throw baseResult.error;
                rawProposals = baseResult.data || [];
            }

            const mappedProposals = rawProposals.map(mapProposal);
            setProposals(mappedProposals);

            const accepted = mappedProposals.find(p => p.status === 'accepted');
            if (accepted) setAcceptedProposalId(accepted.id);

        } catch (error) {
            console.error('Error fetching proposals:', error);
            toast.error("Error al cargar propuestas");
        } finally {
            setLoading(false);
        }
    }

    const handleAccept = async (proposalId: string, professionalId: string, price: number) => {
        toast.promise(
            async () => {
                const { error: propError } = await supabase
                    .from('proposals')
                    .update({ status: 'accepted' })
                    .eq('id', proposalId);
                if (propError) throw propError;

                const { error: jobError } = await supabase
                    .from('jobs')
                    .update({ status: 'accepted', professional_id: professionalId, quoted_price: price })
                    .eq('id', jobId);
                if (jobError) throw jobError;

                setAcceptedProposalId(proposalId);
                if (jobId) fetchProposals(jobId);
            },
            {
                loading: 'Procesando contratación...',
                success: '¡Contratación exitosa! Datos de contacto liberados.',
                error: 'Error al procesar la contratación',
            }
        );
    };

    const handleConfirmVisit = async (proposalId: string, professionalId: string) => {
        toast.promise(
            async () => {
                const { error: propError } = await supabase
                    .from('proposals')
                    .update({ status: 'accepted' })
                    .eq('id', proposalId);
                if (propError) throw propError;

                const { error: jobError } = await supabase
                    .from('jobs')
                    .update({ status: 'visit_scheduled', professional_id: professionalId })
                    .eq('id', jobId);
                if (jobError) throw jobError;

                setAcceptedProposalId(proposalId);
                if (jobId) fetchProposals(jobId);
            },
            {
                loading: 'Confirmando visita...',
                success: '¡Visita confirmada! El profesional fue notificado.',
                error: 'Error al confirmar la visita',
            }
        );
    };

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/client/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Postulaciones recibidas</h1>
                    <p className="text-muted-foreground">
                        {proposals.length === 0
                            ? "Aún no has recibido propuestas para este trabajo."
                            : "Compará los presupuestos y elegí al mejor profesional."}
                    </p>
                </div>
            </div>

            {proposals.length === 0 && (
                <Card className="text-center py-12">
                    <CardContent>
                        <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium">Buscando profesionales...</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mt-2">
                            Tu solicitud está visible para los profesionales de la zona.
                            Recibirás una notificación cuando alguien se postule.
                        </p>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6">
                {proposals.map((proposal) => {
                    const isAccepted = acceptedProposalId === proposal.id;
                    const isOtherAccepted = acceptedProposalId !== null && !isAccepted;
                    const isVisitProposal = proposal.proposal_type === 'visit';

                    if (isOtherAccepted) return null;

                    return (
                        <div key={proposal.id} className="relative group">
                            <div className={`absolute -left-0.5 top-0 bottom-0 w-1 rounded-l-md transition-opacity ${isAccepted ? 'bg-green-500 opacity-100' : 'bg-primary opacity-0 group-hover:opacity-100'}`} />
                            <Card className={`border-l-4 border-transparent transition-all ${isAccepted ? 'border-green-500 ring-1 ring-green-500 bg-green-50/10' : 'hover:border-primary'}`}>
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row gap-6">

                                        {/* Professional Info */}
                                        <div className="w-full md:w-80 flex-shrink-0">
                                            <ProfessionalCard
                                                professional={proposal.professional}
                                                anonymized={!isAccepted}
                                            />
                                            {isAccepted && (
                                                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                                    <div className="bg-green-100 text-green-800 p-3 rounded-md text-sm mb-2">
                                                        <p className="font-bold mb-1">Contacto Liberado:</p>
                                                        <p>Podés ver el teléfono en su perfil completo.</p>
                                                    </div>
                                                    <Button className="w-full" asChild>
                                                        <Link href={`/client/messages?job=${jobId}&pro=${proposal.professional.id}`}>
                                                            Chatear con {proposal.professional.full_name.split(' ')[0]}
                                                        </Link>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Proposal Details */}
                                        <div className="flex-1 space-y-4">
                                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                                <div>
                                                    {isVisitProposal ? (
                                                        <div>
                                                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-amber-500" />
                                                                Propone visita técnica
                                                                <Badge variant="secondary" className="font-normal text-xs bg-amber-100 text-amber-800">
                                                                    Sin precio aún
                                                                </Badge>
                                                            </h3>
                                                            {proposal.visit_date && (
                                                                <p className="text-sm text-muted-foreground mt-1">
                                                                    {new Date(proposal.visit_date).toLocaleDateString('es-AR')} — {proposal.visit_time_slot}
                                                                </p>
                                                            )}
                                                            {proposal.visit_cost === 0
                                                                ? <p className="text-sm text-green-600 font-medium">Visita sin costo</p>
                                                                : proposal.visit_cost > 0 && <p className="text-sm text-muted-foreground">Costo: ${proposal.visit_cost?.toLocaleString()}</p>
                                                            }
                                                        </div>
                                                    ) : (
                                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                                            Presupuesto: ${proposal.quoted_price?.toLocaleString()}
                                                            <Badge variant="secondary" className="font-normal text-xs">
                                                                Por el trabajo completo
                                                            </Badge>
                                                        </h3>
                                                    )}
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        <Clock className="w-3.5 h-3.5 inline mr-1" />
                                                        Recibida {formatRelativeTime(proposal.created_at)}
                                                    </p>
                                                </div>

                                                {/* Action buttons */}
                                                {!isAccepted && !acceptedProposalId && (
                                                    isVisitProposal ? (
                                                        <Button
                                                            onClick={() => handleConfirmVisit(proposal.id, proposal.professional.id)}
                                                            className="bg-amber-500 hover:bg-amber-600"
                                                        >
                                                            <Calendar className="w-4 h-4 mr-2" />
                                                            Confirmar Visita
                                                        </Button>
                                                    ) : (
                                                        <Button onClick={() => handleAccept(proposal.id, proposal.professional.id, proposal.quoted_price)}>
                                                            Contratar
                                                        </Button>
                                                    )
                                                )}

                                                {isAccepted && (
                                                    <Button disabled variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                                        <ShieldCheck className="w-4 h-4 mr-2" />
                                                        {isVisitProposal ? 'Visita Confirmada' : 'Contratado'}
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="bg-muted/30 p-4 rounded-lg">
                                                <p className="text-sm italic">"{proposal.message}"</p>
                                                {isVisitProposal && proposal.visit_notes && (
                                                    <div className="mt-2 pt-2 border-t border-border">
                                                        <p className="text-xs text-muted-foreground font-medium">Evaluará:</p>
                                                        <p className="text-sm">{proposal.visit_notes}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {proposal.estimated_hours && !isVisitProposal && (
                                                <div className="text-sm text-muted-foreground">
                                                    Tiempo estimado: {proposal.estimated_hours} horas
                                                </div>
                                            )}

                                            <Separator />

                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <ShieldCheck className="w-4 h-4 text-green-600" />
                                                <span className="font-medium text-green-700">Garantía Chambea incluida</span>
                                                <span>•</span>
                                                <span>Tu pago se libera solo cuando confirmes el trabajo.</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
