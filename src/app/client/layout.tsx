import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-muted/20">
            <Header />

            <div className="flex">
                <Sidebar className="hidden md:block" userType="client" />

                <main className="flex-1 pb-16 md:pb-0">
                    <div className="container py-6 md:py-8 max-w-5xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>

            <BottomNav />
        </div>
    );
}
