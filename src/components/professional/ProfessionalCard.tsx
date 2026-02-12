"use client";

import Link from "next/link";
import { Star, MapPin, ShieldCheck, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { JOB_CATEGORIES } from "@/lib/constants/job-categories";
import { formatDistance } from "@/lib/utils/distance";

interface ProfessionalCardProps {
    professional: {
        id: string;
        full_name: string;
        avatar_url?: string | null;
        trade: string; // id
        rating: number;
        reviews_count: number;
        hourly_rate: number;
        location: {
            city: string;
            distance?: number;
        };
        is_verified?: boolean;
        available_now?: boolean;
    };
    anonymized?: boolean;
}

export function ProfessionalCard({ professional, anonymized = false }: ProfessionalCardProps) {
    const category = JOB_CATEGORIES.find(c => c.id === professional.trade);

    // Anti-Leak Logic
    const displayName = anonymized
        ? `${professional.full_name.split(' ')[0]} ${professional.full_name.split(' ')[1]?.[0] || '.'}.`
        : professional.full_name;

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5">
                <div className="flex gap-4">
                    {/* Avatar & Verification */}
                    <div className="relative">
                        <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                            <AvatarImage src={anonymized ? undefined : (professional.avatar_url || undefined)} />
                            <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                                {professional.full_name[0]}
                            </AvatarFallback>
                        </Avatar>
                        {professional.is_verified && (
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm" title="Identidad Verificada">
                                <ShieldCheck className="w-5 h-5 text-blue-500 fill-blue-100" />
                            </div>
                        )}
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-lg truncate">
                                    {displayName}
                                </h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    {category?.name || professional.trade}
                                </p>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded text-sm font-medium text-amber-700 dark:text-amber-400">
                                    <Star className="w-3.5 h-3.5 fill-current" />
                                    <span>{professional.rating.toFixed(1)}</span>
                                </div>
                                <span className="text-xs text-muted-foreground mt-0.5">
                                    ({professional.reviews_count})
                                </span>
                            </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-y-1 gap-x-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>
                                    {professional.location.distance !== undefined
                                        ? `a ${formatDistance(professional.location.distance)}`
                                        : professional.location.city}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 font-medium text-foreground">
                                <span>${professional.hourly_rate.toLocaleString('es-AR')}/h</span>
                            </div>
                        </div>

                        {professional.available_now && (
                            <Badge variant="outline" className="mt-2 text-xs font-normal border-green-200 text-green-700 bg-green-50 gap-1 pl-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                Disponible ahora
                            </Badge>
                        )}

                        {anonymized && (
                            <p className="text-xs text-muted-foreground mt-2 italic bg-muted/50 p-1 rounded inline-block">
                                🔒 Contacto oculto hasta contratar
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>

            {!anonymized && (
                <CardFooter className="p-0 border-t bg-muted/10">
                    <Button variant="ghost" className="w-full rounded-t-none h-12 text-primary font-medium hover:text-primary hover:bg-primary/5" asChild>
                        <Link href={`/client/professionals/${professional.id}`}>
                            Ver perfil completo
                        </Link>
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
