"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, SlidersHorizontal, MapPin, Loader2 } from "lucide-react";
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
import { createClient } from "@/lib/supabase/client";

interface Job {
    id: string;
    title: string;
    description: string;
    category_id: string;
    status: string;
    address: string;
    city: string;
    client_budget_max: number | null;
    urgency: string;
    created_at: string;
}

export default function BrowseJobsPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [distance, setDistance] = useState([10]);
    const [selectedSort, setSelectedSort] = useState("newest");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadJobs();
    }, []);

    async function loadJobs() {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            // Get all open jobs
            const { data: jobsData, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('status', 'open')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const transformedJobs = jobsData.map((job: any) => ({
                ...job,
                client: {
                    full_name: "Cliente",
                    avatar_url: null,
                },
                location: {
                    address: job.address,
                    city: job.city,
                },
                budget: job.client_budget_max,
            }));

            setJobs(transformedJobs);
        } catch (error) {
            console.error("Error loading jobs:", error);
        } finally {
            setLoading(false);
        }
    }

    // Client-side filtering
    const filteredJobs = jobs.filter(job => {
        if (searchTerm && !job.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !job.city.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

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
                        <Input
                            placeholder="Buscar por título, zona..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
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
                {filteredJobs.length === 0 ? (
                    <div className="text-center py-12 bg-muted/20 rounded-lg">
                        <p className="text-muted-foreground mb-4">
                            No hay trabajos disponibles en este momento
                        </p>
                        <Button variant="link" onClick={() => setSearchTerm("")}>
                            Limpiar búsqueda
                        </Button>
                    </div>
                ) : (
                    filteredJobs.map((job) => (
                        <JobCard
                            key={job.id}
                            job={job as any}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
