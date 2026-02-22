"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Zap, MapPin, FileText } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface UrgentContactModalProps {
    open: boolean;
    onClose: () => void;
    professional: {
        id: string;
        full_name: string;
        trade: string; // category_id
    };
}

export function UrgentContactModal({ open, onClose, professional }: UrgentContactModalProps) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: "",
        description: "",
        address: "",
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.title.trim() || !form.address.trim()) {
            toast.error("Completá el título y la dirección");
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/login"); return; }

            const { data: clientProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!clientProfile) throw new Error("No se encontró el perfil");

            // Create the direct job — professional already assigned
            const { data: job, error } = await supabase
                .from('jobs')
                .insert({
                    client_id: clientProfile.id,
                    professional_id: professional.id,
                    category_id: professional.trade,
                    request_type: 'direct',
                    title: form.title.trim(),
                    description: form.description.trim() || `Solicitud urgente para ${professional.full_name}`,
                    address: form.address.trim(),
                    urgency: 'high',
                    status: 'open',
                })
                .select('id')
                .single();

            if (error) throw error;

            // Send opening message automatically
            await supabase.from('messages').insert({
                job_id: job.id,
                sender_id: clientProfile.id,
                receiver_id: professional.id,
                content: `Hola ${professional.full_name}! Te contacto por un trabajo urgente: "${form.title}". ${form.description ? `Descripción: ${form.description}` : ''} Dirección: ${form.address}`,
                message_type: 'text',
            });

            toast.success("¡Solicitud enviada! Abriendo chat...");
            onClose();
            // Navigate to messages with the new job pre-selected
            router.push(`/client/messages?jobId=${job.id}&proId=${professional.id}`);

        } catch (error: any) {
            console.error(error);
            toast.error("Error al crear la solicitud. Intentá de nuevo.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-orange-500" />
                        Solicitud urgente
                    </DialogTitle>
                    <DialogDescription>
                        Contactás directamente a <strong>{professional.full_name}</strong>. Él recibirá tu solicitud y podrá enviarte un presupuesto en el chat.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="urgent-title">¿Qué necesitás?</Label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="urgent-title"
                                className="pl-9"
                                placeholder="Ej: Reparar caño roto en baño"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                disabled={loading}
                                maxLength={100}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="urgent-desc">Descripción breve <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                        <Textarea
                            id="urgent-desc"
                            placeholder="Más detalles del problema..."
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            disabled={loading}
                            rows={2}
                            maxLength={300}
                            className="resize-none"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="urgent-address">Dirección del trabajo</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="urgent-address"
                                className="pl-9"
                                placeholder="Av. Corrientes 1234, CABA"
                                value={form.address}
                                onChange={e => setForm({ ...form, address: e.target.value })}
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="flex-1">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-600">
                            {loading ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                            ) : (
                                <><Zap className="w-4 h-4 mr-2" /> Contactar ahora</>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
