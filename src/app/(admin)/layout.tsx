import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-muted/20">
            <Header />

            <div className="flex">
                <Sidebar className="hidden md:block" userType="admin" />

                <main className="flex-1 pb-16 md:pb-0">
                    <div className="container py-6 md:py-8 max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
