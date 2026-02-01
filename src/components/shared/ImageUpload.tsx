"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
    bucket?: string;
    folder?: string;
    onUploadComplete: (urls: string[]) => void;
    maxFiles?: number;
    className?: string;
}

export function ImageUpload({
    bucket = "job-photos",
    folder = "uploads",
    onUploadComplete,
    maxFiles = 5,
    className,
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [previews, setPreviews] = useState<string[]>([]);
    const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (previews.length + files.length > maxFiles) {
            toast.error(`Máximo ${maxFiles} imágenes permitidas`);
            return;
        }

        // Generate previews
        const newPreviews = files.map((file) => URL.createObjectURL(file));
        setPreviews((prev) => [...prev, ...newPreviews]);

        // Upload
        setUploading(true);
        const newUrls: string[] = [];

        try {
            for (const file of files) {
                const fileExt = file.name.split(".").pop();
                const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from(bucket)
                    .upload(fileName, file);

                if (uploadError) {
                    console.error("Upload error:", uploadError);
                    toast.error(`Error al subir imagen: ${file.name}`);
                    continue;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(fileName);

                newUrls.push(publicUrl);
            }

            const allUrls = [...uploadedUrls, ...newUrls];
            setUploadedUrls(allUrls);
            onUploadComplete(allUrls);

        } catch (error) {
            console.error(error);
            toast.error("Ocurrió un error inesperado al subir imágenes");
        } finally {
            setUploading(false);
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const removeImage = (index: number) => {
        const newPreviews = [...previews];
        const newUrls = [...uploadedUrls];

        // Revoke object URL to avoid memory leaks
        URL.revokeObjectURL(newPreviews[index]);

        newPreviews.splice(index, 1);

        // If the image was already uploaded, remove it from the list
        // Note: We are not deleting from storage here to keep it simple for now
        if (index < newUrls.length) {
            newUrls.splice(index, 1);
        }

        setPreviews(newPreviews);
        setUploadedUrls(newUrls);
        onUploadComplete(newUrls);
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {previews.map((preview, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border">
                        <Image
                            src={preview}
                            alt={`Preview ${idx}`}
                            fill
                            className="object-cover"
                        />
                        <button
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                            type="button"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {previews.length < maxFiles && (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
                    >
                        {uploading ? (
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        ) : (
                            <>
                                <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                                <span className="text-xs text-muted-foreground font-medium">
                                    Agregar fotos
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
            />
        </div>
    );
}
