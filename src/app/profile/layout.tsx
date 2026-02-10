import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

// Common layout for profile page
export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-muted/20">
            <Header />
            <main className="container py-8 max-w-4xl mx-auto pb-20 md:pb-8">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
