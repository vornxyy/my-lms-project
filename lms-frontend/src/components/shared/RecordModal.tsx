import { useState } from 'react';
import type { LabRecord, RecordStatus } from '../../types';
import { useStore } from '../../store/useStore';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  record: LabRecord | null;
  onClose: () => void;
  onSave: (data: Partial<LabRecord>) => void;
}

const statuses: RecordStatus[] = ['Pending', 'In Progress', 'Complete', 'Failed'];

function initForm(record: LabRecord | null) {
  return {
    id: record?.id ?? '',
    sampleName: record?.sampleName ?? '',
    operator: record?.operator ?? '',
    status: record?.status ?? 'Pending' as RecordStatus,
    patientName: record?.patientName ?? '',
    notes: record?.notes ?? '',
    createdAt: record?.createdAt ? record.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
  };
}

export default function RecordModal({ open, record, onClose, onSave }: Props) {
  const operators = useStore((s) => s.operators);
  const sampleTypes = useStore((s) => s.sampleTypes);
  const [form, setForm] = useState(() => initForm(record));
  const [error, setError] = useState('');

  if (!open) return null;

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sampleName.trim()) { setError('Sample Name is required'); return; }
    if (!form.operator.trim()) { setError('Operator is required'); return; }
    onSave({
      sampleName: form.sampleName.trim(),
      operator: form.operator.trim(),
      status: form.status,
      patientName: form.patientName.trim() || undefined,
      notes: form.notes.trim() || undefined,
      createdAt: new Date(form.createdAt).toISOString(),
    });
  };

  const isEdit = !!record;

  return (
    <div className="modal-overlay-center" onClick={onClose}>
      <div className="modal-panel-narrow" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{isEdit ? 'Edit Record' : 'Add Record'}</h2>
          <button onClick={onClose} className="modal-close"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div style={{ fontSize: 12, color: 'var(--accent-red)', background: 'rgba(242,104,90,0.08)', border: '1px solid rgba(242,104,90,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 16 }}>{error}</div>
          )}

          <div className="form-field">
            <label>ID Code</label>
            <input value={isEdit ? form.id : 'Will be auto-generated'} disabled />
          </div>

          <div className="form-field">
            <label>Sample Name <span className="required">*</span></label>
            <input
              value={form.sampleName}
              onChange={(e) => update('sampleName', e.target.value)}
              list="sample-types-list"
              placeholder="Type or select..."
            />
            <datalist id="sample-types-list">
              {sampleTypes.map((st) => (
                <option key={st.id} value={st.name} />
              ))}
            </datalist>
          </div>

          <div className="form-row-2">
            <div className="form-field">
              <label>Operator <span className="required">*</span></label>
              <select value={form.operator} onChange={(e) => update('operator', e.target.value)}>
                <option value="">Select operator</option>
                {operators.filter((o) => o.active).map((op) => (
                  <option key={op.id} value={op.name}>{op.name}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => update('status', e.target.value)}>
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-field">
              <label>Patient Name</label>
              <input value={form.patientName} onChange={(e) => update('patientName', e.target.value)} placeholder="Optional" />
            </div>
            <div className="form-field">
              <label>Date</label>
              <input type="date" value={form.createdAt} onChange={(e) => update('createdAt', e.target.value)} />
            </div>
          </div>

          <div className="form-field">
            <label>Notes</label>
            <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={3} placeholder="Optional notes" />
          </div>

          <div className="flex gap-3" style={{ marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              {isEdit ? 'Save Changes' : 'Add Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
