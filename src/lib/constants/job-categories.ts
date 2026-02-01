export const JOB_CATEGORIES = [
    {
        id: "plumbing",
        name: "Plomería",
        slug: "plomeria",
        icon: "🔧",
        description: "Reparación e instalación de cañerías, grifos y sanitarios",
        subcategories: [
            { id: "leak", name: "Pérdida de agua", slug: "perdida-agua" },
            { id: "unclog", name: "Destape", slug: "destape" },
            { id: "installation", name: "Instalación", slug: "instalacion" },
            { id: "water-heater", name: "Calefón/Termotanque", slug: "calefon" },
        ],
    },
    {
        id: "electrical",
        name: "Electricidad",
        slug: "electricidad",
        icon: "⚡",
        description: "Instalación y reparación de sistemas eléctricos",
        subcategories: [
            { id: "outlet", name: "Tomacorrientes", slug: "tomacorrientes" },
            { id: "lighting", name: "Iluminación", slug: "iluminacion" },
            { id: "wiring", name: "Cableado", slug: "cableado" },
            { id: "circuit-breaker", name: "Tablero/Disyuntores", slug: "tablero" },
        ],
    },
    {
        id: "gas",
        name: "Gasista",
        slug: "gas",
        icon: "🔥",
        description: "Instalación y reparación de gas natural y envasado",
        subcategories: [
            { id: "gas-leak", name: "Pérdida de gas", slug: "perdida-gas" },
            { id: "stove", name: "Cocina/Anafe", slug: "cocina" },
            { id: "heater", name: "Calefactor", slug: "calefactor" },
            { id: "certification", name: "Certificación", slug: "certificacion" },
        ],
    },
    {
        id: "construction",
        name: "Albañilería",
        slug: "albanileria",
        icon: "🏗️",
        description: "Construcción, reparación y remodelación",
        subcategories: [
            { id: "wall", name: "Paredes", slug: "paredes" },
            { id: "floor", name: "Pisos", slug: "pisos" },
            { id: "ceiling", name: "Techos", slug: "techos" },
            { id: "remodeling", name: "Remodelación", slug: "remodelacion" },
        ],
    },
    {
        id: "painting",
        name: "Pintura",
        slug: "pintura",
        icon: "🎨",
        description: "Pintura de interiores y exteriores",
        subcategories: [
            { id: "interior", name: "Interior", slug: "interior" },
            { id: "exterior", name: "Exterior", slug: "exterior" },
            { id: "waterproofing", name: "Impermeabilización", slug: "impermeabilizacion" },
        ],
    },
    {
        id: "carpentry",
        name: "Carpintería",
        slug: "carpinteria",
        icon: "🪵",
        description: "Trabajos en madera y muebles",
        subcategories: [
            { id: "furniture", name: "Muebles", slug: "muebles" },
            { id: "doors", name: "Puertas/Ventanas", slug: "puertas" },
            { id: "repair", name: "Reparaciones", slug: "reparaciones" },
        ],
    },
    {
        id: "cleaning",
        name: "Limpieza",
        slug: "limpieza",
        icon: "🧹",
        description: "Servicios de limpieza profesional",
        subcategories: [
            { id: "deep-cleaning", name: "Limpieza profunda", slug: "profunda" },
            { id: "regular", name: "Limpieza regular", slug: "regular" },
            { id: "post-construction", name: "Post-obra", slug: "post-obra" },
        ],
    },
    {
        id: "ac",
        name: "Aire Acondicionado",
        slug: "aire-acondicionado",
        icon: "❄️",
        description: "Instalación y reparación de aires acondicionados",
        subcategories: [
            { id: "installation", name: "Instalación", slug: "instalacion" },
            { id: "maintenance", name: "Mantenimiento", slug: "mantenimiento" },
            { id: "repair", name: "Reparación", slug: "reparacion" },
            { id: "gas-recharge", name: "Carga de gas", slug: "carga-gas" },
        ],
    },
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];
export type JobCategoryId = JobCategory["id"];

export const URGENCY_LEVELS = {
    low: { label: "Baja", color: "green" },
    medium: { label: "Media", color: "yellow" },
    high: { label: "Alta", color: "orange" },
    emergency: { label: "Urgente", color: "red" },
} as const;

export const JOB_STATUSES = {
    draft: "Borrador",
    open: "Publicado",
    pending_quote: "Esperando presupuesto",
    quoted: "Presupuestado",
    accepted: "Aceptado",
    in_progress: "En progreso",
    pending_client_approval: "Pendiente de aprobación",
    completed: "Completado",
    disputed: "En disputa",
    cancelled: "Cancelado",
    expired: "Expirado",
} as const;

export const PAYMENT_STATUSES = {
    pending: "Pendiente",
    authorized: "Autorizado",
    paid: "Pagado",
    failed: "Fallido",
    refunded: "Reembolsado",
} as const;

export const COMMISSION_RATE = 0.15; // 15%
