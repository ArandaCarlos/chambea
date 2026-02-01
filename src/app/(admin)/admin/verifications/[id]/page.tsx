"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

// Mock Data (In real app, fetch by ID)
const MOCK_DETAIL = {
    id: "1",
    full_name: "Pedro Alvarez",
    email: "pedro@example.com",
    phone: "1144556677",
    address: "Av. Rivadavia 1234, CABA",
    trade: "Gasista",
    dni_front: "https://via.placeholder.com/600x400.png?text=DNI+Frente",
    dni_back: "https://via.placeholder.com/600x400.png?text=DNI+Dorso",
    selfie: "https://via.placeholder.com/400x400.png?text=Selfie+con+DNI",
    status: "pending"
};

export default function VerificationDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectForm, setShowRejectForm] = useState(false);
    const supabase = createClient();

    const handleApprove = async () => {
        setIsProcessing(true);
        try {
            // In real app replace URL params with actual DB update
            // await supabase.from('profiles').update({ verification_status: 'approved' }).eq('id', params.id);

            await new Promise(r => setTimeout(r, 1000)); // Mock delay
            toast.success("Profesional aprobado exitosamente");
            router.push("/admin/verifications");
        } catch (error) {
            toast.error("Error al aprobar");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason) {
            toast.error("Debes ingresar un motivo de rechazo");
            return;
        }

        setIsProcessing(true);
        try {
            // await supabase.from('profiles').update({ verification_status: 'rejected', reason: rejectReason }).eq('id', params.id);

            await new Promise(r => setTimeout(r, 1000));
            toast.success("Solicitud rechazada");
            router.push("/admin/verifications");
        } catch (error) {
            toast.error("Error al rechazar");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/verifications"><ArrowLeft className="w-5 h-5" /></Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Revisión de Identidad</h1>
                    <p className="text-muted-foreground">
                        Solicitud #{params.id}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Datos Personales */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Datos del Profesional</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-muted-foreground text-xs uppercase">Nombre Completo</Label>
                                <p className="font-medium text-lg">{MOCK_DETAIL.full_name}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground text-xs uppercase">Email</Label>
                                <p>{MOCK_DETAIL.email}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground text-xs uppercase">Teléfono</Label>
                                <p>{MOCK_DETAIL.phone}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground text-xs uppercase">Domicilio Declarado</Label>
                                <p>{MOCK_DETAIL.address}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground text-xs uppercase">Oficio Principal</Label>
                                <Badge>{MOCK_DETAIL.trade}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle>Acciones</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!showRejectForm ? (
                                <div className="flex flex-col gap-3">
                                    <Button
                                        onClick={handleApprove}
                                        disabled={isProcessing}
                                        className="bg-green-600 hover:bg-green-700 w-full"
                                    >
                                        {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                        Aprobar Solicitud
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => setShowRejectForm(true)}
                                        disabled={isProcessing}
                                        className="w-full"
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Rechazar
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <Label>Motivo del rechazo</Label>
                                        <Textarea
                                            placeholder="Ej: La foto del DNI es ilegible..."
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => setShowRejectForm(false)} className="flex-1">
                                            Cancelar
                                        </Button>
                                        <Button variant="destructive" onClick={handleReject} disabled={isProcessing} className="flex-1">
                                            Confirmar Rechazo
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Documentación */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Documentación Adjunta</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-2">
                                <Label>DNI Frente</Label>
                                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border">
                                    <Image
                                        src={MOCK_DETAIL.dni_front}
                                        alt="DNI Frente"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>DNI Dorso</Label>
                                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border">
                                    <Image
                                        src={MOCK_DETAIL.dni_back}
                                        alt="DNI Dorso"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Selfie con DNI</Label>
                                <div className="relative aspect-square max-w-[300px] mx-auto bg-muted rounded-lg overflow-hidden border">
                                    <Image
                                        src={MOCK_DETAIL.selfie}
                                        alt="Selfie"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
