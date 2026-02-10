"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar, CreditCard } from "lucide-react";

export default function ProfessionalEarningsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mis Ganancias</h1>
                <p className="text-muted-foreground">
                    Resumen de tus ingresos y transacciones
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ganado este mes</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$0</div>
                        <p className="text-xs text-muted-foreground">+0% desde el mes pasado</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pendiente de cobro</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$0</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total histórico</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$0</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="min-h-[400px] flex items-center justify-center border-dashed">
                <div className="text-center p-8">
                    <p className="text-muted-foreground mb-2">Historial de Transacciones</p>
                    <p className="text-sm text-muted-foreground">
                        No hay transacciones registradas todavía. Cuando completes trabajos, aparecerán aquí.
                    </p>
                </div>
            </Card>
        </div>
    );
}
