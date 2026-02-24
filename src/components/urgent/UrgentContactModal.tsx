"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Zap, MapPin, FileText, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface UrgentContactModalProps {
    open: boolean;
    onClose: () => void;
    professional: {
        id: string;
        full_name: string;
        trade: string;
    };
}

interface AddressSuggestion {
    label: string;    // display text
    normalized: string; // value to save
}

async function fetchAddressSuggestions(query: string): Promise<AddressSuggestion[]> {
    if (query.length < 5) return [];
    try {
        const url = `https://apis.datos.gob.ar/georef/api/direcciones?direccion=${encodeURIComponent(query)}&max=10`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();

        // Use nomenclatura (already clean) and deduplicate — API returns same street
        // many times when no house number is found (one entry per block segment)
        const seen = new Set<string>();
        const results: AddressSuggestion[] = [];

        for (const d of (data.direcciones ?? [])) {
            const base = d.nomenclatura as string | undefined;
            if (!base) continue;

            // Prepend house number if available
            const number = d.altura?.valor;
            const label = number ? `${d.calle?.nombre ?? ""} ${number}, ${base.split(",").slice(1).join(",").trim()}` : base;

            if (!seen.has(label)) {
                seen.add(label);
                results.push({ label, normalized: label });
            }
            if (results.length >= 6) break;
        }

        return results;
    } catch {
        return [];
    }
}

export function UrgentContactModal({ open, onClose, professional }: UrgentContactModalProps) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ title: "", description: "", address: "" });

    // Address autocomplete state
    const [addressInput, setAddressInput] = useState("");
    const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Debounced address search
    useEffect(() => {
        if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
        if (addressInput.length < 5) { setAddressSuggestions([]); return; }
        setIsLoadingAddress(true);
        addressDebounceRef.current = setTimeout(async () => {
            const results = await fetchAddressSuggestions(addressInput);
            setAddressSuggestions(results);
            setShowSuggestions(results.length > 0);
            setIsLoadingAddress(false);
        }, 350);
    }, [addressInput]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    function handleSelectAddress(suggestion: AddressSuggestion) {
        setAddressInput(suggestion.normalized);
        setForm(f => ({ ...f, address: suggestion.normalized }));
        setShowSuggestions(false);
    }

    function handleAddressInputChange(value: string) {
        setAddressInput(value);
        setForm(f => ({ ...f, address: value })); // keep form in sync even without selecting suggestion
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.title.trim() || !form.address.trim()) {
            toast.error("Completá el título y la dirección");
            return;
        }
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/login"); return; }

            const { data: clientProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!clientProfile) throw new Error("No se encontró el perfil");

            const { data: job, error } = await supabase
                .from('jobs')
                .insert({
                    client_id: clientProfile.id,
                    professional_id: professional.id,
                    category_id: professional.trade,
                    request_type: 'direct',
                    title: form.title.trim(),
                    description: form.description.trim() || `Solicitud urgente para ${professional.full_name}`,
                    address: form.address.trim(),
                    urgency: 'high',
                    status: 'open',
                })
                .select('id')
                .single();

            if (error) throw error;

            await supabase.from('messages').insert({
                job_id: job.id,
                sender_id: clientProfile.id,
                receiver_id: professional.id,
                content: `Hola ${professional.full_name}! Te contacto por un trabajo urgente: "${form.title}". ${form.description ? `Descripción: ${form.description}` : ''} Dirección: ${form.address}`,
                message_type: 'text',
            });

            toast.success("¡Solicitud enviada! Abriendo chat...");
            onClose();
            router.push(`/client/messages?jobId=${job.id}&proId=${professional.id}`);
        } catch (error: any) {
            console.error(error);
            toast.error("Error al crear la solicitud. Intentá de nuevo.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-orange-500" />
                        Solicitud urgente
                    </DialogTitle>
                    <DialogDescription>
                        Contactás directamente a <strong>{professional.full_name}</strong>. Él recibirá tu solicitud y podrá enviarte un presupuesto en el chat.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <Label htmlFor="urgent-title">¿Qué necesitás?</Label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="urgent-title"
                                className="pl-9"
                                placeholder="Ej: Reparar caño roto en baño"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                disabled={loading}
                                maxLength={100}
                                required
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label htmlFor="urgent-desc">Descripción breve <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                        <Textarea
                            id="urgent-desc"
                            placeholder="Más detalles del problema..."
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            disabled={loading}
                            rows={2}
                            maxLength={300}
                            className="resize-none"
                        />
                    </div>

                    {/* Address with Georef autocomplete */}
                    <div className="space-y-1.5">
                        <Label htmlFor="urgent-address">Dirección del trabajo</Label>
                        <div className="relative" ref={suggestionsRef}>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                <Input
                                    id="urgent-address"
                                    className="pl-9 pr-8"
                                    placeholder="Av. Corrientes 1234, CABA"
                                    value={addressInput}
                                    onChange={e => handleAddressInputChange(e.target.value)}
                                    onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                                    disabled={loading}
                                    autoComplete="off"
                                    required
                                />
                                {isLoadingAddress && (
                                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                                {addressInput && !isLoadingAddress && (
                                    <button
                                        type="button"
                                        onClick={() => { setAddressInput(""); setForm(f => ({ ...f, address: "" })); setAddressSuggestions([]); }}
                                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {/* Suggestions dropdown */}
                            {showSuggestions && addressSuggestions.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg overflow-hidden">
                                    {addressSuggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => handleSelectAddress(s)}
                                            className={cn(
                                                "w-full text-left px-3 py-2.5 text-sm flex items-start gap-2 hover:bg-muted transition-colors",
                                                i > 0 && "border-t"
                                            )}
                                        >
                                            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-orange-500" />
                                            <span>{s.label}</span>
                                        </button>
                                    ))}
                                    <div className="px-3 py-1.5 text-[10px] text-muted-foreground bg-muted/40 border-t">
                                        Fuente: Georef API — datos.gob.ar
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">Escribí al menos 5 caracteres para ver sugerencias normalizadas</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="flex-1">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-600">
                            {loading ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                            ) : (
                                <><Zap className="w-4 h-4 mr-2" /> Contactar ahora</>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
