"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ChatWindow } from "@/components/chat/ChatWindow";

interface Conversation {
    id: string;
    job_id: string;
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

    useEffect(() => {
        loadConversations();
    }, []);

    async function loadConversations() {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            // Get profile id
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!profile) return;
            setCurrentUserId(profile.id);

            // Get messages where user is sender or receiver
            const { data: messages, error } = await supabase
                .from('messages')
                .select('*')
                .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Group by conversation (job_id + other user)
            const conversationMap = new Map<string, Conversation>();

            for (const msg of messages || []) {
                const otherUserId = msg.sender_id === profile.id ? msg.receiver_id : msg.sender_id;
                const conversationKey = `${msg.job_id}-${otherUserId}`;

                if (!conversationMap.has(conversationKey)) {
                    // Get other user info
                    const { data: otherUser } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url')
                        .eq('id', otherUserId)
                        .single();

                    if (otherUser) {
                        conversationMap.set(conversationKey, {
                            id: conversationKey,
                            job_id: msg.job_id,
                            other_user: otherUser,
                            last_message: msg.content,
                            last_message_at: msg.created_at,
                            unread_count: 0 // TODO: Implement unread tracking
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mensajes</h1>
                <p className="text-muted-foreground">
                    Tus conversaciones con clientes
                </p>
            </div>

            {conversations.length === 0 ? (
                <Card className="p-12 text-center">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No tienes mensajes todavía</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Cuando envíes propuestas, podrás chatear con los clientes aquí
                    </p>
                    <Button asChild>
                        <Link href="/pro/browse-jobs">Buscar trabajos</Link>
                    </Button>
                </Card>
            ) : selectedConversation ? (
                <div className="max-w-3xl mx-auto">
                    <Button
                        variant="ghost"
                        onClick={() => setSelectedConversation(null)}
                        className="mb-4"
                    >
                        ← Volver a conversaciones
                    </Button>
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold">Chat con {selectedConversation.other_user.full_name}</h2>
                    </div>
                    <ChatWindow
                        jobId={selectedConversation.job_id}
                        currentUser={{ id: currentUserId }}
                        otherUser={{
                            id: selectedConversation.other_user.id,
                            full_name: selectedConversation.other_user.full_name,
                            avatar_url: selectedConversation.other_user.avatar_url || undefined
                        }}
                    />
                </div>
            ) : (
                <div className="space-y-2">
                    {conversations.map((conversation) => (
                        <Card
                            key={conversation.id}
                            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setSelectedConversation(conversation)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="font-semibold text-primary">
                                        {conversation.other_user.full_name[0]}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold">{conversation.other_user.full_name}</h3>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {conversation.last_message}
                                    </p>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {new Date(conversation.last_message_at).toLocaleDateString()}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
