const STATUS_LABEL: Record<string, string> = {
  Complete: 'Completed',
  Pending: 'Pending',
  'In Progress': 'In Progress',
  Failed: 'Failed',
};

const ICONS: Record<string, string> = {
  Complete: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>',
  Pending: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  'In Progress': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9"/></svg>',
  Failed: '<svg viewBox="0 24px" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
};

const CLASSES: Record<string, string> = {
  Complete: 'status-complete',
  Pending: 'status-pending',
  'In Progress': 'status-progress',
  Failed: 'status-pending',
};

export default function StatusBadge({ status }: { status: string }) {
  const cls = CLASSES[status] ?? 'status-pending';
  return (
    <span className={`status-pill ${cls}`} dangerouslySetInnerHTML={{ __html: `${ICONS[status] ?? ''}${STATUS_LABEL[status] ?? status}` }} />
  );
}
