"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProfessionalCard } from "@/components/professional/ProfessionalCard";
import { JOB_CATEGORIES } from "@/lib/constants/job-categories";
import { createClient } from "@/lib/supabase/client";
import {
    ShieldCheck, Plus, Search, Zap, FileText, Loader2,
    Star, Users
} from "lucide-react";

interface Profile { full_name: string; }

interface Professional {
    id: string;
    full_name: string;
    avatar_url: string | null;
    trade: string;
    rating: number;
    reviews_count: number;
    hourly_rate: number;
    location: { city: string; distance?: number };
    is_verified: boolean;
    available_now: boolean;
}

export default function ClientDashboard() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");

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

            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    id, full_name, avatar_url, city, identity_verified,
                    professional_profiles (
                        trade, hourly_rate, available_now, average_rating, total_reviews
                    )
                `)
                .eq('user_type', 'professional')
                .eq('is_active', true);

            if (!error && data) {
                const pros = data
                    .filter((p: any) => p.professional_profiles !== null)
                    .map((p: any) => {
                        const pp = p.professional_profiles;
                        return {
                            id: p.id,
                            full_name: p.full_name,
                            avatar_url: p.avatar_url,
                            location: { city: p.city || 'CABA', distance: 0 },
                            trade: pp.trade || 'general',
                            hourly_rate: pp.hourly_rate || 0,
                            is_verified: p.identity_verified || false,
                            available_now: pp.available_now || false,
                            rating: pp.average_rating || 0,
                            reviews_count: pp.total_reviews || 0,
                        };
                    });
                setProfessionals(pros);
            }
        } catch (error) {
            console.error("Error loading dashboard:", error);
        } finally {
            setLoading(false);
        }
    }

    const filteredPros = professionals.filter(pro => {
        const matchesSearch = !searchTerm ||
            pro.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pro.trade.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "all" || pro.trade === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Welcome Hero */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-primary/5 p-6 rounded-xl border border-primary/10">
                <div>
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
                <div className="w-full md:w-auto">
                    <Button asChild size="lg" className="w-full md:w-auto text-lg h-14 px-8 shadow-lg hover:shadow-xl transition-all">
                        <Link href="/client/post-job">
                            <Plus className="mr-2 h-6 w-6" />
                            PUBLICAR TRABAJO
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Two-option explanation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option 1: Find pro directly */}
                <Card className="border-2 border-orange-200 bg-orange-50/50">
                    <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base">Contactar un profesional directamente</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Elegís vos a quién contratar. Buscás un profesional abajo, lo contactás, negociás el precio por chat y lo contratás al instante.
                                    <span className="block mt-1 font-medium text-orange-700">Ideal para urgencias o cuando ya sabés quién querés.</span>
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Option 2: Post a job */}
                <Card className="border-2 border-primary/20 bg-primary/5">
                    <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base">Publicar un trabajo y recibir presupuestos</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Describís lo que necesitás y los profesionales de la zona te mandan sus propuestas. Comparás y elegís la mejor opción.
                                    <span className="block mt-1 font-medium text-primary">Ideal para trabajos más complejos donde querés comparar precios.</span>
                                </p>
                                <Button asChild size="sm" variant="outline" className="mt-3">
                                    <Link href="/client/post-job">
                                        <Plus className="w-3 h-3 mr-1" /> Publicar trabajo
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Professional Search — main section */}
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Users className="w-5 h-5 text-orange-500" />
                            Profesionales disponibles
                        </h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {professionals.length > 0
                                ? `${professionals.length} profesional${professionals.length !== 1 ? 'es' : ''} en tu zona`
                                : 'Buscando profesionales...'}
                        </p>
                    </div>
                </div>

                {/* Search + Filter bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-9"
                            placeholder="Buscar por nombre o servicio..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full sm:w-52">
                            <SelectValue placeholder="Todas las categorías" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las categorías</SelectItem>
                            {JOB_CATEGORIES.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Results */}
                {filteredPros.length === 0 ? (
                    <Card className="p-10 text-center">
                        <Star className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                        <p className="text-muted-foreground font-medium">
                            {professionals.length === 0
                                ? "Todavía no hay profesionales registrados en la plataforma."
                                : "No se encontraron profesionales con esos filtros."}
                        </p>
                        {professionals.length > 0 && (
                            <button
                                className="text-sm text-primary mt-2 underline"
                                onClick={() => { setSearchTerm(""); setSelectedCategory("all"); }}
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPros.map(pro => (
                            <ProfessionalCard key={pro.id} professional={pro} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
