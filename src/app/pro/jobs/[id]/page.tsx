"use client";

import { JobDetails } from "@/components/job/JobDetails";
import { ProposalForm } from "@/components/proposal/ProposalForm";

const MOCK_JOB = {
    id: "1",
    title: "Instalación de luminarias LED",
    description: "Necesito cambiar 10 lámparas halógenas por paneles LED en una oficina. El techo es de durlock y tiene una altura de 3 metros. Yo proveo los materiales, solo necesito mano de obra.",
    category_id: "electrical",
    subcategory_id: "installation",
    status: "open",
    urgency: "medium",
    created_at: new Date().toISOString(),
    preferred_date: new Date(Date.now() + 86400000).toISOString(),
    preferred_time_slot: "morning",
    client_budget_max: 45000,
    address: "Av. Corrientes 1234",
    city: "Microcentro, CABA",
    work_photos: [],
    client: {
        id: "c1",
        full_name: "Empresa SA",
        avatar_url: "https://github.com/shadcn.png",
        rating: 5.0
    }
} as any;

export default function ProfessionalJobPage({ params }: { params: { id: string } }) {
    // In real app: fetch job by id

    return (
        <div className="space-y-8">
            <JobDetails job={MOCK_JOB} isOwner={false} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ProposalForm jobId={params.id} />
                </div>
            </div>
        </div>
    );
}
