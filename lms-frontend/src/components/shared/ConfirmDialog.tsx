import { AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }: Props) {
  if (!open) return null;

  return (
    <div className="modal-overlay-center" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(242,104,90,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={18} style={{ color: 'var(--accent-red)' }} />
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
          <button onClick={onConfirm} className="btn-danger" style={{ flex: 1 }}>Delete</button>
        </div>
      </div>
    </div>
  );
}
