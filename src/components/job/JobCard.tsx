"use client";

import Link from "next/link";
import { formatDistance } from "@/lib/utils/distance";
import { MapPin, Calendar, Clock, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { JOB_STATUSES, URGENCY_LEVELS, JobCategoryId, JOB_CATEGORIES } from "@/lib/constants/job-categories";
import { formatDate } from "@/lib/utils/dates";

interface JobCardProps {
    job: {
        id: string;
        title: string;
        category_id: string;
        description: string;
        client: {
            full_name: string;
            avatar_url?: string;
        };
        location: {
            address: string;
            city: string;
            distance?: number;
        };
        budget?: number;
        urgency: keyof typeof URGENCY_LEVELS;
        status: keyof typeof JOB_STATUSES;
        preferred_date?: string; // ISO string
        created_at: string;
    };
    showActions?: boolean;
}

export function JobCard({ job, showActions = true }: JobCardProps) {
    const urgency = URGENCY_LEVELS[job.urgency];
    const category = JOB_CATEGORIES.find(c => c.id === job.category_id);

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-2 space-y-2">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex gap-2">
                        <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted">
                            {category?.icon} {category?.name || job.category_id}
                        </Badge>
                        <Badge variant="outline" className={`
              ${job.urgency === 'emergency' ? 'border-red-500 text-red-500 bg-red-50' : ''}
              ${job.urgency === 'high' ? 'border-orange-500 text-orange-500 bg-orange-50' : ''}
            `}>
                            {urgency.label}
                        </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(job.created_at).toLocaleDateString()}
                    </span>
                </div>

                <h3 className="font-semibold text-lg leading-tight line-clamp-2">
                    {job.title}
                </h3>
            </CardHeader>

            <CardContent className="p-4 pt-1 space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={job.client.avatar_url} />
                        <AvatarFallback>{job.client.full_name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">{job.client.full_name}</span>
                </div>

                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="line-clamp-1">
                            {job.location.city}
                            {job.location.distance !== undefined && ` • a ${formatDistance(job.location.distance)}`}
                        </span>
                    </div>

                    {job.preferred_date && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span>{formatDate(job.preferred_date)}</span>
                        </div>
                    )}

                    {job.budget && (
                        <div className="flex items-center gap-2 font-medium text-green-600">
                            <DollarSign className="h-4 w-4 shrink-0" />
                            <span>Hasta ${job.budget.toLocaleString('es-AR')}</span>
                        </div>
                    )}
                </div>
            </CardContent>

            {showActions && (
                <CardFooter className="p-4 pt-0 bg-muted/20 mt-2">
                    <Button asChild className="w-full mt-3">
                        <Link href={`/client/jobs/${job.id}`}>Ver detalles</Link>
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
