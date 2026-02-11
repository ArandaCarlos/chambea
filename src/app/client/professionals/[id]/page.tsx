"use client";

import { ProfessionalProfile } from "@/components/professional/ProfessionalProfile";
import { useParams } from "next/navigation";
// import { getProfessionalById } from "@/lib/api/professionals"; (Simulated for now)

// Mock Data
const MOCK_PROFILE = {
    id: "1",
    full_name: "Juan Pérez",
    avatar_url: "https://github.com/shadcn.png",
    bio: "Soy plomero matriculado con más de 10 años de experiencia en reparaciones domésticas e industriales. Especialista en detección de fugas y destapes.",
    city: "Palermo, CABA",
    trade: "plumbing",
    hourly_rate: 8000,
    rating: 4.8,
    reviews_count: 124,
    completed_jobs: 1450,
    is_verified: true,
    available_now: true,
    portfolio_photos: [
        "https://images.unsplash.com/photo-1581244277943-fe4a9c77718e?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1505798577917-a651a4809f19?q=80&w=600&auto=format&fit=crop"
    ],
    badges: ["Garantía de Satisfacción", "Respuesta Rápida"]
};

export default function ProfessionalPage() {
    const params = useParams();
    // In a real app we'd fetch data using params.id
    // const profile = await getProfessionalById(params.id);
    const profile = MOCK_PROFILE;

    return <ProfessionalProfile profile={profile} />;
}
