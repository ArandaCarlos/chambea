"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Home,
    Briefcase,
    Search,
    MessageSquare,
    User,
    Settings,
    LogOut,
    CreditCard,
    ShieldAlert,
    Star
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    userType?: "client" | "professional" | "admin";
}

export function Sidebar({ className, userType = "client" }: SidebarProps) {
    const pathname = usePathname();

    const isClient = pathname.startsWith("/client");
    const isPro = pathname.startsWith("/pro");
    const isAdmin = pathname.startsWith("/admin");

    // Dynamic Links
    const dashboardLink = isClient ? "/client/dashboard" : isPro ? "/pro/dashboard" : isAdmin ? "/admin/dashboard" : "/dashboard";
    const messagesLink = isClient ? "/client/messages" : isPro ? "/pro/messages" : "/messages";
    const profileLink = isClient ? "/client/profile" : "/profile";

    // Common links
    const commonLinks = [
        { href: dashboardLink, label: "Inicio", icon: Home },
        { href: messagesLink, label: "Mensajes", icon: MessageSquare },
        { href: profileLink, label: "Mi Perfil", icon: User },
    ];

    // Specific links
    const clientLinks = [
        { href: "/client/search", label: "Buscar Profesionales", icon: Search },
        // POST-JOB HIDDEN: { href: "/client/post-job", label: "Publicar Trabajo", icon: Briefcase },
        { href: "/client/jobs", label: "Mis Solicitudes", icon: Briefcase },
    ];

    const professionalLinks = [
        { href: "/pro/browse-jobs", label: "Trabajos Disponibles", icon: Search },
        { href: "/pro/my-jobs", label: "Mis Trabajos", icon: Briefcase },
        { href: "/pro/earnings", label: "Ganancias", icon: CreditCard },
        { href: "/pro/reviews", label: "Mis Reseñas", icon: Star },
    ];

    const adminLinks = [
        { href: "/admin/verifications", label: "Verificaciones", icon: ShieldAlert },
        { href: "/admin/disputes", label: "Disputas", icon: MessageSquare },
    ];

    const mainLinks = [
        ...commonLinks,
        ...(userType === "client" ? clientLinks : []),
        ...(userType === "professional" ? professionalLinks : []),
        ...(userType === "admin" ? adminLinks : []),
    ];

    return (
        <div className="pb-12 min-h-screen border-r bg-background hidden md:block w-64">
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Menu
                    </h2>
                    <div className="space-y-1">
                        {mainLinks.map(({ href, label, icon: Icon }) => (
                            <Button
                                key={href}
                                asChild
                                variant={pathname.startsWith(href) ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start",
                                    pathname.startsWith(href) && "font-semibold"
                                )}
                            >
                                <Link href={href}>
                                    <Icon className="mr-2 h-4 w-4" />
                                    {label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="absolute bottom-4 left-0 w-full px-3">
                <Button variant="ghost" className="justify-start text-red-500 hover:text-red-600 hover:bg-red-50">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                </Button>
            </div>
        </div>
    );
}
