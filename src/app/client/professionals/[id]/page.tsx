"use client";

import { useEffect, useState } from "react";
import { ProfessionalProfile } from "@/components/professional/ProfessionalProfile";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ProfessionalPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const professionalId = params?.id ? String(params.id) : null;

    useEffect(() => {
        if (professionalId) {
            loadProfessional(professionalId);
        }
    }, [professionalId]);

    async function loadProfessional(id: string) {
        try {
            // Fetch basic profile + professional profile
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    professional:professional_profiles(*)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            if (!data.professional) {
                toast.error("Perfil de profesional incompleto");
                router.back();
                return;
            }

            // Transform to component format
            const transformedProfile = {
                id: data.id,
                full_name: data.full_name,
                avatar_url: data.avatar_url,
                bio: data.bio || "Este profesional aún no ha agregado una descripción.",
                city: data.city || "Ubicación no disponible",
                trade: data.professional.trade,
                hourly_rate: data.professional.hourly_rate,
                rating: data.professional.average_rating || 0,
                reviews_count: data.professional.total_reviews || 0,
                completed_jobs: 0, // Need to count from jobs table if needed
                is_verified: data.identity_verified,
                available_now: data.professional.available_now,
                portfolio_photos: data.professional.portfolio_photos || [],
                badges: data.professional.badges || []
            };

            setProfile(transformedProfile);

        } catch (error) {
            console.error("Error loading professional:", error);
            toast.error("Error al cargar el perfil");
            router.push("/client/dashboard");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!profile) return null;

    return <ProfessionalProfile profile={profile} />;
}
