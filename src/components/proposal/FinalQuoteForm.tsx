"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, DollarSign, FileText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface FinalQuoteFormProps {
    jobId: string;
    onSuccess?: () => void;
}

export function FinalQuoteForm({ jobId, onSuccess }: FinalQuoteFormProps) {
    const supabase = createClient();
    const [submitting, setSubmitting] = useState(false);
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const parsedPrice = parseFloat(price);
        if (!parsedPrice || parsedPrice <= 0) {
            toast.error("Ingresá un precio válido");
            return;
        }
        if (!description.trim() || description.trim().length < 10) {
            toast.error("Describí el trabajo a realizar (mínimo 10 caracteres)");
            return;
        }

        setSubmitting(true);
        try {
            // Update job: set quoted_price and change status to 'quoted'
            const { error } = await supabase
                .from('jobs')
                .update({
                    quoted_price: parsedPrice,
                    status: 'quoted',
                    // Store the quote description in a note-like field (uses description update approach)
                })
                .eq('id', jobId);

            if (error) throw error;

            // Also update the proposal with the final quoted price
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                if (profile) {
                    await supabase
                        .from('proposals')
                        .update({
                            quoted_price: parsedPrice,
                            message: description,
                            status: 'pending', // Reset to pending so client can accept
                        })
                        .eq('job_id', jobId)
                        .eq('professional_id', profile.id);
                }
            }

            toast.success("¡Presupuesto final enviado! El cliente recibirá una notificación.");
            onSuccess?.();

        } catch (error) {
            console.error(error);
            toast.error("Error al enviar el presupuesto");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                    <FileText className="h-5 w-5" />
                    Enviá tu presupuesto final
                </CardTitle>
                <CardDescription>
                    Completaste la visita. Ahora enviá el presupuesto final para que el cliente lo acepte.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="quote-price" className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            Monto del presupuesto
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                            <Input
                                id="quote-price"
                                type="number"
                                placeholder="0"
                                min="0"
                                step="100"
                                className="pl-7"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="quote-description">Descripción del trabajo a realizar</Label>
                        <Textarea
                            id="quote-description"
                            placeholder="Describí qué incluye este presupuesto: materiales, mano de obra, tiempo estimado..."
                            rows={4}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            required
                            minLength={10}
                        />
                    </div>

                    <Button type="submit" disabled={submitting} className="w-full bg-amber-600 hover:bg-amber-700">
                        {submitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="mr-2 h-4 w-4" />
                        )}
                        Enviar presupuesto al cliente
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
