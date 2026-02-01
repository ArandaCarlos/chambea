"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Loader2, ArrowRight, ArrowLeft, Camera } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { JOB_CATEGORIES, URGENCY_LEVELS } from "@/lib/constants/job-categories";

const jobSchema = z.object({
    category_id: z.string().min(1, "Seleccioná una categoría"),
    subcategory_id: z.string().optional(),
    title: z.string().min(5, "Título muy corto").max(100),
    description: z.string().min(20, "Describí el problema con más detalle (min 20 caracteres)"),
    urgency: z.enum(["low", "medium", "high", "emergency"]),
    address: z.string().min(5, "Ingresá una dirección válida"),
    city: z.string().min(2, "Ingresá la ciudad"),
    preferred_date: z.date({
        message: "Seleccioná una fecha preferida",
    }),
    preferred_time_slot: z.enum(["morning", "afternoon", "evening"]),
    budget_max: z.string().optional(), // Input as string, convert to number
    photos: z.array(z.string()).optional(),
});

type JobFormValues = z.infer<typeof jobSchema>;

export function JobForm() {
    const router = useRouter();
    const supabase = createClient();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<JobFormValues>({
        resolver: zodResolver(jobSchema),
        defaultValues: {
            category_id: "",
            title: "",
            description: "",
            urgency: "medium",
            preferred_time_slot: "morning",
            photos: [],
            address: "", // Pre-fill with user address preferably
            city: "",
        },
    });

    const categoryId = form.watch("category_id");
    const selectedCategory = JOB_CATEGORIES.find(c => c.id === categoryId);

    const nextStep = async () => {
        let fieldsToValidate: any[] = [];
        if (step === 1) fieldsToValidate = ["category_id", "title", "description"];
        if (step === 2) fieldsToValidate = ["urgency", "preferred_date", "preferred_time_slot", "address", "city"];

        const valid = await form.trigger(fieldsToValidate);
        if (valid) setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);

    async function onSubmit(data: JobFormValues) {
        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error("Debes iniciar sesión para publicar un trabajo");
                return;
            }

            // Get profile id
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!profile) {
                toast.error("Error al obtener tu perfil");
                return;
            }

            // Create Job
            const { data: job, error } = await supabase
                .from('jobs')
                .insert({
                    client_id: profile.id,
                    category_id: data.category_id,
                    subcategory_id: data.subcategory_id,
                    request_type: 'open',
                    title: data.title,
                    description: data.description,
                    address: data.address,
                    city: data.city,
                    preferred_date: data.preferred_date,
                    preferred_time_slot: data.preferred_time_slot,
                    urgency: data.urgency,
                    client_budget_max: data.budget_max ? parseFloat(data.budget_max) : null,
                    work_photos: data.photos,
                    status: 'open'
                })
                .select()
                .single();

            if (error) {
                console.error("Supabase Error:", error);
                throw error;
            }

            toast.success("¡Trabajo publicado exitosamente!");
            // router.push(`/jobs/${job.id}`); 
            // Redirect to dashboard for now as job detail page might not be fully ready for 'open' jobs or user flow
            router.push('/client/dashboard');


        } catch (error) {
            console.error(error);
            toast.error("Error al publicar el trabajo");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Progress */}
            <div className="mb-8">
                <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2">
                    <span className={step >= 1 ? "text-primary" : ""}>Detalles</span>
                    <span className={step >= 2 ? "text-primary" : ""}>Fecha y Lugar</span>
                    <span className={step >= 3 ? "text-primary" : ""}>Confirmar</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300 ease-in-out"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    {/* STEP 1: Details */}
                    <div className={step === 1 ? "space-y-6" : "hidden"}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="category_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categoría</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccioná..." />
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

                            {selectedCategory && (
                                <FormField
                                    control={form.control}
                                    name="subcategory_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Subcategoría (Opcional)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccioná..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {selectedCategory.subcategories.map((sub) => (
                                                        <SelectItem key={sub.id} value={sub.id}>
                                                            {sub.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título del problema</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Pérdida de agua bajo la pileta" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción detallada</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Explicá el problema con detalle..."
                                            className="min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-3">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Fotos (Opcional)</label>
                            <ImageUpload
                                onUploadComplete={(urls) => form.setValue("photos", urls)}
                                maxFiles={3}
                            />
                        </div>

                        <Button type="button" onClick={nextStep} className="w-full">
                            Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>

                    {/* STEP 2: Timing & Location */}
                    <div className={step === 2 ? "space-y-6" : "hidden"}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="preferred_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Fecha preferida</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP", { locale: es })
                                                        ) : (
                                                            <span>Elegí una fecha</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date(new Date().setHours(0, 0, 0, 0))
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="preferred_time_slot"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Horario preferido</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccioná..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="morning">Mañana (8:00 - 12:00)</SelectItem>
                                                <SelectItem value="afternoon">Tarde (12:00 - 17:00)</SelectItem>
                                                <SelectItem value="evening">Noche (17:00 - 21:00)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="urgency"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Nivel de urgencia</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="flex flex-col space-y-1"
                                        >
                                            {Object.entries(URGENCY_LEVELS).map(([key, value]) => (
                                                <div key={key} className="flex items-center space-x-3 space-y-0">
                                                    <RadioGroupItem value={key} id={key} />
                                                    <label
                                                        htmlFor={key}
                                                        className="font-normal cursor-pointer flex items-center gap-2 w-full p-2 rounded hover:bg-muted/50 text-sm"
                                                    >
                                                        <span className={cn(
                                                            "font-medium",
                                                            key === 'emergency' && "text-red-600",
                                                            key === 'high' && "text-orange-600",
                                                        )}>
                                                            {value.label}
                                                        </span>
                                                    </label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ciudad / Barrio</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Palermo" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dirección</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Av. Corrientes 1234" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="budget_max"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Presupuesto máximo (Opcional)</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                            <Input type="number" className="pl-7" placeholder="10000" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormDescription>Ayuda a los profesionales a saber si están en tu rango.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={prevStep}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                            </Button>
                            <Button type="button" onClick={nextStep} className="flex-1">
                                Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* STEP 3: Confirm */}
                    <div className={step === 3 ? "space-y-6" : "hidden"}>
                        <div className="bg-muted/30 p-6 rounded-lg space-y-4 border">
                            <h3 className="font-semibold text-lg">Resumen del trabajo</h3>

                            <div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase">Título</span>
                                <p className="font-medium">{form.getValues("title")}</p>
                            </div>

                            <div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase">Descripción</span>
                                <p className="text-sm whitespace-pre-wrap">{form.getValues("description")}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs font-semibold text-muted-foreground uppercase">Fecha</span>
                                    <p>{form.getValues("preferred_date") && format(form.getValues("preferred_date"), "PPP", { locale: es })}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-muted-foreground uppercase">Horario</span>
                                    <p className="capitalize">{form.getValues("preferred_time_slot") === 'morning' ? 'Mañana' : form.getValues("preferred_time_slot") === 'afternoon' ? 'Tarde' : 'Noche'}</p>
                                </div>

                                <div>
                                    <span className="text-xs font-semibold text-muted-foreground uppercase">Ubicación</span>
                                    <p>{form.getValues("address")}, {form.getValues("city")}</p>
                                </div>

                                <div>
                                    <span className="text-xs font-semibold text-muted-foreground uppercase">Urgencia</span>
                                    <p className="font-medium text-primary">{URGENCY_LEVELS[form.getValues("urgency")]?.label}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={prevStep}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                            </Button>
                            <Button type="submit" className="flex-1" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Publicando...
                                    </>
                                ) : (
                                    "Confirmar y Publicar"
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
}
