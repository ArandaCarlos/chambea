"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface Message {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
    flagged?: boolean;
}

interface ChatWindowProps {
    jobId: string;
    otherUser: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
    currentUser: {
        id: string;
    };
}

const BLOCKED_PATTERNS = [
    /\b\d{10,}\b/g, // 10+ digits sequence
    /\b\d{4}[-\s]?\d{4}\b/g, // 1234-5678
    /whatsapp/gi,
    /wpp/gi,
    /@/g, // Emails
    /\.com/gi,
    /instagram/gi,
    /facebook/gi,
];

export function ChatWindow({ jobId, otherUser, currentUser }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [warning, setWarning] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Mock initial load
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
                setTimeout(() => {
                    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        };

        fetchMessages();

        // Optional: Add realtime subscription here
        const channel = supabase
            .channel('chat_messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `job_id=eq.${jobId}`
            }, (payload) => {
                setMessages(prev => [...prev, payload.new as Message]);
                setTimeout(() => {
                    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [jobId, otherUser.id, currentUser.id]);

    const detectSuspiciousContent = (text: string) => {
        return BLOCKED_PATTERNS.some(pattern => pattern.test(text));
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || isSending) return;

        if (detectSuspiciousContent(inputValue)) {
            setWarning("⚠️ Por tu seguridad y la garantía del servicio, te recomendamos no compartir datos de contacto hasta confirmar el trabajo. Si arreglás por fuera, Chambea no puede protegerte.");
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
            });

            if (error) throw error;

            setInputValue("");
            // Optimistic update or wait for realtime subscription
            // For now, we rely on the realtime subscription or a manual fetch if improved later.
            // But let's add it locally for immediate feedback
            const newMessage: Message = {
                id: Date.now().toString(), // Temporary ID
                sender_id: currentUser.id,
                content: inputValue,
                created_at: new Date().toISOString(),
                flagged: detectSuspiciousContent(inputValue)
            };
            setMessages(prev => [...prev, newMessage]);


            if (newMessage.flagged) {
                toast.warning("Mensaje enviado con advertencia", {
                    description: "Recordá que los contactos directos anulan la garantía."
                });
            }

        } catch (error) {
            console.error(error);
            toast.error("Error al enviar el mensaje");
        } finally {
            setIsSending(false);
            // Scroll to bottom
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
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
        <div className="flex flex-col h-[600px] border rounded-xl overflow-hidden bg-background shadow-sm">
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-3 bg-muted/30">
                <Avatar>
                    <AvatarImage src={otherUser.avatar_url} />
                    <AvatarFallback>{otherUser.full_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="font-semibold">{otherUser.full_name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        En línea
                    </p>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((msg) => {
                        const isMe = msg.sender_id === currentUser.id;
                        return (
                            <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                <div
                                    className={cn(
                                        "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                                        isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none"
                                    )}
                                >
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

            {/* Warnings */}
            {warning && (
                <Alert variant="destructive" className="mx-4 mb-2 py-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="text-sm font-semibold">Advertencia de Seguridad</AlertTitle>
                    <AlertDescription className="text-xs">
                        {warning}
                    </AlertDescription>
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
                    />
                    <Button type="submit" size="icon" disabled={isSending || !inputValue.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
