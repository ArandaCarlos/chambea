"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Bell, LogOut, Settings, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
    full_name: string;
    email: string;
    avatar_url: string | null;
}

export function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    async function loadUser() {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (!authUser) {
                setLoading(false);
                return;
            }

            // Get profile data
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, email, avatar_url')
                .eq('user_id', authUser.id)
                .single();

            if (profile) {
                setUser(profile);
            }
        } catch (error) {
            console.error("Error loading user:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    }

    function getInitials(name: string): string {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2 font-bold text-xl text-primary">
                    <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-black text-sm">
                        C
                    </div>
                    <span className="hidden sm:inline-block">CHAMBEA</span>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    {/* Common Home Link */}
                    <Link
                        href={pathname.startsWith("/pro") ? "/pro/dashboard" : pathname.startsWith("/admin") ? "/admin/dashboard" : "/client/dashboard"}
                        className={cn("transition-colors hover:text-primary", pathname.includes("dashboard") ? "text-primary" : "text-muted-foreground")}
                    >
                        Inicio
                    </Link>

                    {/* Pro Links */}
                    {pathname.startsWith("/pro") && (
                        <>
                            <Link
                                href="/pro/browse-jobs"
                                className={cn("transition-colors hover:text-primary", pathname.includes("browse") ? "text-primary" : "text-muted-foreground")}
                            >
                                Buscar Trabajos
                            </Link>
                            <Link
                                href="/pro/my-jobs"
                                className={cn("transition-colors hover:text-primary", pathname.includes("my-jobs") ? "text-primary" : "text-muted-foreground")}
                            >
                                Mis Trabajos
                            </Link>
                        </>
                    )}

                    {/* Client Links */}
                    {pathname.startsWith("/client") && (
                        <>
                            <Link
                                href="/client/post-job"
                                className={cn("transition-colors hover:text-primary", pathname.includes("post-job") ? "text-primary" : "text-muted-foreground")}
                            >
                                Publicar Trabajo
                            </Link>
                            <Link
                                href="/client/jobs"
                                className={cn("transition-colors hover:text-primary", pathname.includes("jobs") ? "text-primary" : "text-muted-foreground")}
                            >
                                Mis Solicitudes
                            </Link>
                        </>
                    )}
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="relative text-muted-foreground">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                    </Button>

                    {!loading && user && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full border">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
                                        <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user.full_name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/profile">
                                        <User className="mr-2 h-4 w-4" />
                                        Perfil
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/settings">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Configuración
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-red-500 focus:text-red-500 cursor-pointer"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Cerrar sesión
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </header>
    );
}
