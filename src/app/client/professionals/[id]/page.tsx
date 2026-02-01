"use client";

import { ProfessionalProfile } from "@/components/professional/ProfessionalProfile";
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

// Params type needed for Next.js App Router dynamic pages
interface PageProps {
    params: {
        id: string;
    };
}

// In Next.js 15+, params is a Promise, but in 14 it's just params.
// We'll stick to basic usage or handle searchParams.
export default function ProfessionalPage({ params }: PageProps) {
    // In a real app we'd fetch data here:
    // const profile = await getProfessionalById(params.id);
    const profile = MOCK_PROFILE;

    return <ProfessionalProfile profile={profile} />;
}
