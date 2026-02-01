"use client";

import { useState } from "react";
import { Search, MapPin, Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ProfessionalCard } from "@/components/professional/ProfessionalCard";
import { JOB_CATEGORIES } from "@/lib/constants/job-categories";

// Mock Data
const MOCK_PROFESSIONALS = [
    {
        id: "1",
        full_name: "Juan Pérez",
        avatar_url: "https://github.com/shadcn.png",
        trade: "plumbing",
        // subcategories: ["leak", "installation"],
        rating: 4.8,
        reviews_count: 124,
        hourly_rate: 8000,
        location: { city: "Palermo, CABA", distance: 1.2 },
        is_verified: true,
        available_now: true,
    },
    {
        id: "2",
        full_name: "María Garcia",
        avatar_url: "https://randomuser.me/api/portraits/women/44.jpg",
        trade: "electrical",
        rating: 5.0,
        reviews_count: 56,
        hourly_rate: 12000,
        location: { city: "Belgrano, CABA", distance: 3.5 },
        is_verified: true,
        available_now: false,
    },
    {
        id: "3",
        full_name: "Carlos Rodriguez",
        avatar_url: "https://randomuser.me/api/portraits/men/32.jpg",
        trade: "gas",
        rating: 4.5,
        reviews_count: 89,
        hourly_rate: 15000,
        location: { city: "Almagro, CABA", distance: 5.0 },
        is_verified: true,
        available_now: true,
    },
] as any[];


export default function SearchPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [priceRange, setPriceRange] = useState([0, 50000]);
    const [onlyVerified, setOnlyVerified] = useState(false);
    const [availableNow, setAvailableNow] = useState(false);

    // Simple client-side filtering logic (Replace with Supabase query later)
    const filteredPros = MOCK_PROFESSIONALS.filter(pro => {
        // Search
        if (searchTerm && !pro.full_name.toLowerCase().includes(searchTerm.toLowerCase()) && !pro.trade.includes(searchTerm.toLowerCase())) {
            return false;
        }
        // Category
        if (selectedCategory && selectedCategory !== "all" && pro.trade !== selectedCategory) {
            return false;
        }
        // Verified
        if (onlyVerified && !pro.is_verified) return false;
        // Available
        if (availableNow && !pro.available_now) return false;
        // Price
        if (pro.hourly_rate < priceRange[0] || pro.hourly_rate > priceRange[1]) return false;

        return true;
    });

    const FilterContent = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las categorías</SelectItem>
                        {JOB_CATEGORIES.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between">
                    <Label>Precio por hora</Label>
                    <span className="text-sm text-muted-foreground">
                        ${priceRange[0]} - ${priceRange[1]}
                    </span>
                </div>
                <Slider
                    defaultValue={[0, 50000]}
                    max={100000}
                    step={1000}
                    value={priceRange}
                    onValueChange={setPriceRange}
                />
            </div>

            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="verified"
                        checked={onlyVerified}
                        onCheckedChange={(c) => setOnlyVerified(!!c)}
                    />
                    <Label htmlFor="verified" className="font-normal cursor-pointer">
                        Solo verificados
                    </Label>
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="available"
                        checked={availableNow}
                        onCheckedChange={(c) => setAvailableNow(!!c)}
                    />
                    <Label htmlFor="available" className="font-normal cursor-pointer">
                        Disponible ahora
                    </Label>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Buscar Profesionales</h1>
                    <p className="text-muted-foreground">
                        Encontrá al experto ideal para tu trabajo
                    </p>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o servicio..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

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
                                <SheetDescription>
                                    Refiná tu búsqueda para encontrar el profesional ideal.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="py-6">
                                <FilterContent />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                <div className="hidden md:block">
                    {/* Desktop Filter View Toggle - For now just consistent layout */}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Desktop Filters Sidebar */}
                <div className="hidden md:block space-y-6 sticky top-24 h-fit">
                    <div className="font-semibold flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4" />
                        Filtros
                    </div>
                    <FilterContent />
                </div>

                {/* Results */}
                <div className="md:col-span-3 space-y-4">
                    {filteredPros.length > 0 ? (
                        filteredPros.map((pro) => (
                            <ProfessionalCard key={pro.id} professional={pro} />
                        ))
                    ) : (
                        <div className="text-center py-12 bg-muted/20 rounded-lg">
                            <p className="text-muted-foreground">No se encontraron profesionales con estos filtros.</p>
                            <Button variant="link" onClick={() => {
                                setSearchTerm("");
                                setSelectedCategory("all");
                                setPriceRange([0, 50000]);
                                setOnlyVerified(false);
                                setAvailableNow(false);
                            }}>
                                Limpiar filtros
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
