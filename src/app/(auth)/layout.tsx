import Link from "next/link";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left Side - Visual/Marketing */}
            <div className="hidden lg:flex flex-col justify-between bg-primary p-10 text-primary-foreground">
                <div className="flex items-center gap-2 font-bold text-2xl">
                    <div className="bg-white text-primary rounded-full w-8 h-8 flex items-center justify-center font-black">
                        C
                    </div>
                    CHAMBEA
                </div>

                <div className="space-y-6 max-w-lg">
                    <h1 className="text-4xl font-bold leading-tight">
                        Los mejores profesionales para tu hogar, al alcance de un clic.
                    </h1>
                    <p className="text-lg opacity-90">
                        Encontrá plomeros, electricistas y gasistas verificados en tu zona.
                        Pagos seguros y garantía de satisfacción.
                    </p>
                </div>

                <div className="text-sm opacity-70">
                    &copy; {new Date().getFullYear()} Chambea Argentina. Todos los derechos reservados.
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex flex-col items-center justify-center p-6 sm:p-10 bg-background">
                <div className="w-full max-w-md space-y-8">
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="flex items-center gap-2 font-bold text-2xl text-primary">
                            <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-black">
                                C
                            </div>
                            CHAMBEA
                        </div>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
