import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, AlertTriangle, CheckCircle2 } from "lucide-react";

// Mock Stats
const stats = [
    {
        title: "Usuarios Totales",
        value: "1,240",
        description: "+12% este mes",
        icon: Users,
    },
    {
        title: "Trabajos Activos",
        value: "45",
        description: "+5% desde ayer",
        icon: Briefcase,
    },
    {
        title: "Verificaciones Pendientes",
        value: "12",
        description: "Requieren atención",
        icon: AlertTriangle,
        alert: true
    },
    {
        title: "Ingresos Totales",
        value: "$4.2M",
        description: "Acumulado anual",
        icon: CheckCircle2,
    },
];

export default function AdminDashboard() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
                <p className="text-muted-foreground mt-2">
                    Visión general del estado de la plataforma.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon
                                className={`h-4 w-4 ${stat.alert ? 'text-red-500' : 'text-muted-foreground'}`}
                            />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Activity / Quick Actions could go here */}
            <Card className="min-h-[400px] flex items-center justify-center border-dashed">
                <p className="text-muted-foreground">Gráficos de actividad (Próximamente)</p>
            </Card>
        </div>
    );
}
