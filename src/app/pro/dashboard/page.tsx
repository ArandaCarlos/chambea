import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, DollarSign, Star, TrendingUp, Search } from "lucide-react";
import { JobCard } from "@/components/job/JobCard";

// Mock data
const dashboardStats = {
    activeJobs: 3,
    pendingProposals: 5,
    monthlyEarnings: 125000,
    rating: 4.8,
    profileViews: 45
};

const nearbyJobs = [
    {
        id: "1",
        title: "Instalación de luminarias LED",
        category_id: "electrical",
        description: "Necesito cambiar 10 lámparas halógenas por paneles LED en una oficina...",
        client: { full_name: "Empresa SA", avatar_url: "https://github.com/shadcn.png" },
        location: { address: "Microcentro", city: "CABA", distance: 1.5 },
        budget: 45000,
        urgency: "medium",
        status: "open",
        created_at: new Date().toISOString(),
    },
    {
        id: "2",
        title: "Reparación tablero eléctrico",
        category_id: "electrical",
        description: "Salta la térmica cuando prendo el aire acondicionado...",
        client: { full_name: "Ana Gomez", avatar_url: null },
        location: { address: "San Telmo", city: "CABA", distance: 2.8 },
        budget: 25000,
        urgency: "high",
        status: "open",
        created_at: new Date().toISOString(),
    }
];

export default function ProfessionalDashboard() {
    return (
        <div className="space-y-8">
            {/* Welcome & Status */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Hola, Juan! 👋</h1>
                    <p className="text-muted-foreground mt-1">
                        Tu perfil está activo y visible para clientes cercanos.
                    </p>
                </div>
                <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link href="/pro/browse-jobs">
                        <Search className="mr-2 h-5 w-5" />
                        Buscar Trabajos
                    </Link>
                </Button>
            </div>

            {/* ... */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Nearby Jobs Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Oportunidades cerca tuyo</h2>
                        <Button variant="link" asChild>
                            <Link href="/pro/browse-jobs">Ver todas</Link>
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {nearbyJobs.map((job) => (
                            <JobCard
                                key={job.id}
                                job={job as any}
                                showActions={true}
                            />
                        ))}

                        <div className="text-center pt-4">
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/pro/browse-jobs">Explorar más trabajos</Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-lg">Tu Estado</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Visibilidad</span>
                                <span className="flex h-2 w-2 rounded-full bg-green-600" />
                            </div>

                            <div className="pt-2">
                                <Button variant="outline" className="w-full text-xs h-8" asChild>
                                    <Link href="/profile">Editar perfil</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Próximos Turnos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="border-l-2 border-primary pl-3 py-1">
                                    <p className="text-xs text-muted-foreground">Hoy, 14:00</p>
                                    <p className="font-medium text-sm">Visita técnica - Juan P.</p>
                                    <p className="text-xs text-muted-foreground truncate">Av. Santa Fe 2300...</p>
                                </div>
                                <div className="border-l-2 border-muted pl-3 py-1">
                                    <p className="text-xs text-muted-foreground">Mañana, 09:00</p>
                                    <p className="font-medium text-sm">Instalación - Maria G.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
}
