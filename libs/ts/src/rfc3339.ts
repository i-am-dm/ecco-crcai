export function nowRfc3339(): string {
  return new Date().toISOString();
}

export function toRfc3339(date: Date): string {
  return date.toISOString();
}

export function parseRfc3339(s: string): Date {
  const d = new Date(s);
  if (isNaN(d.getTime())) throw new Error(`Invalid RFC3339 date: ${s}`);
  return d;
}

