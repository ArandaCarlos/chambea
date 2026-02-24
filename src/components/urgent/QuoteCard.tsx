"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, XCircle, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuoteCardProps {
    messageId: string;
    jobId: string;
    senderId: string;     // professional's profile id
    receiverId: string;   // client's profile id
    currentUserId: string;
    metadata: {
        price: number;
        commission?: number;
        pro_receives?: number;
        description?: string;
        estimated_hours?: number;
    };
    status?: "pending" | "accepted" | "rejected";
    onAction?: () => void; // callback to refresh messages
}

export function QuoteCard({
    messageId, jobId, senderId, receiverId, currentUserId,
    metadata, status = "pending", onAction,
}: QuoteCardProps) {
    const supabase = createClient();
    const [loading, setLoading] = useState<"accept" | "reject" | null>(null);

    const isClient = currentUserId === receiverId;
    const isPending = status === "pending";
    const commission = metadata.commission ?? Math.round(metadata.price * 0.10);
    const proReceives = metadata.pro_receives ?? (metadata.price - commission);

    async function handleAccept() {
        setLoading("accept");
        try {
            // 1. Update job: accepted + quoted_price + professional_id
            const { error: jobError, data: jobData } = await supabase
                .from('jobs')
                .update({ status: 'accepted', quoted_price: metadata.price, professional_id: senderId })
                .eq('id', jobId)
                .select('title')
                .single();
            if (jobError) throw jobError;

            // 2. Send acceptance system message
            await supabase.from('messages').insert({
                job_id: jobId,
                sender_id: receiverId,
                receiver_id: senderId,
                content: `✅ Acepté el presupuesto de $${metadata.price.toLocaleString('es-AR')}. ¡Nos vemos para el trabajo!`,
                message_type: 'quote_accepted',
                metadata: { original_quote_id: messageId, price: metadata.price },
            });

            // 3. Insert job_link card so both users see a direct link
            const jobUrl = `/client/jobs/${jobId}`;
            await supabase.from('messages').insert({
                job_id: jobId,
                sender_id: receiverId,
                receiver_id: senderId,
                content: 'Trabajo confirmado',
                message_type: 'job_link',
                metadata: { job_url: jobUrl, job_title: jobData?.title ?? 'Ver trabajo' },
            });

            toast.success("¡Presupuesto aceptado! El trabajo está confirmado.");
            onAction?.();
        } catch (error: any) {
            console.error(error);
            toast.error("Error al aceptar el presupuesto");
        } finally {
            setLoading(null);
        }
    }

    async function handleReject() {
        setLoading("reject");
        try {
            await supabase.from('messages').insert({
                job_id: jobId,
                sender_id: receiverId,
                receiver_id: senderId,
                content: `❌ No acepté el presupuesto de $${metadata.price.toLocaleString('es-AR')}. Podemos seguir negociando.`,
                message_type: 'quote_rejected',
                metadata: { original_quote_id: messageId, price: metadata.price },
            });
            toast.info("Presupuesto rechazado. El profesional puede enviarte otra oferta.");
            onAction?.();
        } catch (error: any) {
            console.error(error);
            toast.error("Error al rechazar el presupuesto");
        } finally {
            setLoading(null);
        }
    }

    return (
        <div className={cn(
            "rounded-xl border-2 p-4 space-y-3 max-w-xs w-full",
            status === "accepted" ? "border-green-300 bg-green-50" :
                status === "rejected" ? "border-red-200 bg-red-50 opacity-70" :
                    "border-orange-300 bg-orange-50"
        )}>
            {/* Header */}
            <div className="flex items-center gap-2">
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    status === "accepted" ? "bg-green-500" :
                        status === "rejected" ? "bg-red-400" : "bg-orange-500"
                )}>
                    <DollarSign className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {status === "accepted" ? "Presupuesto aceptado" :
                        status === "rejected" ? "Presupuesto rechazado" :
                            "Oferta de presupuesto"}
                </p>
            </div>

            {/* Price */}
            <div className="text-center py-2">
                <p className="text-3xl font-bold">${metadata.price.toLocaleString('es-AR')}</p>
                {metadata.estimated_hours && (
                    <p className="text-xs text-muted-foreground mt-0.5">~{metadata.estimated_hours}h estimadas</p>
                )}
            </div>

            {/* Commission breakdown */}
            <div className="rounded-lg bg-white/60 border px-3 py-2 space-y-1 text-xs">
                <div className="flex justify-between text-muted-foreground">
                    <span>Comisión Chambea (10%)</span>
                    <span className="text-orange-600">- ${commission.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1">
                    <span>El profesional recibe</span>
                    <span className="text-green-700">${proReceives.toLocaleString('es-AR')}</span>
                </div>
            </div>

            {/* Description */}
            {metadata.description && (
                <p className="text-sm text-muted-foreground border-t pt-2">{metadata.description}</p>
            )}

            {/* Actions — only for client when pending */}
            {isClient && isPending && (
                <div className="flex gap-2 pt-1">
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                        onClick={handleReject}
                        disabled={loading !== null}
                    >
                        {loading === "reject" ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3 mr-1" />}
                        Rechazar
                    </Button>
                    <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={handleAccept}
                        disabled={loading !== null}
                    >
                        {loading === "accept" ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                        Aceptar
                    </Button>
                </div>
            )}

            {/* Status badge — locked after decision */}
            {!isPending && (
                <div className={cn(
                    "text-xs font-medium text-center py-1 rounded-md",
                    status === "accepted" ? "text-green-700 bg-green-100" : "text-red-600 bg-red-100"
                )}>
                    {status === "accepted" ? "✅ Trabajo confirmado — decisión bloqueada" : "❌ Rechazado"}
                </div>
            )}
        </div>
    );
}
