"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Search, MapPin, SlidersHorizontal, Filter, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ProfessionalCard } from "@/components/professional/ProfessionalCard";
import { JOB_CATEGORIES } from "@/lib/constants/job-categories";
import { createClient } from "@/lib/supabase/client";

interface Professional {
    id: string;
    full_name: string;
    avatar_url: string | null;
    trade: string;
    rating: number;
    reviews_count: number;
    hourly_rate: number;
    location: { city: string; distance?: number };
    is_verified: boolean;
    available_now: boolean;
}

interface GeorefMunicipio {
    nombre: string;
    provincia: { nombre: string };
}

// Fetch municipalities from the official Georef Argentina API
async function fetchCitySuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];
    try {
        const res = await fetch(
            `https://apis.datos.gob.ar/georef/api/municipios?nombre=${encodeURIComponent(query)}&max=8&campos=nombre,provincia.nombre`
        );
        const json = await res.json();
        return (json.municipios as GeorefMunicipio[]).map(
            m => `${m.nombre}, ${m.provincia.nombre}`
        );
    } catch {
        return [];
    }
}

export default function SearchPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [professionals, setProfessionals] = useState<Professional[]>([]);

    // Search & filters
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [priceRange, setPriceRange] = useState([0, 100000]);
    const [onlyVerified, setOnlyVerified] = useState(false);
    const [availableNow, setAvailableNow] = useState(false);

    // City autocomplete — kept at top level so state changes don't re-create the input
    const [cityInput, setCityInput] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [cityLoading, setCityLoading] = useState(false);
    const cityRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        loadProfessionals();
        function handleClick(e: MouseEvent) {
            if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    async function loadProfessionals() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('city')
                    .eq('user_id', user.id)
                    .single();
                if (profile?.city) {
                    setCityInput(profile.city);
                    setSelectedCity(profile.city);
                }
            }

            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    id, full_name, avatar_url, city, identity_verified,
                    professional_profiles (
                        trade, hourly_rate, available_now, average_rating, total_reviews
                    )
                `)
                .eq('user_type', 'professional')
                .eq('is_active', true);

            if (!error && data) {
                setProfessionals(
                    data
                        .filter((p: any) => p.professional_profiles !== null)
                        .map((p: any) => {
                            const pp = p.professional_profiles;
                            return {
                                id: p.id,
                                full_name: p.full_name,
                                avatar_url: p.avatar_url,
                                location: { city: p.city || 'CABA', distance: 0 },
                                trade: pp.trade || 'general',
                                hourly_rate: pp.hourly_rate || 0,
                                is_verified: p.identity_verified || false,
                                available_now: pp.available_now || false,
                                rating: pp.average_rating || 0,
                                reviews_count: pp.total_reviews || 0,
                            };
                        })
                );
            }
        } catch (err) {
            console.error("Error loading professionals:", err);
        } finally {
            setLoading(false);
        }
    }

    // Debounced city search via Georef API
    function handleCityInput(value: string) {
        setCityInput(value);
        setSelectedCity(""); // clear filter until user picks from list

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (value.length < 2) {
            setCitySuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setCityLoading(true);
        debounceRef.current = setTimeout(async () => {
            const suggestions = await fetchCitySuggestions(value);
            setCitySuggestions(suggestions);
            setShowSuggestions(suggestions.length > 0);
            setCityLoading(false);
        }, 300);
    }

    function selectCity(city: string) {
        // Extract just the municipality name (before the comma) for filter matching
        const cityName = city.split(",")[0].trim();
        setCityInput(city);
        setSelectedCity(cityName);
        setShowSuggestions(false);
    }

    function clearCity() {
        setCityInput("");
        setSelectedCity("");
        setCitySuggestions([]);
        setShowSuggestions(false);
    }

    function clearAllFilters() {
        clearCity();
        setSelectedCategory("all");
        setOnlyVerified(false);
        setAvailableNow(false);
        setPriceRange([0, 100000]);
        setSearchTerm("");
    }

    const hasActiveFilters = selectedCity || selectedCategory !== "all" || onlyVerified || availableNow;

    // Client-side filtering
    const filteredPros = professionals.filter(pro => {
        const matchesSearch = !searchTerm ||
            pro.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pro.trade.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "all" || pro.trade === selectedCategory;
        const matchesCity = !selectedCity ||
            pro.location.city.toLowerCase().includes(selectedCity.toLowerCase());
        const matchesVerified = !onlyVerified || pro.is_verified;
        const matchesAvailable = !availableNow || pro.available_now;
        const matchesPrice = pro.hourly_rate >= priceRange[0] && pro.hourly_rate <= priceRange[1];
        return matchesSearch && matchesCategory && matchesCity && matchesVerified && matchesAvailable && matchesPrice;
    });

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER: Note — filter JSX is rendered inline, NOT as a nested component.
    // Defining a component like `const FilterContent = () => <.../>` inside
    // the parent causes React to remount it on every render → focus is lost.
    // ─────────────────────────────────────────────────────────────────────────

    const filterJSX = (
        <div className="space-y-6">
            {/* City autocomplete */}
            <div className="space-y-2">
                <Label>Ciudad</Label>
                <div ref={cityRef} className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                    <Input
                        placeholder="Ej: Berisso, Córdoba..."
                        className="pl-9 pr-8"
                        value={cityInput}
                        onChange={(e) => handleCityInput(e.target.value)}
                        onFocus={() => citySuggestions.length > 0 && setShowSuggestions(true)}
                        autoComplete="off"
                    />
                    {cityLoading && (
                        <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!cityLoading && cityInput && (
                        <button
                            className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                            onClick={clearCity}
                            type="button"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    {showSuggestions && citySuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg overflow-hidden">
                            {citySuggestions.map(city => (
                                <button
                                    key={city}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2 transition-colors"
                                    onMouseDown={() => selectCity(city)}
                                    type="button"
                                >
                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                    {city}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {selectedCity && (
                    <p className="text-xs text-orange-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Filtrando por: <strong>{selectedCity}</strong>
                    </p>
                )}
            </div>

            {/* Category */}
            <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las categorías</SelectItem>
                        {JOB_CATEGORIES.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Price range */}
            <div className="space-y-4">
                <div className="flex justify-between">
                    <Label>Precio por hora</Label>
                    <span className="text-sm text-muted-foreground">
                        ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
                    </span>
                </div>
                <Slider defaultValue={[0, 100000]} max={100000} step={1000} value={priceRange} onValueChange={setPriceRange} />
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
                <div className="flex items-center space-x-2">
                    <Checkbox id="verified" checked={onlyVerified} onCheckedChange={(c) => setOnlyVerified(!!c)} />
                    <Label htmlFor="verified" className="font-normal cursor-pointer">Solo verificados</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="available" checked={availableNow} onCheckedChange={(c) => setAvailableNow(!!c)} />
                    <Label htmlFor="available" className="font-normal cursor-pointer">Disponible ahora</Label>
                </div>
            </div>

            {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="text-muted-foreground w-full" onClick={clearAllFilters}>
                    Limpiar todos los filtros
                </Button>
            )}
        </div>
    );

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
                <h1 className="text-3xl font-bold tracking-tight">Buscar Profesionales</h1>
                <p className="text-muted-foreground mt-1">
                    {filteredPros.length} profesional{filteredPros.length !== 1 ? "es" : ""} encontrado{filteredPros.length !== 1 ? "s" : ""}
                    {selectedCity && <span className="text-orange-600"> en {selectedCity}</span>}
                </p>
            </div>

            {/* Search bar */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o servicio..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {/* Mobile: filter sheet */}
                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Filtros</SheetTitle>
                                <SheetDescription>Refiná tu búsqueda.</SheetDescription>
                            </SheetHeader>
                            <div className="py-6">{filterJSX}</div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Desktop filter sidebar */}
                <div className="hidden md:block space-y-6 sticky top-24 h-fit">
                    <div className="font-semibold flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4" />
                        Filtros
                    </div>
                    {filterJSX}
                </div>

                {/* Results */}
                <div className="md:col-span-3 space-y-4">
                    {filteredPros.length > 0 ? (
                        filteredPros.map(pro => <ProfessionalCard key={pro.id} professional={pro} />)
                    ) : (
                        <div className="text-center py-12 bg-muted/20 rounded-lg">
                            <p className="text-muted-foreground">No se encontraron profesionales con estos filtros.</p>
                            <Button variant="link" onClick={clearAllFilters}>Limpiar filtros</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
