"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, MapPin, Calendar, DollarSign, AlertCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

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
    preferred_date: string | null;
    preferred_time_slot: string | null;
    work_photos: string[] | null;
    created_at: string;
    updated_at: string;
}

export default function ClientJobDetailPage() {
    const router = useRouter();
    const params = useParams();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [job, setJob] = useState<Job | null>(null);
    const [proposalsCount, setProposalsCount] = useState(0);

    const jobId = params?.id ? String(params.id) : null;

    useEffect(() => {
        // console.log("ClientJobPage params:", params);
        if (!jobId || jobId === 'undefined') {
            if (params && Object.keys(params).length > 0) {
                console.error("Invalid Job ID in Client Page:", jobId);
                toast.error("ID de trabajo inválido");
                router.push("/client/jobs");
            }
            return;
        }
        loadJobDetails(jobId);
    }, [jobId, params, router]);

    async function loadJobDetails(id: string) {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            // Get job
            const { data: jobData, error: jobError } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', id)
                .single();

            if (jobError) throw jobError;

            setJob(jobData);

            // Count proposals
            const { count, error: countError } = await supabase
                .from('proposals')
                .select('*', { count: 'exact', head: true })
                .eq('job_id', id);

            if (!countError && count !== null) {
                setProposalsCount(count);
            }
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

    function getStatusBadge(status: string) {
        const statusConfig: Record<string, { label: string; variant: any }> = {
            open: { label: "Abierto", variant: "default" },
            accepted: { label: "Aceptado", variant: "secondary" },
            in_progress: { label: "En Progreso", variant: "secondary" },
            completed: { label: "Completado", variant: "outline" },
            cancelled: { label: "Cancelado", variant: "destructive" },
        };
        const config = statusConfig[status] || { label: status, variant: "default" };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    }

    function getUrgencyBadge(urgency: string) {
        const urgencyConfig: Record<string, { label: string; className: string }> = {
            low: { label: "Baja", className: "bg-blue-100 text-blue-800" },
            medium: { label: "Media", className: "bg-yellow-100 text-yellow-800" },
            high: { label: "Alta", className: "bg-red-100 text-red-800" },
        };
        const config = urgencyConfig[urgency] || { label: urgency, className: "" };
        return <Badge className={config.className}>{config.label}</Badge>;
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
                <p className="text-muted-foreground">Trabajo no encontrado</p>
                <Button asChild className="mt-4">
                    <Link href="/client/jobs">Volver a mis trabajos</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/client/jobs">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Link>
                </Button>
            </div>

            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold">{job.title}</h1>
                    <p className="text-sm text-muted-foreground">
                        Publicado {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: es })}
                    </p>
                </div>
                <div className="flex gap-2">
                    {getStatusBadge(job.status)}
                    {getUrgencyBadge(job.urgency)}
                </div>
            </div>

            {proposalsCount > 0 && job.status === 'open' && (
                <Card className="border-primary/50 bg-primary/5">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="font-semibold">
                                        Tenés {proposalsCount} propuesta{proposalsCount !== 1 ? 's' : ''} nueva{proposalsCount !== 1 ? 's' : ''}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Revisá las ofertas y elegí la que más te convenga
                                    </p>
                                </div>
                            </div>
                            <Button asChild>
                                <Link href={`/client/jobs/${job.id}/proposals`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver propuestas
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Descripción del trabajo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground whitespace-pre-wrap">
                        {job.description}
                    </p>

                    {job.work_photos && job.work_photos.length > 0 && (
                        <div>
                            <h3 className="font-medium mb-2">Fotos adjuntas</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {job.work_photos.map((photo, idx) => (
                                    <img
                                        key={idx}
                                        src={photo}
                                        alt={`Foto ${idx + 1}`}
                                        className="rounded-lg object-cover aspect-square"
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Ubicación</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{job.address}</span>
                        </div>
                        <p className="text-sm">{job.city}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Presupuesto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-2xl font-bold">
                                {job.client_budget_max
                                    ? `$${job.client_budget_max.toLocaleString('es-AR')}`
                                    : 'A convenir'}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Presupuesto máximo</p>
                    </CardContent>
                </Card>

                {job.preferred_date && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Fecha preferida</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(job.preferred_date).toLocaleDateString('es-AR')}</span>
                            </div>
                            {job.preferred_time_slot && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    Horario: {job.preferred_time_slot}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
