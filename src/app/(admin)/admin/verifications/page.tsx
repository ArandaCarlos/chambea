"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Check, X, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Mock Data
const PENDING_VERIFICATIONS = [
    {
        id: "1",
        full_name: "Pedro Alvarez",
        email: "pedro@example.com",
        trade: "Gasista",
        submitted_at: new Date().toISOString(),
        status: "pending",
    },
    {
        id: "2",
        full_name: "Maria Laura Diaz",
        email: "maria.l@example.com",
        trade: "Electricista",
        submitted_at: new Date(Date.now() - 86400000).toISOString(),
        status: "pending",
    },
];

export default function VerificationsPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Verificaciones Pendientes</h1>
                    <p className="text-muted-foreground">
                        Profesionales esperando aprobación de identidad.
                    </p>
                </div>
            </div>

            <div className="border rounded-lg bg-card mt-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Profesional</TableHead>
                            <TableHead>Oficio</TableHead>
                            <TableHead>Fecha Solicitud</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {PENDING_VERIFICATIONS.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback>{item.full_name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{item.full_name}</span>
                                        <span className="text-xs text-muted-foreground">{item.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{item.trade}</TableCell>
                                <TableCell>
                                    {format(new Date(item.submitted_at), "dd/MM/yyyy HH:mm")}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                        Pendiente
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/admin/verifications/${item.id}`}>
                                            <Eye className="w-4 h-4 mr-2" />
                                            Revisar
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
