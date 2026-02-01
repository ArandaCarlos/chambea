import { format, formatDistance as formatDistanceFns, parseISO } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Format a date to readable Spanish format
 */
export function formatDate(date: Date | string, formatStr = "PPP"): string {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: es });
}

/**
 * Format a date to relative time (e.g., "hace 2 horas")
 */
export function formatRelativeTime(date: Date | string): string {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return formatDistanceFns(dateObj, new Date(), {
        addSuffix: true,
        locale: es,
    });
}

/**
 * Format time only (e.g., "14:30")
 */
export function formatTime(date: Date | string): string {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return format(dateObj, "HH:mm", { locale: es });
}

/**
 * Format date and time (e.g., "26 de enero, 14:30")
 */
export function formatDateTime(date: Date | string): string {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return format(dateObj, "PPP 'a las' HH:mm", { locale: es });
}
