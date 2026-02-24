"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, User, MapPin, Phone, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ClientProfile {
    id: string;
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
    city: string | null;
    province: string | null;
    created_at: string;
    is_active: boolean;
}

export default function ClientProfilePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const supabase = createClient();
    const [profile, setProfile] = useState<ClientProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!id) return;
        (async () => {
            // Verify current user is a pro
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/login"); return; }

            const { data: me } = await supabase
                .from('profiles')
                .select('user_type')
                .eq('user_id', user.id)
                .single();

            if (me?.user_type !== 'professional') { router.push("/"); return; }

            // Load target client profile
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, phone, city, province, created_at, is_active')
                .eq('id', id)
                .eq('user_type', 'client')
                .single();

            if (error || !data) { setNotFound(true); }
            else { setProfile(data); }
            setLoading(false);
        })();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (notFound || !profile) {
        return (
            <div className="max-w-xl mx-auto py-12 text-center space-y-4">
                <User className="h-16 w-16 mx-auto text-muted-foreground" />
                <h2 className="text-xl font-bold">Perfil no encontrado</h2>
                <p className="text-muted-foreground">Este cliente no existe o no está disponible.</p>
                <Button asChild variant="outline">
                    <Link href="/pro/messages"><ArrowLeft className="w-4 h-4 mr-1" /> Volver a mensajes</Link>
                </Button>
            </div>
        );
    }

    const initials = profile.full_name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('');

    const memberSince = new Date(profile.created_at).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

    return (
        <div className="max-w-2xl mx-auto space-y-6 py-6">
            <Button variant="ghost" asChild className="mb-2">
                <Link href="/pro/messages"><ArrowLeft className="w-4 h-4 mr-1" /> Volver</Link>
            </Button>

            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback className="text-2xl bg-primary/10 text-primary">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary">Cliente</Badge>
                                {profile.is_active && (
                                    <Badge className="bg-green-100 text-green-700 border-green-300">Activo</Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Miembro desde {memberSince}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {(profile.city || profile.province) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span>{[profile.city, profile.province].filter(Boolean).join(', ')}</span>
                        </div>
                    )}
                    {profile.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span>{profile.phone}</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
