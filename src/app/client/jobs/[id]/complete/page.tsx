"use client";

import { CheckCircle2 } from "lucide-react";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompleteJobPage({ params }: { params: { id: string } }) {
    // Mock Data
    const job = {
        id: params.id,
        title: "Instalación de luminarias LED",
        professional: {
            name: "Juan Pérez"
        },
        amount: 15000
    };

    return (
        <div className="max-w-md mx-auto py-10 space-y-8">
            <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold">¡Trabajo Completado!</h1>
                <p className="text-muted-foreground">
                    El profesional marcó el trabajo como terminado.
                    Por favor confirmá que todo está en orden y dejá tu calificación para liberar el pago.
                </p>
            </div>

            <Card>
                <CardHeader className="text-center border-b bg-muted/20 pb-4">
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <p className="font-mono text-2xl font-bold mt-2">${job.amount.toLocaleString()}</p>
                </CardHeader>
                <CardContent className="pt-6">
                    <ReviewForm jobId={job.id} professionalName={job.professional.name} />
                </CardContent>
            </Card>
        </div>
    );
}
