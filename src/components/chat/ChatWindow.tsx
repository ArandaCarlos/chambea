"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, AlertTriangle, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { QuoteCard } from "@/components/urgent/QuoteCard";

interface Message {
    id: string;
    sender_id: string;
    receiver_id?: string;
    content: string;
    created_at: string;
    message_type?: string;
    metadata?: any;
    flagged?: boolean;
}

interface ChatWindowProps {
    jobId: string;
    jobStatus?: string;
    requestType?: string; // 'direct' | 'open'
    otherUser: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
    currentUser: {
        id: string;
        role?: "client" | "professional";
    };
}

const BLOCKED_PATTERNS = [
    /\b\d{10,}\b/g,
    /\b\d{4}[-\s]?\d{4}\b/g,
    /whatsapp/gi,
    /wpp/gi,
    /@/g,
    /\.com/gi,
    /instagram/gi,
    /facebook/gi,
];

export function ChatWindow({ jobId, jobStatus, requestType, otherUser, currentUser }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [warning, setWarning] = useState<string | null>(null);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [quoteForm, setQuoteForm] = useState({ price: "", description: "", estimated_hours: "" });
    const [isSendingQuote, setIsSendingQuote] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    const isPro = currentUser.role === "professional";
    const isDirectJob = requestType === "direct";
    const canSendQuote = isPro && isDirectJob && (jobStatus === "open" || jobStatus === "accepted");

    useEffect(() => {
        if (!jobId || !otherUser.id) return;

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('job_id', jobId)
                .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
                .order('created_at', { ascending: true });

            if (!error && data) {
                setMessages(data);
                setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
        };

        fetchMessages();

        const channel = supabase
            .channel(`chat_${jobId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `job_id=eq.${jobId}`
            }, (payload) => {
                setMessages(prev => [...prev, payload.new as Message]);
                setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [jobId, otherUser.id, currentUser.id]);

    const detectSuspiciousContent = (text: string) =>
        BLOCKED_PATTERNS.some(pattern => { pattern.lastIndex = 0; return pattern.test(text); });

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || isSending) return;

        const isFlagged = detectSuspiciousContent(inputValue);
        if (isFlagged) {
            setWarning("⚠️ Por tu seguridad, no compartas datos de contacto. Si arreglás por fuera, Chambea no puede protegerte.");
        } else {
            setWarning(null);
        }

        setIsSending(true);
        try {
            const { error } = await supabase.from('messages').insert({
                job_id: jobId,
                sender_id: currentUser.id,
                receiver_id: otherUser.id,
                content: inputValue,
                message_type: 'text',
            });

            if (error) throw error;

            const newMessage: Message = {
                id: Date.now().toString(),
                sender_id: currentUser.id,
                content: inputValue,
                created_at: new Date().toISOString(),
                message_type: 'text',
                flagged: isFlagged,
            };
            setMessages(prev => [...prev, newMessage]);
            setInputValue("");

            if (isFlagged) toast.warning("Mensaje enviado con advertencia", { description: "Recordá que los contactos directos anulan la garantía." });
        } catch (error) {
            console.error(error);
            toast.error("Error al enviar el mensaje");
        } finally {
            setIsSending(false);
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    };

    const handleSendQuote = async (e: React.FormEvent) => {
        e.preventDefault();
        const price = parseFloat(quoteForm.price);
        if (!price || price <= 0) { toast.error("Ingresá un precio válido"); return; }

        setIsSendingQuote(true);
        try {
            const metadata = {
                price,
                description: quoteForm.description || undefined,
                estimated_hours: quoteForm.estimated_hours ? parseFloat(quoteForm.estimated_hours) : undefined,
            };

            const { error } = await supabase.from('messages').insert({
                job_id: jobId,
                sender_id: currentUser.id,
                receiver_id: otherUser.id,
                content: `Presupuesto: $${price.toLocaleString('es-AR')}`,
                message_type: 'quote_offer',
                metadata,
            });

            if (error) throw error;

            toast.success("Presupuesto enviado. El cliente puede aceptarlo desde el chat.");
            setShowQuoteModal(false);
            setQuoteForm({ price: "", description: "", estimated_hours: "" });
        } catch (error) {
            console.error(error);
            toast.error("Error al enviar el presupuesto");
        } finally {
            setIsSendingQuote(false);
        }
    };

    if (!currentUser?.id || !otherUser?.id || !jobId) {
        return (
            <div className="flex flex-col h-[600px] border rounded-xl overflow-hidden bg-background shadow-sm items-center justify-center">
                <p className="text-muted-foreground">Cargando chat...</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col h-[600px] border rounded-xl overflow-hidden bg-background shadow-sm">
                {/* Header */}
                <div className="p-4 border-b flex items-center gap-3 bg-muted/30">
                    <Avatar>
                        <AvatarImage src={otherUser.avatar_url} />
                        <AvatarFallback>{otherUser.full_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{otherUser.full_name}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            En línea
                        </p>
                    </div>
                    {/* Pro: Send Quote button */}
                    {canSendQuote && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-orange-400 text-orange-600 hover:bg-orange-50 shrink-0"
                            onClick={() => setShowQuoteModal(true)}
                        >
                            <DollarSign className="w-4 h-4 mr-1" />
                            Enviar presupuesto
                        </Button>
                    )}
                    {isDirectJob && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-300 shrink-0">
                            ⚡ Urgente
                        </Badge>
                    )}
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.map((msg) => {
                            const isMe = msg.sender_id === currentUser.id;
                            const isQuoteOffer = msg.message_type === 'quote_offer';
                            const isQuoteAccepted = msg.message_type === 'quote_accepted';
                            const isQuoteRejected = msg.message_type === 'quote_rejected';

                            // Quote offer card
                            if (isQuoteOffer && msg.metadata) {
                                return (
                                    <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                        <div className="max-w-[80%]">
                                            <p className="text-xs text-muted-foreground mb-1 px-1">
                                                {isMe ? "Tu presupuesto" : `Presupuesto de ${otherUser.full_name}`}
                                            </p>
                                            <QuoteCard
                                                messageId={msg.id}
                                                jobId={jobId}
                                                senderId={msg.sender_id}
                                                receiverId={msg.receiver_id || otherUser.id}
                                                currentUserId={currentUser.id}
                                                metadata={msg.metadata}
                                                status="pending"
                                                onAccepted={() => {
                                                    // Refresh messages
                                                    const fetchMessages = async () => {
                                                        const { data } = await supabase
                                                            .from('messages')
                                                            .select('*')
                                                            .eq('job_id', jobId)
                                                            .order('created_at', { ascending: true });
                                                        if (data) setMessages(data);
                                                    };
                                                    fetchMessages();
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            }

                            // Quote accepted/rejected — show as system message
                            if (isQuoteAccepted || isQuoteRejected) {
                                return (
                                    <div key={msg.id} className="flex justify-center">
                                        <div className={cn(
                                            "text-xs px-3 py-1.5 rounded-full",
                                            isQuoteAccepted ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                                        )}>
                                            {msg.content}
                                        </div>
                                    </div>
                                );
                            }

                            // Regular text message
                            return (
                                <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                    <div className={cn(
                                        "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                                        isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none",
                                        msg.flagged && "opacity-70 ring-1 ring-yellow-400"
                                    )}>
                                        <p>{msg.content}</p>
                                        <span className="text-[10px] opacity-70 block text-right mt-1">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* Warning */}
                {warning && (
                    <Alert variant="destructive" className="mx-4 mb-2 py-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="text-sm font-semibold">Advertencia de Seguridad</AlertTitle>
                        <AlertDescription className="text-xs">{warning}</AlertDescription>
                    </Alert>
                )}

                {/* Input */}
                <div className="p-4 border-t bg-background">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Button type="button" variant="ghost" size="icon" className="shrink-0">
                            <Paperclip className="h-5 w-5 text-muted-foreground" />
                        </Button>
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Escribí un mensaje..."
                            className="flex-1"
                            autoComplete="off"
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSendMessage(); }}
                        />
                        <Button type="submit" size="icon" disabled={isSending || !inputValue.trim()}>
                            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </form>
                </div>
            </div>

            {/* Quote modal for professionals */}
            <Dialog open={showQuoteModal} onOpenChange={setShowQuoteModal}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-orange-500" />
                            Enviar presupuesto
                        </DialogTitle>
                        <DialogDescription>
                            El cliente podrá aceptar o rechazar tu oferta desde el chat.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSendQuote} className="space-y-4 mt-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="q-price">Precio total ($)</Label>
                            <Input
                                id="q-price"
                                type="number"
                                min="1"
                                placeholder="25000"
                                value={quoteForm.price}
                                onChange={e => setQuoteForm({ ...quoteForm, price: e.target.value })}
                                disabled={isSendingQuote}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="q-hours">Horas estimadas <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                            <Input
                                id="q-hours"
                                type="number"
                                min="0.5"
                                step="0.5"
                                placeholder="3"
                                value={quoteForm.estimated_hours}
                                onChange={e => setQuoteForm({ ...quoteForm, estimated_hours: e.target.value })}
                                disabled={isSendingQuote}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="q-desc">Descripción <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                            <Textarea
                                id="q-desc"
                                placeholder="Incluye materiales, mano de obra..."
                                value={quoteForm.description}
                                onChange={e => setQuoteForm({ ...quoteForm, description: e.target.value })}
                                disabled={isSendingQuote}
                                rows={2}
                                maxLength={200}
                                className="resize-none"
                            />
                        </div>
                        <div className="flex gap-3 pt-1">
                            <Button type="button" variant="outline" onClick={() => setShowQuoteModal(false)} disabled={isSendingQuote} className="flex-1">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSendingQuote} className="flex-1">
                                {isSendingQuote ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar oferta"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
