"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ReviewFormProps {
    jobId: string;
    professionalName: string;
}

export function ReviewForm({ jobId, professionalName }: ReviewFormProps) {
    const router = useRouter();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error("Por favor, seleccioná una calificación de estrellas.");
            return;
        }

        setIsSubmitting(true);

        // Simulate API call
        await new Promise(r => setTimeout(r, 1500));

        toast.success("¡Calificación enviada! Gracias por usar Chambea.");
        router.push("/client/dashboard");
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 text-center">
                <Label className="text-lg">Calificá a {professionalName}</Label>
                <div className="flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className="focus:outline-none transition-transform hover:scale-110"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                        >
                            <Star
                                className={cn(
                                    "w-10 h-10",
                                    (hoverRating || rating) >= star
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-muted-foreground/30"
                                )}
                            />
                        </button>
                    ))}
                </div>
                <p className="text-sm text-muted-foreground h-4">
                    {rating === 1 && "Malo"}
                    {rating === 2 && "Regular"}
                    {rating === 3 && "Bueno"}
                    {rating === 4 && "Muy Bueno"}
                    {rating === 5 && "¡Excelente!"}
                </p>
            </div>

            <div className="space-y-2">
                <Label>Comentario (Opcional)</Label>
                <Textarea
                    placeholder={`¿Qué te pareció el trabajo de ${professionalName}?`}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px]"
                />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Confirmar y Finalizar Trabajo"}
            </Button>
        </form>
    );
}
