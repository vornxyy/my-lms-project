let counter = Date.now();

export function generateId(): string {
  counter += 1;
  return 'LMS' + counter.toString(36).toUpperCase().slice(-7).padStart(7, '0');
}

export function statusDotClass(status: string): string {
  const map: Record<string, string> = {
    Complete: 'bg-emerald-500',
    Pending: 'bg-amber-500',
    'In Progress': 'bg-blue-500',
    Failed: 'bg-rose-500',
  };
  return map[status] ?? 'bg-slate-500';
}

export function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    Complete: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    'In Progress': 'bg-blue-500/10 text-blue-400 border-blue-500/25',
    Failed: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
  };
  return map[status] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/25';
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function complianceColor(pct: number): string {
  if (pct >= 80) return '#10b981';
  if (pct >= 50) return '#f59e0b';
  return '#ef4444';
}

export function complianceTextColor(pct: number): string {
  if (pct >= 80) return 'text-emerald-400';
  if (pct >= 50) return 'text-amber-400';
  return 'text-rose-400';
}

export function fetchWithTimeout(url: string, ms = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

export function initials(name: string): string {
  return name.replace('Dr. ', '').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard?.writeText(text) ?? Promise.resolve();
}

export function isOverdueHours(dateStr: string, hours: number): boolean {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  return (now - date) > hours * 60 * 60 * 1000;
}

export function getPatientRecordCount(patientName: string, records: { patientName?: string }[]): number {
  return records.filter((r) => r.patientName === patientName).length;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}
