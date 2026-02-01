"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";

// Schema con validación de contraseña fuerte
const registerSchema = z
    .object({
        full_name: z.string().min(2, "Ingresá tu nombre completo"),
        email: z.string().email("Email inválido"),
        password: z.string().min(8, "Mínimo 8 caracteres"),
        confirmPassword: z.string(),
        user_type: z.enum(["client", "professional"]),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"],
    });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const supabase = createClient();
    const [userType, setUserType] = useState<"client" | "professional">("client");

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            full_name: "",
            email: "",
            password: "",
            confirmPassword: "",
            user_type: "client",
        },
    });

    // Actualizar user_type en el form cuando cambia el tab
    const handleTabChange = (value: string) => {
        const type = value as "client" | "professional";
        setUserType(type);
        form.setValue("user_type", type);
    };

    async function onSubmit(data: RegisterFormValues) {
        setIsLoading(true);

        try {
            // 1. Sign up con Supabase
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        full_name: data.full_name,
                        user_type: data.user_type,
                    },
                },
            });

            if (authError) {
                toast.error("Error al registrarse", {
                    description: authError.message,
                });
                return;
            }

            if (authData.user) {
                // 2. Crear perfil en base de datos (si no lo hace un trigger automatico)
                // Nota: Asumiendo que tenés un trigger en Supabase 'on_auth_user_created'
                // Si no, deberíamos hacerlo manual aquí.
                // Haremos un insert manual por seguridad si falla el trigger o para asegurar datos

                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: undefined, // Default generado por DB
                        user_id: authData.user.id,
                        full_name: data.full_name,
                        email: data.email,
                        user_type: data.user_type,
                    })
                    .select()
                    .single();

                // Ignoramos error de duplicado (si el trigger ya lo creó)
                if (profileError && !profileError.message.includes("duplicate")) {
                    console.error("Error creando perfil:", profileError);
                }

                toast.success("¡Cuenta creada exitosamente!", {
                    description: "Por favor verificá tu email para continuar.",
                });

                // Redirigir a verify-email o onboarding
                router.push("/onboarding");
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center lg:text-left">
                <h2 className="text-3xl font-bold tracking-tight">Crear cuenta</h2>
                <p className="text-muted-foreground">
                    Unite a la comunidad de Chambea
                </p>
            </div>

            <Tabs
                defaultValue="client"
                className="w-full"
                onValueChange={handleTabChange}
            >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="client">Soy Cliente</TabsTrigger>
                    <TabsTrigger value="professional">Soy Profesional</TabsTrigger>
                </TabsList>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="full_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre completo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Juan Pérez" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="hola@chambea.ar"
                                            type="email"
                                            autoComplete="email"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contraseña</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                placeholder="Mínimo 8 caracteres"
                                                type={showPassword ? "text" : "password"}
                                                autoComplete="new-password"
                                                {...field}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirmar contraseña</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Repetí tu contraseña"
                                            type="password"
                                            autoComplete="new-password"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="pt-2">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creando cuenta...
                                    </>
                                ) : (
                                    "Registrarse"
                                )}
                            </Button>
                        </div>

                        <p className="text-xs text-center text-muted-foreground pt-2">
                            Al registrarte, aceptás nuestros{" "}
                            <Link href="/terms" className="underline hover:text-primary">
                                Términos y Condiciones
                            </Link>{" "}
                            y{" "}
                            <Link href="/privacy" className="underline hover:text-primary">
                                Política de Privacidad
                            </Link>
                            .
                        </p>
                    </form>
                </Form>
            </Tabs>

            <div className="text-center text-sm">
                <p className="text-muted-foreground">
                    ¿Ya tenés cuenta?{" "}
                    <Link
                        href="/login"
                        className="font-semibold text-primary hover:underline"
                    >
                        Iniciá sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}
