"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function Header() {
    const pathname = usePathname();

    // TODO: Get user from auth context
    const user = {
        initials: "JP",
        email: "juan@example.com",
        avatar: "https://github.com/shadcn.png"
    };

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

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full border">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatar} alt="User" />
                                    <AvatarFallback>{user.initials}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">Juan Pérez</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        juan@example.com
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
                            <DropdownMenuItem className="text-red-500 focus:text-red-500">
                                <LogOut className="mr-2 h-4 w-4" />
                                Cerrar sesión
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
