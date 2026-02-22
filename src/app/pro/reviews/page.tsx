"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

function StarRow({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <Star
                    key={s}
                    className={cn(
                        "w-4 h-4",
                        s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"
                    )}
                />
            ))}
        </div>
    );
}

export default function ProReviewsPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ average: 0, total: 0 });
    const [reviews, setReviews] = useState<any[]>([]);

    useEffect(() => {
        loadReviews();
    }, []);

    async function loadReviews() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }

            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!profile) return;

            // Fetch all reviews for this professional with reviewer info
            const { data: reviewsData } = await supabase
                .from('reviews')
                .select(`
                    id,
                    rating,
                    comment,
                    created_at,
                    reviewer:reviewer_id(full_name, avatar_url),
                    job:job_id(title)
                `)
                .eq('reviewee_id', profile.id)
                .eq('review_type', 'client_to_professional')
                .order('created_at', { ascending: false });

            const allReviews = reviewsData || [];
            setReviews(allReviews);

            if (allReviews.length > 0) {
                const avg = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length;
                setStats({ average: Math.round(avg * 10) / 10, total: allReviews.length });
            }

        } catch (error) {
            console.error(error);
            toast.error("Error al cargar las reseñas");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mis Reseñas</h1>
                <p className="text-muted-foreground">Lo que dicen tus clientes sobre vos</p>
            </div>

            {/* Summary card */}
            {reviews.length > 0 && (
                <Card className="bg-yellow-50/50 border-yellow-200">
                    <CardContent className="pt-6 flex items-center gap-8">
                        <div className="text-center flex-shrink-0">
                            <p className="text-5xl font-bold text-yellow-600">{stats.average.toFixed(1)}</p>
                            <div className="flex justify-center mt-1">
                                <StarRow rating={Math.round(stats.average)} />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{stats.total} reseñas</p>
                        </div>
                        <div className="flex-1 space-y-1">
                            {[5, 4, 3, 2, 1].map(s => {
                                const count = reviews.filter((r: any) => r.rating === s).length;
                                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                                return (
                                    <div key={s} className="flex items-center gap-2 text-sm">
                                        <span className="w-2 text-muted-foreground">{s}</span>
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                        <div className="flex-1 h-2 bg-yellow-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-yellow-400 rounded-full transition-all"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="w-4 text-muted-foreground text-right">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Reviews list */}
            <Card>
                <CardHeader><CardTitle>Todas las reseñas</CardTitle></CardHeader>
                <CardContent>
                    {reviews.length === 0 ? (
                        <div className="text-center py-12">
                            <Star className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                            <p className="text-muted-foreground">Todavía no tenés reseñas.</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Las reseñas aparecen cuando un cliente finaliza un trabajo.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {reviews.map((review: any) => (
                                <div key={review.id} className="py-5 space-y-2">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="w-9 h-9 flex-shrink-0">
                                            <AvatarImage src={review.reviewer?.avatar_url} />
                                            <AvatarFallback>{review.reviewer?.full_name?.[0] ?? "?"}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-sm">
                                                    {review.reviewer?.full_name ?? "Cliente"}
                                                </span>
                                                <Badge variant="outline" className="text-xs font-normal">
                                                    {review.job?.title ?? "Trabajo"}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground ml-auto">
                                                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: es })}
                                                </span>
                                            </div>
                                            <StarRow rating={review.rating} />
                                            {review.comment && (
                                                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                                    {review.comment}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
