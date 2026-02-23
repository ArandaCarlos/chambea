"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, Zap, FileText, Loader2, Search, Plus } from "lucide-react";

interface Profile { full_name: string; }

export default function ClientDashboard() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/login"); return; }

            const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('user_id', user.id)
                .single();

            setProfile(profileData);
        } catch (error) {
            console.error("Error loading dashboard:", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Welcome Hero — sin botón, solo mensaje */}
            <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
                <h1 className="text-3xl font-bold tracking-tight">
                    Hola, {profile?.full_name || 'Usuario'}! 👋
                </h1>
                <p className="text-muted-foreground mt-2 max-w-xl">
                    Publicá tu problema y recibí presupuestos de profesionales verificados en minutos.
                    Tu dinero está protegido hasta que el trabajo esté terminado.
                </p>
                <div className="flex items-center gap-2 mt-4">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Garantía Chambea
                    </Badge>
                </div>
            </div>

            {/* Dos opciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Opción 1: Contactar profesional */}
                <Card className="border-2 border-orange-200 bg-orange-50/50">
                    <CardContent className="p-6 flex flex-col gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base">Contactar un profesional directamente</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Elegís vos a quién contratar, negociás el precio por chat y lo contratás al instante.
                                </p>
                                <p className="text-sm font-medium text-orange-700 mt-1">Ideal para urgencias o cuando ya sabés quién querés.</p>
                            </div>
                        </div>
                        <Button asChild className="bg-orange-500 hover:bg-orange-600 w-full">
                            <Link href="/client/search">
                                <Search className="w-4 h-4 mr-2" /> Buscar profesional
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Opción 2: Publicar trabajo */}
                <Card className="border-2 border-primary/20 bg-primary/5">
                    <CardContent className="p-6 flex flex-col gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base">Publicar un trabajo y recibir presupuestos</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Describís lo que necesitás, los profesionales de la zona te mandan propuestas y elegís la mejor.
                                </p>
                                <p className="text-sm font-medium text-primary mt-1">Ideal para comparar precios y elegir con calma.</p>
                            </div>
                        </div>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/client/post-job">
                                <Plus className="w-4 h-4 mr-2" /> Publicar trabajo
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
