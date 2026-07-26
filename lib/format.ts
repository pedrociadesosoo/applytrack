import { differenceInCalendarDays, format, formatDistanceToNow } from "date-fns";

export function daysSince(dateString: string): number {
  return differenceInCalendarDays(new Date(), new Date(dateString));
}

export function isStale(dateString: string, thresholdDays = 10): boolean {
  return daysSince(dateString) >= thresholdDays;
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  return format(new Date(dateString), "MMM d, yyyy");
}

export function relativeTime(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}
