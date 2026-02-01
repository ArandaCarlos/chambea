import { JobForm } from "@/components/job/JobForm";

export default function PostJobPage() {
    return (
        <div className="space-y-6">
            <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold tracking-tight">Publicar nuevo trabajo</h1>
                <p className="text-muted-foreground">
                    Completá los detalles para recibir presupuestos de profesionales verificados.
                </p>
            </div>

            <div className="bg-card rounded-xl p-6 border shadow-sm">
                <JobForm />
            </div>
        </div>
    );
}
