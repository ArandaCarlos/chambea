"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Briefcase, Search, MessageSquare, User } from "lucide-react";

export function BottomNav() {
    const pathname = usePathname();

    const isPro = pathname.startsWith("/pro");
    const isClient = pathname.startsWith("/client");

    // Default links (fallback)
    let links = [
        { href: "/dashboard", label: "Inicio", icon: Home },
        { href: "/search", label: "Buscar", icon: Search },
        { href: "/messages", label: "Mensajes", icon: MessageSquare },
        { href: "/profile", label: "Perfil", icon: User },
    ];

    if (isPro) {
        links = [
            { href: "/pro/dashboard", label: "Inicio", icon: Home },
            { href: "/pro/browse-jobs", label: "Trabajos", icon: Search },
            { href: "/pro/my-jobs", label: "Mis Trabajos", icon: Briefcase },
            { href: "/pro/messages", label: "Mensajes", icon: MessageSquare },
            { href: "/profile", label: "Perfil", icon: User },
        ];
    } else if (isClient) {
        links = [
            { href: "/client/dashboard", label: "Inicio", icon: Home },
            { href: "/client/post-job", label: "Publicar", icon: Briefcase },
            { href: "/client/jobs", label: "Solicitudes", icon: MessageSquare }, // Reusing icon
            { href: "/client/messages", label: "Mensajes", icon: MessageSquare },
            { href: "/profile", label: "Perfil", icon: User },
        ];
    }

    // Identify hidden pages
    if (pathname.includes("/jobs/") || pathname.startsWith("/admin") || pathname.startsWith("/login") || pathname.startsWith("/register")) {
        return null;
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 border-t bg-background md:hidden z-50 pb-safe">
            <div className="flex justify-around items-center h-16">
                {links.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 text-xs font-medium transition-colors touch-target",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-primary"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
