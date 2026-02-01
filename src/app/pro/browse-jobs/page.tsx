"use client";

import { useState } from "react";
import { Search, Filter, SlidersHorizontal, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JobCard } from "@/components/job/JobCard";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

// Mock Data
const AVAILABLE_JOBS = [
    {
        id: "1",
        title: "Instalación de luminarias LED",
        category_id: "electrical",
        description: "Necesito cambiar 10 lámparas halógenas por paneles LED...",
        client: { full_name: "Empresa SA", avatar_url: "https://github.com/shadcn.png" },
        location: { address: "Microcentro", city: "CABA", distance: 1.5 },
        budget: 45000,
        urgency: "medium",
        status: "open",
        created_at: new Date().toISOString(),
    },
    {
        id: "2",
        title: "Fuga de gas en estufa",
        category_id: "gas",
        description: "Siento olor a gas cuando prendo la estufa del living...",
        client: { full_name: "Roberto F", avatar_url: null },
        location: { address: "Caballito", city: "CABA", distance: 3.2 },
        budget: 80000,
        urgency: "emergency",
        status: "open",
        created_at: new Date().toISOString(),
    },
    {
        id: "3",
        title: "Pintura departamento 2 ambientes",
        category_id: "painting",
        description: "Pintar living comedor y dormitorio. Paredes y techo...",
        client: { full_name: "Ana Maria", avatar_url: null },
        location: { address: "Villa Urquiza", city: "CABA", distance: 5.0 },
        budget: 150000,
        urgency: "low",
        status: "open",
        created_at: new Date().toISOString(),
    }
];

export default function BrowseJobsPage() {
    const [distance, setDistance] = useState([10]);
    const [selectedSort, setSelectedSort] = useState("newest");

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Trabajos Disponibles</h1>
                    <p className="text-muted-foreground">
                        Explorá nuevas oportunidades de trabajo en tu zona
                    </p>
                </div>
            </div>

            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur pb-4 pt-2 -mt-2">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar por título, zona..." className="pl-9" />
                    </div>

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="shrink-0">
                                <Filter className="mr-2 h-4 w-4" />
                                Filtros
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Filtrar trabajos</SheetTitle>
                            </SheetHeader>
                            <div className="py-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <Label>Distancia máxima</Label>
                                        <span className="text-sm text-muted-foreground">{distance} km</span>
                                    </div>
                                    <Slider
                                        defaultValue={[10]}
                                        max={50}
                                        step={1}
                                        value={distance}
                                        onValueChange={setDistance}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Ordenar por</Label>
                                    <Select value={selectedSort} onValueChange={setSelectedSort}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="newest">Más recientes</SelectItem>
                                            <SelectItem value="closest">Más cercanos</SelectItem>
                                            <SelectItem value="budget_desc">Mayor presupuesto</SelectItem>
                                            <SelectItem value="urgency">Mayor urgencia</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="space-y-4">
                {AVAILABLE_JOBS.map((job) => (
                    <JobCard
                        key={job.id}
                        job={job as any}
                    />
                ))}
            </div>
        </div>
    );
}
