"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ReviewFormProps {
    jobId: string;
    professionalId: string;
    professionalName: string;
    onSuccess?: () => void;
}

export function ReviewForm({ jobId, professionalId, professionalName, onSuccess }: ReviewFormProps) {
    const router = useRouter();
    const supabase = createClient();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const RATING_LABELS: Record<number, string> = {
        1: "Malo",
        2: "Regular",
        3: "Bueno",
        4: "Muy bueno",
        5: "¡Excelente!",
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error("Por favor, seleccioná una calificación de estrellas.");
            return;
        }

        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No autenticado");

            const { data: reviewerProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!reviewerProfile) throw new Error("Perfil no encontrado");

            // Insert review
            const { error: reviewError } = await supabase
                .from('reviews')
                .insert({
                    job_id: jobId,
                    reviewer_id: reviewerProfile.id,
                    reviewee_id: professionalId,
                    review_type: 'client_to_professional',
                    rating,
                    comment: comment.trim() || null,
                });

            if (reviewError) throw reviewError;

            // Mark job as completed if not already
            await supabase
                .from('jobs')
                .update({ status: 'completed', completed_at: new Date().toISOString() })
                .eq('id', jobId);


            // Stats are updated automatically by Postgres triggers (SECURITY DEFINER)

            toast.success("¡Calificación enviada! Gracias por usar Chambea.");

            router.push("/client/dashboard");

        } catch (error: any) {
            console.error(error);
            if (error?.code === '23505') {
                toast.error("Ya calificaste este trabajo.");
            } else {
                toast.error("Error al enviar la calificación. Intentá de nuevo.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3 text-center">
                <Label className="text-lg font-medium">Calificá a {professionalName}</Label>
                <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                        >
                            <Star
                                className={cn(
                                    "w-10 h-10 transition-colors",
                                    (hoverRating || rating) >= star
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-muted-foreground/30"
                                )}
                            />
                        </button>
                    ))}
                </div>
                <p className="text-sm font-medium text-yellow-600 h-5">
                    {(hoverRating || rating) > 0 ? RATING_LABELS[hoverRating || rating] : ""}
                </p>
            </div>

            <div className="space-y-2">
                <Label>Comentario <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                <Textarea
                    placeholder={`¿Qué te pareció el trabajo de ${professionalName}?`}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px] resize-none"
                />
            </div>

            <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting || rating === 0}
            >
                {isSubmitting ? "Enviando..." : "Confirmar y finalizar trabajo"}
            </Button>
        </form>
    );
}
