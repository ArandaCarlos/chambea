"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
    Loader2, ArrowLeft, MapPin, Calendar, DollarSign,
    AlertCircle, Eye, MessageSquare, User, CheckCircle2, XCircle, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
    quoted_price: number | null;
    urgency: string;
    preferred_date: string | null;
    preferred_time_slot: string | null;
    work_photos: string[] | null;
    created_at: string;
    updated_at: string;
    professional?: {
        id: string;
        full_name: string;
        phone: string | null;
        email: string | null;
        avatar_url: string | null;
    } | null;
}

export default function ClientJobDetailPage() {
    const router = useRouter();
    const params = useParams();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [job, setJob] = useState<Job | null>(null);
    const [proposalsCount, setProposalsCount] = useState(0);
    const [accepting, setAccepting] = useState(false);

    const jobId = params?.id ? String(params.id) : null;

    useEffect(() => {
        if (!jobId || jobId === 'undefined') {
            if (params && Object.keys(params).length > 0) {
                toast.error("ID de trabajo inválido");
                router.push("/client/jobs");
            }
            return;
        }
        loadJobDetails(jobId);
    }, [jobId]);

    async function loadJobDetails(id: string) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/login"); return; }

            const { data: jobData, error: jobError } = await supabase
                .from('jobs')
                .select('*, professional:professional_id(*)')
                .eq('id', id)
                .single();

            if (jobError) throw jobError;
            setJob(jobData);

            const { count } = await supabase
                .from('proposals')
                .select('*', { count: 'exact', head: true })
                .eq('job_id', id);

            setProposalsCount(count || 0);
        } catch (error: any) {
            console.error("Error loading job:", error);
            if (error.code === 'PGRST116') {
                toast.error("Trabajo no encontrado");
                router.push("/client/jobs");
            } else {
                toast.error("Error al cargar el trabajo");
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleAcceptQuote() {
        if (!job) return;
        setAccepting(true);
        try {
            const { error } = await supabase
                .from('jobs')
                .update({ status: 'accepted' })
                .eq('id', job.id);

            if (error) throw error;

            // Also mark the proposal as accepted
            await supabase
                .from('proposals')
                .update({ status: 'accepted' })
                .eq('job_id', job.id)
                .eq('professional_id', job.professional?.id);

            toast.success("¡Presupuesto aceptado! Ya podés coordinar el trabajo.");
            loadJobDetails(job.id);
        } catch (error) {
            console.error(error);
            toast.error("Error al aceptar el presupuesto");
        } finally {
            setAccepting(false);
        }
    }

    async function handleRejectQuote() {
        if (!job) return;
        setAccepting(true);
        try {
            // Reset job to open so others can bid, clear professional
            const { error } = await supabase
                .from('jobs')
                .update({ status: 'open', professional_id: null, quoted_price: null })
                .eq('id', job.id);

            if (error) throw error;

            await supabase
                .from('proposals')
                .update({ status: 'rejected' })
                .eq('job_id', job.id)
                .eq('professional_id', job.professional?.id);

            toast.success("Presupuesto rechazado. El trabajo volvió a estar abierto.");
            loadJobDetails(job.id);
        } catch (error) {
            console.error(error);
            toast.error("Error al rechazar el presupuesto");
        } finally {
            setAccepting(false);
        }
    }

    function getStatusBadge(status: string) {
        const cfg: Record<string, { label: string; className: string }> = {
            open: { label: "Abierto", className: "" },
            visit_scheduled: { label: "Visita Agendada", className: "bg-amber-100 text-amber-800 border-amber-200" },
            quoted: { label: "Presupuesto Recibido", className: "bg-blue-100 text-blue-800 border-blue-200" },
            accepted: { label: "Aceptado", className: "bg-green-100 text-green-800 border-green-200" },
            in_progress: { label: "En Progreso", className: "" },
            completed: { label: "Completado", className: "" },
            cancelled: { label: "Cancelado", className: "" },
        };
        const c = cfg[status] || { label: status, className: "" };
        return <Badge className={c.className}>{c.label}</Badge>;
    }

    if (loading) {
        return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!job) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Trabajo no encontrado</p>
                <Button asChild className="mt-4"><Link href="/client/jobs">Volver a mis trabajos</Link></Button>
            </div>
        );
    }

    const isAccepted = ['accepted', 'in_progress', 'completed'].includes(job.status);
    const isVisitScheduled = job.status === 'visit_scheduled';
    const isQuoted = job.status === 'quoted';

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/client/jobs"><ArrowLeft className="mr-2 h-4 w-4" />Volver</Link>
                </Button>
            </div>

            <div className="flex bg-white rounded-lg shadow-sm border p-4 items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold">{job.title}</h1>
                    {getStatusBadge(job.status)}
                </div>
            </div>

            {/* ── QUOTED: Final quote from professional ── */}
            {isQuoted && job.professional && (
                <Card className="border-blue-300 bg-blue-50/40">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-800">
                            <DollarSign className="h-5 w-5" />
                            Presupuesto final recibido
                        </CardTitle>
                        <CardDescription>
                            {job.professional.full_name} envió su presupuesto final tras la visita técnica. Revisalo y decidí.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-white rounded-lg p-4 border text-center">
                            <p className="text-4xl font-bold text-blue-700">${job.quoted_price?.toLocaleString('es-AR')}</p>
                            <p className="text-sm text-muted-foreground mt-1">Monto total del trabajo</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={handleAcceptQuote}
                                disabled={accepting}
                            >
                                {accepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                Aceptar presupuesto
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                                onClick={handleRejectQuote}
                                disabled={accepting}
                            >
                                <XCircle className="mr-2 h-4 w-4" /> Rechazar
                            </Button>
                        </div>
                        <Separator />
                        <Button
                            variant="ghost"
                            className="w-full text-muted-foreground"
                            asChild
                        >
                            <Link href={`/client/messages?job=${job.id}&pro=${job.professional.id}`}>
                                <MessageSquare className="mr-2 h-4 w-4" /> Hablar con el profesional antes de decidir
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* ── VISIT SCHEDULED: waiting for pro to come ── */}
            {isVisitScheduled && job.professional && (
                <Card className="border-amber-200 bg-amber-50/40">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-800">
                            <Clock className="h-5 w-5" /> Visita técnica agendada
                        </CardTitle>
                        <CardDescription>
                            {job.professional.full_name} va a hacer una visita para evaluar el trabajo y enviarte el presupuesto final.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full" asChild>
                            <Link href={`/client/messages?job=${job.id}&pro=${job.professional.id}`}>
                                <MessageSquare className="mr-2 h-4 w-4" /> Coordinar por chat
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* ── ACCEPTED: hired professional ── */}
            {isAccepted && job.professional && (
                <Card className="border-green-200 bg-green-50/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-800">
                            <CheckCircle2 className="h-5 w-5" /> Profesional Contratado
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg">
                                {job.professional.full_name[0]}
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{job.professional.full_name}</h3>
                                <p className="text-sm text-muted-foreground">{job.professional.phone || "Teléfono no disponible"}</p>
                            </div>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                            <Button className="flex-1 bg-green-600 hover:bg-green-700" asChild>
                                <Link href={`/client/messages?job=${job.id}&pro=${job.professional.id}`}>
                                    <MessageSquare className="mr-2 h-4 w-4" /> Chatear
                                </Link>
                            </Button>
                            <Button variant="outline" className="flex-1 border-green-200 text-green-700 hover:bg-green-50" asChild>
                                <Link href={`/client/professionals/${job.professional.id}`}>
                                    <User className="mr-2 h-4 w-4" /> Ver Perfil
                                </Link>
                            </Button>
                        </div>
                        {job.status === 'accepted' && (
                            <Button
                                className="w-full mt-3 bg-primary/90 hover:bg-primary"
                                asChild
                            >
                                <Link href={`/client/jobs/${job.id}/complete`}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Marcar como completado y calificar
                                </Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ── OPEN: show proposals CTA ── */}
            {proposalsCount > 0 && job.status === 'open' && (
                <Card className="border-primary/50 bg-primary/5">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="font-semibold">Tenés {proposalsCount} propuesta{proposalsCount !== 1 ? 's' : ''} nueva{proposalsCount !== 1 ? 's' : ''}</p>
                                    <p className="text-sm text-muted-foreground">Revisá las ofertas y elegí la que más te convenga</p>
                                </div>
                            </div>
                            <Button asChild>
                                <Link href={`/client/jobs/${job.id}/proposals`}>
                                    <Eye className="mr-2 h-4 w-4" /> Ver propuestas
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Job details */}
            <Card>
                <CardHeader><CardTitle>Descripción del trabajo</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                    {job.work_photos && job.work_photos.length > 0 && (
                        <div>
                            <h3 className="font-medium mb-2">Fotos adjuntas</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {job.work_photos.map((photo, idx) => (
                                    <img key={idx} src={photo} alt={`Foto ${idx + 1}`} className="rounded-lg object-cover aspect-square" />
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle className="text-lg">Ubicación</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" /><span>{job.address}</span>
                        </div>
                        <p className="text-sm mt-1">{job.city}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            {isAccepted || isQuoted ? 'Presupuesto acordado' : 'Presupuesto'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-2xl font-bold">
                                {(isAccepted || isQuoted) && job.quoted_price
                                    ? `$${job.quoted_price.toLocaleString('es-AR')}`
                                    : job.client_budget_max
                                        ? `$${job.client_budget_max.toLocaleString('es-AR')}`
                                        : 'A convenir'}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {(isAccepted || isQuoted) && job.quoted_price ? 'Monto final del profesional' : 'Presupuesto máximo'}
                        </p>
                    </CardContent>
                </Card>

                {job.preferred_date && (
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Fecha preferida</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(job.preferred_date).toLocaleDateString('es-AR')}</span>
                            </div>
                            {job.preferred_time_slot && (
                                <p className="text-sm text-muted-foreground mt-1">Horario: {job.preferred_time_slot}</p>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
