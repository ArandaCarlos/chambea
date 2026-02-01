"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Briefcase,
  Search,
  Star,
  ShieldCheck,
  Zap,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navbar */}
      <header className="px-6 h-16 flex items-center justify-between border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-black text-sm">C</div>
          <span>CHAMBEA</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="#features" className="hover:text-primary transition-colors">Cómo funciona</Link>
          <Link href="#guarantee" className="hover:text-primary transition-colors">Garantía</Link>
          <Link href="/login" className="hover:text-primary transition-colors">Ingresar</Link>
        </nav>

        <div className="flex gap-3">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/login">Soy Profesional</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Registrate Gratis</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />

          <div className="container px-4 md:px-6 mx-auto text-center space-y-8">
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm bg-background shadow-sm mb-4">
              <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              Lanzamiento Beta 2024
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter max-w-4xl mx-auto">
              Solucioná tus problemas del hogar <span className="text-primary block sm:inline">en minutos.</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              La plataforma más segura para contratar plomeros, electricistas y gasistas verificados.
              Tu dinero se libera solo cuando el trabajo está terminado.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Button size="lg" className="h-14 px-8 text-lg w-full sm:w-auto shadow-lg hover:shadow-2lg transition-all" asChild>
                <Link href="/client/dashboard">
                  <Search className="mr-2 h-5 w-5" />
                  Buscar Profesional
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full sm:w-auto" asChild>
                <Link href="/pro/dashboard">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Soy Chambeador
                </Link>
              </Button>
            </div>

            <div className="flex justify-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Profesionales Verificados
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Pagos Protegidos
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Sin Costos Ocultos
              </div>
            </div>
          </div>
        </section>

        {/* Demo Roles Section (Ephemeral for Testing) */}
        <section className="py-12 bg-muted/30 border-y border-dashed border-primary/20">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">🛠️ Acceso Rápido (Modo Demo)</h2>
              <p className="text-muted-foreground">Entrá directamente a los paneles para probar el flujo.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link href="/client/dashboard" className="group">
                <div className="bg-background border p-6 rounded-xl hover:border-primary transition-all hover:shadow-lg text-center h-full">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold mb-2">Cliente</h3>
                  <p className="text-sm text-muted-foreground">Publicá trabajos, recibí propuestas y contratá.</p>
                  <Button variant="ghost" className="mt-4 w-full group-hover:bg-blue-50 group-hover:text-blue-600">Entrar</Button>
                </div>
              </Link>

              <Link href="/pro/dashboard" className="group">
                <div className="bg-background border p-6 rounded-xl hover:border-primary transition-all hover:shadow-lg text-center h-full">
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold mb-2">Profesional</h3>
                  <p className="text-sm text-muted-foreground">Buscá oportunidades, enviá cotizaciones y ganá dinero.</p>
                  <Button variant="ghost" className="mt-4 w-full group-hover:bg-orange-50 group-hover:text-orange-600">Entrar</Button>
                </div>
              </Link>

              <Link href="/admin/dashboard" className="group">
                <div className="bg-background border p-6 rounded-xl hover:border-primary transition-all hover:shadow-lg text-center h-full">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold mb-2">Admin</h3>
                  <p className="text-sm text-muted-foreground">Aprobá perfiles y monitoreá métricas.</p>
                  <Button variant="ghost" className="mt-4 w-full group-hover:bg-purple-50 group-hover:text-purple-600">Entrar</Button>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Preview */}
        <section id="features" className="py-20">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">Seguridad en cada paso.</h2>
                <p className="text-lg text-muted-foreground">
                  Chambea retiene el pago hasta que vos confirmes que el trabajo se realizó correctamente. Si algo sale mal, te devolvemos el dinero.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Identidad Validada (DNI + Bio)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Respuesta en menos de 1 hora</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                      <Star className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Sistema de 5 estrellas real</span>
                  </li>
                </ul>
              </div>
              <div className="bg-muted rounded-2xl p-8 aspect-video flex items-center justify-center border-2 border-dashed">
                <p className="text-muted-foreground">Imagen Ilustrativa de la App</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t text-center text-sm text-muted-foreground">
        <div className="container px-4">
          <p>&copy; 2024 Chambea. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
