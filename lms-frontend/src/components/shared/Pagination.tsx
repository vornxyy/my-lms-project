import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  current: number;
  total: number;
  perPage: number;
  onChange: (page: number) => void;
}

export default function Pagination({ current, total, perPage, onChange }: Props) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between" style={{ padding: '16px 24px', borderTop: '1px solid var(--hairline)' }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{total} total records</span>
      <div className="flex items-center" style={{ gap: 6 }}>
        <button
          onClick={() => onChange(current - 1)}
          disabled={current <= 1}
          style={{ padding: 6, borderRadius: 6, color: 'var(--text-secondary)', opacity: current <= 1 ? 0.3 : 1, cursor: current <= 1 ? 'not-allowed' : 'pointer' }}
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            style={{
              width: 32, height: 32, borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: p === current ? 'var(--accent-teal)' : 'transparent',
              color: p === current ? '#fff' : 'var(--text-secondary)',
              border: p === current ? 'none' : '1px solid var(--hairline)',
              cursor: 'pointer',
            }}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onChange(current + 1)}
          disabled={current >= pages}
          style={{ padding: 6, borderRadius: 6, color: 'var(--text-secondary)', opacity: current >= pages ? 0.3 : 1, cursor: current >= pages ? 'not-allowed' : 'pointer' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
