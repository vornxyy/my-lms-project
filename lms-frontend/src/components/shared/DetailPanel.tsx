import type { LabRecord } from '../../types';
import StatusBadge from './StatusBadge';
import { X, Trash2, Edit3 } from 'lucide-react';
import { formatDate } from '../../lib/utils';

interface Props {
  record: LabRecord | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function DetailPanel({ record, onClose, onEdit, onDelete }: Props) {
  if (!record) return null;

  return (
    <div className="drawer-overlay drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel-new" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <h2>Record Detail</h2>
          <button onClick={onClose} className="modal-close"><X size={18} /></button>
        </div>

        <div className="drawer-body">
          <div className="flex items-center justify-between mb-6">
            <div className="drawer-field" style={{ marginBottom: 0 }}>
              <div className="df-label">ID Code</div>
              <div className="df-value" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--accent-teal)' }}>{record.id}</div>
            </div>
            <StatusBadge status={record.status} />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="drawer-field" style={{ marginBottom: 0 }}>
              <div className="df-label">Sample Name</div>
              <div className="df-value">{record.sampleName}</div>
            </div>
            <div className="drawer-field" style={{ marginBottom: 0 }}>
              <div className="df-label">Operator</div>
              <div className="df-value">{record.operator}</div>
            </div>
            <div className="drawer-field" style={{ marginBottom: 0 }}>
              <div className="df-label">Created</div>
              <div className="df-value">{formatDate(record.createdAt)}</div>
            </div>
            <div className="drawer-field" style={{ marginBottom: 0 }}>
              <div className="df-label">Updated</div>
              <div className="df-value">{formatDate(record.updatedAt)}</div>
            </div>
          </div>

          {record.patientName && (
            <div className="drawer-field">
              <div className="df-label">Patient Name</div>
              <div className="df-value">{record.patientName}</div>
            </div>
          )}

          {record.notes && (
            <div className="drawer-field">
              <div className="df-label">Notes</div>
              <div className="df-value" style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>{record.notes}</div>
            </div>
          )}

          <div className="flex gap-3 pt-4 mt-6 border-t" style={{ borderColor: 'var(--hairline)' }}>
            <button onClick={onEdit} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Edit3 size={14} />
              Edit
            </button>
            <button onClick={onDelete} className="btn-danger" style={{ flex: 1 }}>
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
