import { SearchWindow } from '../types';

export const TimeFormat = {
  format(date: Date): string {
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
  },

  parse(isoString: string): Date {
    return new Date(isoString);
  },

  parseOrNull(isoString: string | null | undefined): Date | null {
    if (!isoString) return null;
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? null : d;
  },

  human(date: Date, timeZone: string = 'UTC'): string {
    try {
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: timeZone === 'Local' ? undefined : timeZone,
      };
      return new Intl.DateTimeFormat('en-GB', options).format(date);
    } catch {
      return date.toUTCString();
    }
  },

  elapsed(minutes: number): string {
    const totalMinutes = Math.max(0, Math.round(minutes));
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const mins = totalMinutes % 60;

    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  },
};

export const SearchWindowCalculator = {
  elapsedMinutes(lastSeen: Date, now: Date): number {
    const diffMs = now.getTime() - lastSeen.getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  },

  isInFuture(lastSeen: Date, now: Date): boolean {
    return lastSeen.getTime() > now.getTime() + 60000;
  },

  compute(lastSeen: Date, now: Date): SearchWindow {
    return {
      last_seen_utc: TimeFormat.format(lastSeen),
      now_utc: TimeFormat.format(now),
      elapsed_minutes: this.elapsedMinutes(lastSeen, now),
    };
  },
};
