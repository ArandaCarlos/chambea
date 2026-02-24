"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ChatWindow } from "@/components/chat/ChatWindow";

interface Conversation {
    id: string;
    job_id: string;
    job_title?: string;
    job_status?: string;
    request_type?: string;
    other_user: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
    last_message: string;
    last_message_at: string;
    unread_count: number;
}

export default function ProfessionalMessagesPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string>("");

    useEffect(() => { loadConversations(); }, []);

    async function loadConversations() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/login"); return; }

            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!profile) return;
            setCurrentUserId(profile.id);

            const { data: messages, error } = await supabase
                .from('messages')
                .select('*')
                .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const conversationMap = new Map<string, Conversation>();

            for (const msg of messages || []) {
                const otherUserId = msg.sender_id === profile.id ? msg.receiver_id : msg.sender_id;
                const conversationKey = `${msg.job_id}-${otherUserId}`;

                if (!conversationMap.has(conversationKey)) {
                    const [otherUserRes, jobRes] = await Promise.all([
                        supabase.from('profiles').select('id, full_name, avatar_url').eq('id', otherUserId).single(),
                        supabase.from('jobs').select('title, status, request_type').eq('id', msg.job_id).single(),
                    ]);

                    if (otherUserRes.data) {
                        conversationMap.set(conversationKey, {
                            id: conversationKey,
                            job_id: msg.job_id,
                            job_title: jobRes.data?.title,
                            job_status: jobRes.data?.status,
                            request_type: jobRes.data?.request_type,
                            other_user: otherUserRes.data,
                            last_message: msg.content,
                            last_message_at: msg.created_at,
                            unread_count: 0,
                        });
                    }
                }
            }

            setConversations(Array.from(conversationMap.values()));
        } catch (error) {
            console.error("Error loading conversations:", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Separate urgent (direct) conversations to show them first
    const urgentConversations = conversations.filter(c => c.request_type === 'direct' && c.job_status === 'open');
    const regularConversations = conversations.filter(c => !(c.request_type === 'direct' && c.job_status === 'open'));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mensajes</h1>
                <p className="text-muted-foreground">Tus conversaciones con clientes</p>
            </div>

            {conversations.length === 0 && !selectedConversation ? (
                <Card className="p-12 text-center">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No tenés mensajes todavía</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Cuando un cliente te contacte o acepten tu propuesta, las conversaciones aparecerán acá.
                    </p>
                    <Button asChild>
                        <Link href="/pro/browse-jobs">Ver trabajos disponibles</Link>
                    </Button>
                </Card>
            ) : selectedConversation && currentUserId ? (
                <div className="max-w-3xl mx-auto">
                    <Button variant="ghost" onClick={() => setSelectedConversation(null)} className="mb-4">
                        ← Volver a conversaciones
                    </Button>
                    <div className="mb-4">
                        <h2 className="text-xl font-bold">
                            {selectedConversation.job_title
                                ? `${selectedConversation.job_title} · ${selectedConversation.other_user.full_name}`
                                : `Chat con ${selectedConversation.other_user.full_name}`}
                        </h2>
                        {selectedConversation.request_type === 'direct' && (
                            <Badge className="bg-orange-100 text-orange-700 border-orange-300 mt-1">
                                <Zap className="w-3 h-3 mr-1" /> Urgente
                            </Badge>
                        )}
                    </div>
                    <ChatWindow
                        jobId={selectedConversation.job_id}
                        jobTitle={selectedConversation.job_title}
                        jobStatus={selectedConversation.job_status}
                        requestType={selectedConversation.request_type}
                        currentUser={{ id: currentUserId, role: "professional" }}
                        otherUser={{
                            id: selectedConversation.other_user.id,
                            full_name: selectedConversation.other_user.full_name,
                            avatar_url: selectedConversation.other_user.avatar_url || undefined,
                            profilePath: `/profile/${selectedConversation.other_user.id}`,
                        }}
                    />
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Urgent first */}
                    {urgentConversations.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2 text-orange-600">
                                <Zap className="w-4 h-4" />
                                <span className="text-sm font-semibold">Solicitudes urgentes — respondé rápido</span>
                            </div>
                            <div className="space-y-2">
                                {urgentConversations.map(conv => (
                                    <Card
                                        key={conv.id}
                                        className="p-4 cursor-pointer hover:bg-orange-50 border-orange-200 transition-colors"
                                        onClick={() => setSelectedConversation(conv)}
                                    >
                                        {ConversationRow(conv)}
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* Regular */}
                    {regularConversations.length > 0 && (
                        <div className="space-y-2">
                            {regularConversations.map(conv => (
                                <Card
                                    key={conv.id}
                                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => setSelectedConversation(conv)}
                                >
                                    {ConversationRow(conv)}
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function ConversationRow(conv: { job_title?: string; request_type?: string; other_user: { full_name: string }; last_message: string; last_message_at: string }) {
    return (
        <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="font-semibold text-primary">{conv.other_user.full_name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{conv.other_user.full_name}</h3>
                    {conv.request_type === 'direct' && (
                        <Badge variant="secondary" className="text-orange-600 bg-orange-50 border-orange-200 text-xs py-0">
                            ⚡ Urgente
                        </Badge>
                    )}
                </div>
                {conv.job_title && (
                    <p className="text-xs font-medium text-foreground/70 truncate">{conv.job_title}</p>
                )}
                <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
            </div>
            <div className="text-xs text-muted-foreground shrink-0">
                {new Date(conv.last_message_at).toLocaleDateString()}
            </div>
        </div>
    );
}
