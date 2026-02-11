"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { COMMISSION_RATE } from "@/lib/constants/job-categories";

const proposalSchema = z.object({
    quoted_price: z.string().min(1, "Ingresá un precio"),
    estimated_hours: z.string().optional(),
    message: z.string().min(10, "Escribí un mensaje detallado para el cliente"),
});

interface ProposalFormProps {
    jobId: string;
}

export function ProposalForm({ jobId }: ProposalFormProps) {
    const router = useRouter();
    const supabase = createClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasProposed, setHasProposed] = useState(false);
    const [checkingProposal, setCheckingProposal] = useState(true);

    const form = useForm<z.infer<typeof proposalSchema>>({
        resolver: zodResolver(proposalSchema),
        defaultValues: {
            quoted_price: "",
            estimated_hours: "",
            message: "",
        },
    });

    const price = parseFloat(form.watch("quoted_price") || "0");
    const commission = price * COMMISSION_RATE;
    const earnings = price - commission;

    useEffect(() => {
        checkExistingProposal();
    }, [jobId]);

    async function checkExistingProposal() {
        setCheckingProposal(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!profile) return;

            const { data: proposal } = await supabase
                .from('proposals')
                .select('id')
                .eq('job_id', jobId)
                .eq('professional_id', profile.id)
                .maybeSingle();

            if (proposal) {
                setHasProposed(true);
            }
        } catch (error) {
            console.error("Error checking proposal:", error);
        } finally {
            setCheckingProposal(false);
        }
    }

    async function onSubmit(data: z.infer<typeof proposalSchema>) {
        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Debes iniciar sesión");

            // Get profile id
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!profile) throw new Error("No se pudo encontrar tu perfil profesional");

            // Insert proposal
            const { error } = await supabase
                .from('proposals')
                .insert({
                    job_id: jobId,
                    professional_id: profile.id,
                    quoted_price: parseFloat(data.quoted_price),
                    estimated_hours: data.estimated_hours ? parseFloat(data.estimated_hours) : null,
                    message: data.message,
                    status: 'pending'
                });

            if (error) throw error;

            toast.success("¡Propuesta enviada!");
            setHasProposed(true);
            router.refresh();
            // router.push("/pro/my-jobs"); // Optional redirect

        } catch (error) {
            console.error(error);
            toast.error("Error al enviar propuesta");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (checkingProposal) {
        return (
            <Card className="border-2 border-primary/10">
                <CardContent className="py-8 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (hasProposed) {
        return (
            <Card className="border-2 border-primary/10 bg-muted/50" id="proposal-form">
                <CardHeader>
                    <CardTitle className="text-green-600 flex items-center gap-2">
                        <span className="text-xl">✓</span> Ya te postulaste a este trabajo
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">
                        Tu propuesta ya fue enviada y está pendiente de revisión por el cliente.
                    </p>
                    <Button variant="outline" className="w-full" onClick={() => router.push("/pro/my-jobs")}>
                        Ver mis postulaciones
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-2 border-primary/10" id="proposal-form">
            <CardHeader>
                <CardTitle>Enviar Propuesta</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="quoted_price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tu Presupuesto Total ($)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="15000" {...field} />
                                        </FormControl>
                                        <FormDescription>Precio final incluyendo materiales y mano de obra.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="estimated_hours"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Horas estimadas (Op.)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="4" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {price > 0 && (
                            <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                                <div className="flex justify-between">
                                    <span>Precio Cliente:</span>
                                    <span className="font-medium">${price.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Comisión Chambea (15%):</span>
                                    <span>-${commission.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-t border-border pt-1 mt-1 font-bold text-green-600">
                                    <span>Tu ganancia neta:</span>
                                    <span>${earnings.toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mensaje al cliente</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Hola, tengo experiencia en este tipo de trabajos. Puedo ir mañana a..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                "Enviar Presupuesto"
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
