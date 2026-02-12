"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, MapPin, Calendar, DollarSign, MessageSquare, User, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

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

            // Fetch Job + Client + Proposal Status
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

            // Verify if this pro is the one hired OR has a proposal
            const { data: proposal } = await supabase
                .from('proposals')
                .select('status')
                .eq('job_id', id)
                .eq('professional_id', (await supabase.from('profiles').select('id').eq('user_id', user.id).single()).data?.id)
                .single();

            if (!proposal) {
                toast.error("No tienes acceso a este trabajo");
                router.push("/pro/my-jobs");
                return;
            }

            setJob({ ...jobData, proposal_status: proposal.status });

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

    return (
        <div className="space-y-6 max-w-4xl">
            <Button variant="ghost" size="sm" asChild>
                <Link href="/pro/my-jobs">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                </Link>
            </Button>

            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold">{job.title}</h1>
                    <div className="flex items-center gap-2">
                        <Badge variant={isAccepted ? "secondary" : "outline"}>
                            {isAccepted ? "Trabajo Aceptado" : "Postulación Pendiente"}
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
        </div>
    );
}
