"use client";

import { ChatWindow } from "@/components/chat/ChatWindow";

export default function ChatPage() {
    const mockParams = {
        jobId: "1",
        currentUser: { id: "c1" }, // Simulating Client
        otherUser: { id: "p1", full_name: "Juan Pérez", avatar_url: "https://github.com/shadcn.png" } // Professional
    };

    return (
        <div className="max-w-3xl mx-auto h-[calc(100vh-200px)]">
            <div className="mb-4">
                <h1 className="text-2xl font-bold">Chat con Juan Pérez</h1>
                <p className="text-muted-foreground">Trabajo: Instalación de luminarias</p>
            </div>
            <ChatWindow {...mockParams} />
        </div>
    );
}
