"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { JOB_CATEGORIES } from "@/lib/constants/job-categories";

const onboardingSchema = z.object({
    phone: z.string().min(10, "El teléfono es obligatorio"),
    city: z.string().min(2, "La ciudad es obligatoria"),
    // Professional only
    trade: z.string().optional(),
    hourly_rate: z.string().optional(),
    bio: z.string().optional(),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
    const router = useRouter();
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [step, setStep] = useState(1);
    const [userType, setUserType] = useState<"client" | "professional" | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [verificationDocs, setVerificationDocs] = useState<{
        front: string | null;
        back: string | null;
        selfie: string | null;
    }>({ front: null, back: null, selfie: null });

    const form = useForm<OnboardingValues>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: {
            phone: "",
            city: "",
            trade: "",
            hourly_rate: "",
            bio: "",
        },
    });

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login"); // Redirect to login page if user is not authenticated
                return;
            }
            setUserId(user.id);

            // Fetch profile to get user_type
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (profile) {
                setUserType(profile.user_type);
                form.setValue("phone", profile.phone || "");
                form.setValue("city", profile.city || "");
            }

            setIsLoading(false);
        }

        getUser();
    }, [router, supabase, form]);

    async function onSubmit(data: OnboardingValues) {
        if (!userId || !userType) return;
        setIsSaving(true);

        try {
            // 1. Update Profile (Base)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    phone: data.phone,
                    city: data.city,
                    address: data.city, // Simplificado para MVP
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', userId);

            if (profileError) throw profileError;

            // 2. If Professional, create/update Professional Profile
            if (userType === 'professional') {
                const { error: proError } = await supabase
                    .from('professional_profiles')
                    .upsert({
                        profile_id: (await supabase.from('profiles').select('id').eq('user_id', userId).single()).data?.id,
                        trade: data.trade,
                        hourly_rate: parseFloat(data.hourly_rate || "0"),
                        available_now: true,
                        // Verification stuff
                        dni_front_url: verificationDocs.front, // Estrictamente deberia ir en profiles, pero lo pusimos aqui por simplicidad en el componente de UI
                    }, { onConflict: 'profile_id' }); // Upsert by profile_id

                // NOTE: El schema original tiene dni urls en 'profiles', pero aqui estamos simplificando. 
                // Correccion: El schema SQL dice que dni_front_url esta en 'profiles'.

                if (verificationDocs.front) {
                    await supabase.from('profiles').update({
                        dni_front_url: verificationDocs.front,
                        dni_back_url: verificationDocs.back,
                        selfie_verification_url: verificationDocs.selfie,
                        verification_status: 'pending'
                    }).eq('user_id', userId);
                }
            }

            toast.success("¡Perfil completado!");
            router.push("/dashboard");
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar perfil");
        } finally {
            setIsSaving(false);
        }
    }

    const nextStep = async () => {
        // Validate current step fields before moving
        let valid = false;
        if (step === 1) {
            valid = await form.trigger(["phone", "city"]);
        } else if (step === 2) {
            valid = await form.trigger(["trade", "hourly_rate", "bio"]);
        }

        if (valid) setStep(step + 1);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-xl mx-auto py-10">
            <div className="space-y-2 text-center">
                <h2 className="text-3xl font-bold tracking-tight">Completá tu perfil</h2>
                <p className="text-muted-foreground">
                    {userType === 'professional'
                        ? "Para empezar a recibir trabajos, necesitamos algunos datos más."
                        : "Contanos un poco más sobre vos."}
                </p>
            </div>

            {/* Steps Indicator (Simple) */}
            {userType === 'professional' && (
                <div className="flex gap-2 mb-8">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`h-2 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`}
                        />
                    ))}
                </div>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    {/* STEP 1: Basic Info */}
                    <div className={step === 1 ? "block space-y-4" : "hidden"}>
                        <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ciudad / Barrio</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Palermo, CABA" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Celular</FormLabel>
                                    <FormControl>
                                        <Input placeholder="11 1234 5678" type="tel" {...field} />
                                    </FormControl>
                                    <FormDescription>Te enviaremos un código para verificarlo.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {userType === 'client' && (
                            <Button type="submit" className="w-full" disabled={isSaving}>
                                {isSaving ? <Loader2 className="animate-spin" /> : "Finalizar"}
                            </Button>
                        )}

                        {userType === 'professional' && (
                            <Button type="button" onClick={nextStep} className="w-full">
                                Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* STEP 2: Professional Info */}
                    {userType === 'professional' && (
                        <div className={step === 2 ? "block space-y-4" : "hidden"}>
                            <FormField
                                control={form.control}
                                name="trade"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>¿Cuál es tu oficio principal?</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccioná un oficio" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {JOB_CATEGORIES.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id}>
                                                        {cat.icon} {cat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="hourly_rate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Precio por hora estimado ($)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="5000" {...field} />
                                        </FormControl>
                                        <FormDescription>Es solo una referencia para el cliente.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sobre vos</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Contale a tus clientes sobre tu experiencia..."
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                                </Button>
                                <Button type="button" onClick={nextStep} className="flex-1">
                                    Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Identity Verification (Simplified for MVP) */}
                    {userType === 'professional' && (
                        <div className={step === 3 ? "block space-y-6" : "hidden"}>
                            <div className="bg-muted p-4 rounded-lg">
                                <h3 className="font-semibold mb-2">Verificación de Identidad</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Para mantener la seguridad de Chambea, necesitamos verificar tu identidad.
                                    Subí una foto de tu DNI.
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium mb-1">Foto DNI (Frente)</p>
                                        <ImageUpload
                                            maxFiles={1}
                                            bucket="identity-docs"
                                            onUploadComplete={(urls) => setVerificationDocs(prev => ({ ...prev, front: urls[0] }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                                </Button>
                                <Button type="submit" className="flex-1" disabled={isSaving}>
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        "Finalizar y enviar a revisión"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                </form>
            </Form>
        </div>
    );
}
