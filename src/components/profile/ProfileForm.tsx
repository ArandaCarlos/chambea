"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, User, Mail, Phone, MapPin, Briefcase } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Profile {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    user_type: 'client' | 'professional' | 'admin';
    avatar_url: string | null;
}

export function ProfileForm() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [formData, setFormData] = useState({
        full_name: "",
        phone: "",
        address: "",
        city: "",
    });

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Handle redirect depending on context, or just return
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) {
                console.error("Profile fetch error:", error);
                throw error;
            }

            console.log("Profile loaded:", data);
            setProfile(data);
            setFormData({
                full_name: data.full_name || "",
                phone: data.phone || "",
                address: data.address || "",
                city: data.city || "",
            });
        } catch (error) {
            console.error("Error loading profile:", error);
            toast.error("Error al cargar el perfil");
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!profile) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                })
                .eq('id', profile.id);

            if (error) throw error;

            toast.success("Perfil actualizado correctamente");
            loadProfile(); // Reload to get fresh data
            router.refresh(); // Refresh server components if any
        } catch (error) {
            console.error("Error saving profile:", error);
            toast.error("Error al guardar cambios");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">No se pudo cargar el perfil</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold">Mi Perfil</h1>
                <p className="text-muted-foreground mt-2">
                    Administrá tu información personal
                </p>
            </div>

            <div className="grid gap-6">
                {/* User Type Badge */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Tipo de cuenta</CardTitle>
                                <CardDescription>Tu rol en la plataforma</CardDescription>
                            </div>
                            <Badge variant="outline" className="ml-auto">
                                {profile.user_type === 'client' && '👤 Cliente'}
                                {profile.user_type === 'professional' && '🔧 Profesional'}
                                {profile.user_type === 'admin' && '👑 Admin'}
                            </Badge>
                        </div>
                    </CardHeader>
                </Card>

                {/* Personal Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Información Personal</CardTitle>
                        <CardDescription>Actualizá tus datos de contacto</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Nombre completo</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="full_name"
                                    className="pl-10"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="Juan Pérez"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    className="pl-10"
                                    value={profile.email}
                                    disabled
                                    placeholder="email@ejemplo.com"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                El email no se puede modificar
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    className="pl-10"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+54 9 11 1234-5678"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Dirección</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="address"
                                    className="pl-10"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Av. Corrientes 1234"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="city">Ciudad</Label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="city"
                                    className="pl-10"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    placeholder="CABA"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    "Guardar cambios"
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={loadProfile}
                                disabled={saving}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
