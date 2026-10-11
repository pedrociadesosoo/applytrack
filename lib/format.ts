import { differenceInCalendarDays, format, formatDistanceToNow } from "date-fns";

// "2027-06-01" is a calendar date, not a moment in time. new Date() would
// read it as UTC midnight, which shows as the previous day in US time
// zones, so parse plain dates as local dates.
function toDate(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
}

export function daysSince(dateString: string): number {
  return differenceInCalendarDays(new Date(), toDate(dateString));
}

export function isStale(dateString: string, thresholdDays = 10): boolean {
  return daysSince(dateString) >= thresholdDays;
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  return format(toDate(dateString), "MMM d, yyyy");
}

export function relativeTime(dateString: string): string {
  return formatDistanceToNow(toDate(dateString), { addSuffix: true });
}
