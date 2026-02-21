"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, DollarSign, Calendar } from "lucide-react";
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

// Schema changes based on proposal type
const priceSchema = z.object({
    proposal_type: z.literal("price"),
    quoted_price: z.string().min(1, "Ingresá un precio"),
    estimated_hours: z.string().optional(),
    message: z.string().min(10, "Escribí un mensaje detallado para el cliente"),
});

const visitSchema = z.object({
    proposal_type: z.literal("visit"),
    visit_date: z.string().min(1, "Seleccioná una fecha para la visita"),
    visit_time_slot: z.string().min(1, "Seleccioná un horario"),
    visit_cost: z.string().optional(),
    visit_notes: z.string().min(10, "Describí qué vas a evaluar en la visita"),
    message: z.string().min(10, "Escribí un mensaje para el cliente"),
});

const proposalSchema = z.discriminatedUnion("proposal_type", [priceSchema, visitSchema]);

type ProposalFormData = z.infer<typeof proposalSchema>;

interface ProposalFormProps {
    jobId: string;
}

export function ProposalForm({ jobId }: ProposalFormProps) {
    const router = useRouter();
    const supabase = createClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasProposed, setHasProposed] = useState(false);
    const [checkingProposal, setCheckingProposal] = useState(true);
    const [proposalType, setProposalType] = useState<"price" | "visit">("price");

    const priceForm = useForm<z.infer<typeof priceSchema>>({
        resolver: zodResolver(priceSchema),
        defaultValues: {
            proposal_type: "price",
            quoted_price: "",
            estimated_hours: "",
            message: "",
        },
    });

    const visitForm = useForm<z.infer<typeof visitSchema>>({
        resolver: zodResolver(visitSchema),
        defaultValues: {
            proposal_type: "visit",
            visit_date: "",
            visit_time_slot: "",
            visit_cost: "0",
            visit_notes: "",
            message: "",
        },
    });

    const price = parseFloat(priceForm.watch("quoted_price") || "0");
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

    async function handlePriceSubmit(data: z.infer<typeof priceSchema>) {
        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Debes iniciar sesión");

            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!profile) throw new Error("No se pudo encontrar tu perfil");

            const { error } = await supabase
                .from('proposals')
                .insert({
                    job_id: jobId,
                    professional_id: profile.id,
                    proposal_type: 'price',
                    quoted_price: parseFloat(data.quoted_price),
                    estimated_hours: data.estimated_hours ? parseFloat(data.estimated_hours) : null,
                    message: data.message,
                    status: 'pending',
                });

            if (error) throw error;

            toast.success("¡Presupuesto enviado!");
            setHasProposed(true);
            router.refresh();

        } catch (error) {
            console.error(error);
            toast.error("Error al enviar el presupuesto");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleVisitSubmit(data: z.infer<typeof visitSchema>) {
        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Debes iniciar sesión");

            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!profile) throw new Error("No se pudo encontrar tu perfil");

            const { error } = await supabase
                .from('proposals')
                .insert({
                    job_id: jobId,
                    professional_id: profile.id,
                    proposal_type: 'visit',
                    quoted_price: 0, // No price yet, will be set after visit
                    visit_date: new Date(data.visit_date).toISOString(),
                    visit_time_slot: data.visit_time_slot,
                    visit_cost: data.visit_cost ? parseFloat(data.visit_cost) : 0,
                    visit_notes: data.visit_notes,
                    message: data.message,
                    status: 'pending',
                });

            if (error) throw error;

            toast.success("¡Propuesta de visita enviada!");
            setHasProposed(true);
            router.refresh();

        } catch (error) {
            console.error(error);
            toast.error("Error al enviar la propuesta de visita");
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

                {/* Toggle: Price vs Visit */}
                <div className="flex gap-2 mt-2">
                    <button
                        type="button"
                        onClick={() => setProposalType("price")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${proposalType === "price"
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                            }`}
                    >
                        <DollarSign className="h-4 w-4" />
                        Presupuesto directo
                    </button>
                    <button
                        type="button"
                        onClick={() => setProposalType("visit")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${proposalType === "visit"
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                            }`}
                    >
                        <Calendar className="h-4 w-4" />
                        Proponer visita
                    </button>
                </div>
            </CardHeader>

            <CardContent>
                {/* PRICE FORM */}
                {proposalType === "price" && (
                    <Form {...priceForm}>
                        <form onSubmit={priceForm.handleSubmit(handlePriceSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={priceForm.control}
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
                                    control={priceForm.control}
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
                                control={priceForm.control}
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
                )}

                {/* VISIT FORM */}
                {proposalType === "visit" && (
                    <Form {...visitForm}>
                        <form onSubmit={visitForm.handleSubmit(handleVisitSubmit)} className="space-y-6">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                                <strong>¿Cuándo proponer una visita?</strong> Cuando no podés presupuestar sin ver el trabajo en persona. El cliente decidirá si confirma la visita.
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={visitForm.control}
                                    name="visit_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fecha propuesta para la visita</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} min={new Date().toISOString().split('T')[0]} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={visitForm.control}
                                    name="visit_time_slot"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Horario</FormLabel>
                                            <FormControl>
                                                <select
                                                    {...field}
                                                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                                >
                                                    <option value="">Seleccioná un horario</option>
                                                    <option value="mañana">Mañana (8:00 - 12:00)</option>
                                                    <option value="mediodia">Mediodía (12:00 - 15:00)</option>
                                                    <option value="tarde">Tarde (15:00 - 19:00)</option>
                                                    <option value="a_coordinar">A coordinar con el cliente</option>
                                                </select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={visitForm.control}
                                name="visit_cost"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Costo de la visita ($) — opcional</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Ej: 2000 (o 0 si es gratis)" {...field} />
                                        </FormControl>
                                        <FormDescription>Podés cobrar o no por la visita técnica.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={visitForm.control}
                                name="visit_notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>¿Qué vas a evaluar en la visita?</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Ej: Voy a revisar el estado de las cañerías, los artefactos y calcular materiales necesarios..."
                                                className="min-h-[80px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={visitForm.control}
                                name="message"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mensaje al cliente</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Hola, para poder darte un presupuesto preciso necesito ver el trabajo en persona..."
                                                className="min-h-[80px]"
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
                                    "Proponer Visita Técnica"
                                )}
                            </Button>
                        </form>
                    </Form>
                )}
            </CardContent>
        </Card>
    );
}
