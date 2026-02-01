"use client";

import Link from "next/link";
import { formatDistance } from "@/lib/utils/distance";
import { formatDate, formatDateTime } from "@/lib/utils/dates";
import { MapPin, Calendar, Clock, DollarSign, User, MessageSquare, ShieldCheck, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { JOB_STATUSES, URGENCY_LEVELS, JOB_CATEGORIES, JobCategory } from "@/lib/constants/job-categories";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";

interface JobDetailsProps {
    job: {
        id: string;
        title: string;
        description: string;
        category_id: string;
        subcategory_id?: string;
        status: keyof typeof JOB_STATUSES;
        urgency: keyof typeof URGENCY_LEVELS;
        created_at: string;
        preferred_date?: string;
        preferred_time_slot?: string;
        client_budget_max?: number;
        address: string;
        city: string;
        work_photos?: string[];
        client: {
            id: string;
            full_name: string;
            avatar_url?: string;
            rating?: number; // Optional if we haven't joined reviews yet
        };
        proposals_count?: number; // From a join
    };
    isOwner?: boolean; // If true, show client controls
}

export function JobDetails({ job, isOwner = false }: JobDetailsProps) {
    const urgency = URGENCY_LEVELS[job.urgency];
    const category = JOB_CATEGORIES.find(c => c.id === job.category_id);
    const statusLabel = JOB_STATUSES[job.status];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline" className="text-sm py-1 px-3 border-primary/20 bg-primary/5 text-primary">
                            {category?.icon} {category?.name}
                        </Badge>
                        <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                            {statusLabel}
                        </Badge>
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>

                    <div className="flex items-center text-sm text-muted-foreground gap-1">
                        <Clock className="w-4 h-4" />
                        Publicado el {formatDateTime(job.created_at)}
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Descripción del problema</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="whitespace-pre-wrap leading-relaxed">
                            {job.description}
                        </p>

                        {job.work_photos && job.work_photos.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-3">Fotos adjuntas</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {job.work_photos.map((photo, i) => (
                                        <div key={i} className="relative aspect-video rounded-md overflow-hidden bg-muted">
                                            <Image
                                                src={photo}
                                                alt={`Foto del trabajo ${i + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
                {/* Action Box */}
                <Card className="border-primary/20 shadow-sm">
                    <CardHeader className="bg-primary/5 pb-4">
                        <CardTitle className="text-lg">Acciones</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-3">
                        {isOwner ? (
                            <>
                                <Button className="w-full" asChild>
                                    <Link href={`/jobs/${job.id}/proposals`}>
                                        Ver {job.proposals_count || 0} postulaciones
                                    </Link>
                                </Button>
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href={`/jobs/${job.id}/edit`}>Editar publicación</Link>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button className="w-full text-lg h-12">
                                    Postularme al trabajo
                                </Button>
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href={`/messages/new?job=${job.id}`}>
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Hacer una pregunta
                                    </Link>
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Details Box */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Detalles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-medium">Ubicación</p>
                                <p className="text-sm text-muted-foreground">{job.address}, {job.city}</p>
                            </div>
                        </div>

                        <Separator />

                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-medium">Fecha Preferida</p>
                                <p className="text-sm text-muted-foreground">
                                    {job.preferred_date ? formatDate(job.preferred_date) : "A coordinar"}
                                </p>
                                {job.preferred_time_slot && (
                                    <p className="text-xs text-muted-foreground capitalize mt-0.5">
                                        Turno: {job.preferred_time_slot === 'morning' ? 'Mañana' : 'Tarde'}
                                    </p>
                                )}
                            </div>
                        </div>

                        <Separator />

                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-medium">Urgencia</p>
                                <Badge
                                    variant="outline"
                                    className={`mt-1 ${job.urgency === 'emergency' ? 'border-red-500 text-red-500' : ''}`}
                                >
                                    {urgency.label}
                                </Badge>
                            </div>
                        </div>

                        <Separator />

                        <div className="flex items-start gap-3">
                            <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-medium">Presupuesto Cliente</p>
                                <p className="text-sm font-semibold text-green-600">
                                    {job.client_budget_max
                                        ? `Hasta $${job.client_budget_max.toLocaleString('es-AR')}`
                                        : "A convenir"
                                    }
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Client Info */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={job.client.avatar_url} />
                                <AvatarFallback>{job.client.full_name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium leading-none mb-1">{job.client.full_name}</p>
                                <div className="flex items-center text-xs text-muted-foreground">
                                    <ShieldCheck className="w-3 h-3 mr-1 text-green-600" />
                                    Cliente verificado
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
