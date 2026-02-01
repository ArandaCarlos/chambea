import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Search, MapPin, ShieldCheck } from "lucide-react";
import { JobCard } from "@/components/job/JobCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock data
const recentJobs = [
    {
        id: "1",
        title: "Pérdida de agua bajo pileta cocina",
        category_id: "plumbing",
        description: "Tengo una gotera constante bajo la mesada...",
        client: { full_name: "Tú", avatar_url: "https://github.com/shadcn.png" },
        location: { address: "Av. Corrientes", city: "CABA" },
        budget: 15000,
        urgency: "medium",
        status: "open",
        created_at: new Date().toISOString(),
    },
];

export default function ClientDashboard() {
    return (
        <div className="space-y-8">
            {/* Welcome & Quick Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-primary/5 p-6 rounded-xl border border-primary/10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Hola, Juan! 👋</h1>
                    <p className="text-muted-foreground mt-2 max-w-xl">
                        Publicá tu problema y recibí presupuestos de profesionales verificados en minutos.
                        Tu dinero está protegido hasta que el trabajo esté terminado.
                    </p>

                    <div className="flex items-center gap-2 mt-4">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Garantía Chambea
                        </Badge>
                    </div>
                </div>

                <div className="w-full md:w-auto">
                    <Button asChild size="lg" className="w-full md:w-auto text-lg h-14 px-8 shadow-lg hover:shadow-xl transition-all">
                        <Link href="/client/post-job">
                            <Plus className="mr-2 h-6 w-6" />
                            PUBLICAR TRABAJO
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Trabajos Activos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Postulaciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-muted-foreground">Recibidas hoy</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Mensajes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gastado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$0</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Main Column */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Tus trabajos recientes</h2>
                        <Button variant="link" asChild>
                            <Link href="/jobs">Ver todos</Link>
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {recentJobs.map((job) => (
                            <JobCard key={job.id} job={job as any} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
