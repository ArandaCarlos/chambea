"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JOB_CATEGORIES } from "@/lib/constants/job-categories";
import { Star, MapPin, ShieldCheck, CheckCircle2, Clock, Zap } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { useState } from "react";
import { UrgentContactModal } from "@/components/urgent/UrgentContactModal";

interface Review {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    reviewer: { full_name: string; avatar_url?: string } | null;
}

interface ProfessionalProfileProps {
    profile: {
        id: string;
        full_name: string;
        avatar_url?: string;
        bio?: string;
        city: string;
        trade: string;
        hourly_rate: number;
        rating: number;
        reviews_count: number;
        completed_jobs: number;
        is_verified: boolean;
        available_now: boolean;
        portfolio_photos?: string[];
    };
    reviews?: Review[];
}

function StarRow({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <Star
                    key={s}
                    className={`w-4 h-4 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`}
                />
            ))}
        </div>
    );
}

export function ProfessionalProfile({ profile, reviews = [] }: ProfessionalProfileProps) {
    const category = JOB_CATEGORIES.find(c => c.id === profile.trade);
    const [showContactModal, setShowContactModal] = useState(false);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-card rounded-xl p-6 shadow-sm border space-y-6 md:space-y-0 md:flex md:gap-8">
                <div className="flex-shrink-0 flex justify-center md:block">
                    <div className="relative">
                        <Avatar className="w-32 h-32 border-4 border-background shadow-md">
                            <AvatarImage src={profile.avatar_url} />
                            <AvatarFallback className="text-4xl">{profile.full_name[0]}</AvatarFallback>
                        </Avatar>
                        {profile.is_verified && (
                            <div className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow-sm">
                                <ShieldCheck className="w-8 h-8 text-blue-500 fill-blue-50" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 text-center md:text-left space-y-4">
                    <div>
                        <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2 text-muted-foreground">
                            <span className="font-medium text-foreground bg-secondary/10 px-2 py-0.5 rounded">
                                {category?.name || profile.trade}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" /> {profile.city}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-6 py-2">
                        <div className="text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-1 font-bold text-xl">
                                {Number(profile.rating).toFixed(1)} <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            </div>
                            <p className="text-xs text-muted-foreground">{profile.reviews_count} reseñas</p>
                        </div>

                        <div className="w-px bg-border h-10" />

                        <div className="text-center md:text-left">
                            <div className="font-bold text-xl">{profile.completed_jobs}</div>
                            <p className="text-xs text-muted-foreground">Trabajos hechos</p>
                        </div>

                        <div className="w-px bg-border h-10" />

                        <div className="text-center md:text-left">
                            <div className="font-bold text-xl text-green-600">
                                ${profile.hourly_rate?.toLocaleString('es-AR') || '—'}
                            </div>
                            <p className="text-xs text-muted-foreground">Hora estimada</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button
                            size="lg"
                            className="bg-orange-500 hover:bg-orange-600"
                            onClick={() => setShowContactModal(true)}
                        >
                            <Zap className="w-4 h-4 mr-2" />
                            Contactar ahora
                        </Button>
                        {/* POST-JOB HIDDEN: Boton "Solicitar trabajo" removido */}
                    </div>

                    {/* Urgent Contact Modal */}
                    <UrgentContactModal
                        open={showContactModal}
                        onClose={() => setShowContactModal(false)}
                        professional={{
                            id: profile.id,
                            full_name: profile.full_name,
                            trade: profile.trade,
                        }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Bio */}
                    <Card>
                        <CardHeader><CardTitle>Sobre mí</CardTitle></CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                                {profile.bio || "Este profesional aún no ha agregado una descripción."}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Portfolio */}
                    {profile.portfolio_photos && profile.portfolio_photos.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>Portfolio</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {profile.portfolio_photos.map((photo, i) => (
                                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-90 transition-opacity cursor-pointer">
                                            <Image src={photo} alt={`Portfolio ${i}`} fill className="object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Reviews */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Reseñas
                                {reviews.length > 0 && (
                                    <Badge variant="secondary">{reviews.length}</Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {reviews.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">
                                    Todavía no hay reseñas para este profesional.
                                </p>
                            ) : (
                                <div className="space-y-5">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="space-y-2">
                                            <div className="flex items-start gap-3">
                                                <Avatar className="w-9 h-9 flex-shrink-0">
                                                    <AvatarImage src={review.reviewer?.avatar_url} />
                                                    <AvatarFallback>
                                                        {review.reviewer?.full_name?.[0] ?? "?"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-medium text-sm">
                                                            {review.reviewer?.full_name ?? "Cliente"}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: es })}
                                                        </span>
                                                    </div>
                                                    <StarRow rating={review.rating} />
                                                    {review.comment && (
                                                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                                            {review.comment}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Separator between reviews */}
                                            <div className="border-b last:border-0 pt-2" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Disponibilidad</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {profile.available_now ? (
                                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>
                                    <span className="font-medium">Disponible ahora</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-muted-foreground bg-muted p-3 rounded-lg">
                                    <Clock className="w-5 h-5" />
                                    <span>No disponible ahora</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-lg">Verificaciones</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className={`flex items-center gap-2 text-sm ${profile.is_verified ? 'text-green-600' : 'text-muted-foreground'}`}>
                                <CheckCircle2 className="w-5 h-5" />
                                <span>Identidad {profile.is_verified ? 'verificada' : 'sin verificar'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-green-500">
                                <CheckCircle2 className="w-5 h-5" />
                                <span>Email verificado</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
