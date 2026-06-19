import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import StatusBadge from '../components/shared/StatusBadge';
import { Plus, Search, Edit3, Trash2, X, Phone, MapPin, Calendar, Activity, Link2, Minus } from 'lucide-react';
import type { Patient } from '../types';
import { formatDate, initials, getPatientRecordCount } from '../lib/utils';

const TAG_LABEL: Record<string, string> = { routine: 'Routine', followup: 'Follow-up needed', inactive: 'Inactive' };
const TAG_CLASS: Record<string, string> = { routine: 'tag-routine', followup: 'tag-followup', inactive: 'tag-inactive' };

function PatientModal({ open, patient, onClose, onSave }: {
  open: boolean;
  patient: Patient | null;
  onClose: () => void;
  onSave: (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => void;
}) {
  const [form, setForm] = useState({
    name: patient?.name ?? '',
    age: patient?.age ?? 0,
    gender: patient?.gender ?? 'Male' as Patient['gender'],
    contact: patient?.contact ?? '',
    address: patient?.address ?? '',
    status: patient?.status ?? 'Active' as Patient['status'],
    tags: patient?.tags ?? [] as string[],
  });
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (form.age <= 0) { setError('Age must be positive'); return; }
    if (!form.contact.trim()) { setError('Contact is required'); return; }
    onSave({
      name: form.name.trim(),
      age: form.age,
      gender: form.gender,
      contact: form.contact.trim(),
      address: form.address.trim() || undefined,
      status: form.status,
      tags: form.tags,
    });
  };

  const toggleTag = (tag: string) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  };

  return (
    <div className="modal-overlay-center" onClick={onClose}>
      <div className="modal-panel-narrow" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{patient ? 'Edit Patient' : 'Add Patient'}</h2>
          <button onClick={onClose} className="modal-close"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div style={{ fontSize: 12, color: 'var(--accent-red)', background: 'rgba(242,104,90,0.08)', border: '1px solid rgba(242,104,90,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 16 }}>{error}</div>
          )}
          <div className="form-row-2">
            <div className="form-field">
              <label>Full Name <span className="required">*</span></label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="John Doe" />
            </div>
            <div className="form-field">
              <label>Age <span className="required">*</span></label>
              <input type="number" value={form.age || ''} onChange={(e) => setForm((f) => ({ ...f, age: parseInt(e.target.value) || 0 }))} min={0} max={150} />
            </div>
          </div>
          <div className="form-row-2">
            <div className="form-field">
              <label>Gender</label>
              <select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as Patient['gender'] }))}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Patient['status'] }))}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="form-field">
            <label>Tags</label>
            <div className="flex gap-2 flex-wrap" style={{ marginTop: 4 }}>
              {['routine', 'followup', 'inactive'].map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  className={`filter-chip${form.tags.includes(tag) ? ' active' : ''}`}
                >
                  {TAG_LABEL[tag]}
                </button>
              ))}
            </div>
          </div>
          <div className="form-field">
            <label>Contact <span className="required">*</span></label>
            <input value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} placeholder="+1-555-0000" />
          </div>
          <div className="form-field">
            <label>Address</label>
            <textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} rows={2} placeholder="Optional" />
          </div>
          <div className="flex gap-3 pt-2" style={{ marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              {patient ? 'Save Changes' : 'Add Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PatientDetailPanel({ patient, recordCount, onClose, onEdit, onDelete }: {
  patient: Patient | null;
  recordCount: number;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (!patient) return null;

  return (
    <div className="drawer-backdrop drawer-overlay" onClick={onClose} style={{ justifyContent: 'flex-end' }}>
      <div className="drawer-panel-new" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <h2>Patient Detail</h2>
          <button onClick={onClose} className="modal-close"><X size={18} /></button>
        </div>
        <div className="drawer-body">
          <div className="flex items-center gap-4" style={{ marginBottom: 24 }}>
            <div className="flex items-center justify-center text-lg font-bold text-white" style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-violet))', boxShadow: '0 8px 24px rgba(79,216,196,0.2)' }}>
              {initials(patient.name)}
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{patient.name}</h3>
              <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
                <StatusBadge status={patient.status} />
                {patient.tags && patient.tags.map((t) => (
                  <span key={t} className={`tag-pill ${TAG_CLASS[t] || ''}`}>{TAG_LABEL[t] || t}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
            <div style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Activity size={16} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Age / Gender</p>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{patient.age} / {patient.gender}</p>
              </div>
            </div>
            <div style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Phone size={16} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Contact</p>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{patient.contact}</p>
              </div>
            </div>
          </div>

          {patient.address && (
            <div style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <MapPin size={16} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Address</p>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{patient.address}</p>
              </div>
            </div>
          )}

          <div style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Calendar size={16} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Registered</p>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{formatDate(patient.createdAt)}</p>
            </div>
          </div>

          <div className="surface-card" style={{ marginBottom: 24 }}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-teal)' }}>Linked Lab Records</span>
              <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-teal)' }}>{recordCount}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--hairline)' }}>
            <button onClick={onEdit} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Edit3 size={14} /> Edit
            </button>
            <button onClick={onDelete} className="btn-danger" style={{ flex: 1 }}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PatientsPage() {
  const patients = useStore((s) => s.patients);
  const addPatient = useStore((s) => s.addPatient);
  const updatePatient = useStore((s) => s.updatePatient);
  const deletePatient = useStore((s) => s.deletePatient);
  const records = useStore((s) => s.records);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Patient | null>(null);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'unlinked'>('all');

  const linkedCount = patients.filter((p) => getPatientRecordCount(p.name, records) > 0).length;
  const unlinkedRecords = records.filter((r) => !r.patientName).length;

  const filtered = useMemo(() => {
    let list = patients;
    if (statusFilter === 'active') list = list.filter((p) => p.status === 'Active');
    else if (statusFilter === 'inactive') list = list.filter((p) => p.status === 'Inactive');
    else if (statusFilter === 'unlinked') list = list.filter((p) => getPatientRecordCount(p.name, records) === 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.contact.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [patients, search, statusFilter, records]);

  const handleSave = (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editPatient) updatePatient(editPatient.id, data);
    else addPatient(data);
    setShowModal(false);
    setEditPatient(null);
  };

  const filterChips = [
    { key: 'all' as const, label: 'All' },
    { key: 'active' as const, label: 'Active' },
    { key: 'inactive' as const, label: 'Inactive' },
    { key: 'unlinked' as const, label: 'No Records Yet' },
  ];

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Records &amp; Patients</h1>
          <p className="page-subtitle">Patient directory and sample linkage</p>
        </div>
        <button
          onClick={() => { setEditPatient(null); setShowModal(true); }}
          className="btn-primary"
        >
          <Plus size={16} />
          Add Patient
        </button>
      </header>

      <section className="metrics-row">
        <div className="metric-card accent-blue">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="17" height="17"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5"/><circle cx="17.5" cy="9.5" r="2.3"/><path d="M15.2 14.3c2.5.2 4.3 2 4.3 5"/></svg>
          </div>
          <div className="metric-label">Total Patients</div>
          <div className="metric-value">{patients.length}</div>
          <div className="metric-foot">Registered profiles</div>
        </div>
        <div className="metric-card accent-green">
          <div className="metric-icon" style={{ background: 'rgba(91,216,138,0.12)', color: 'var(--accent-green)' }}>
            <Link2 size={17} />
          </div>
          <div className="metric-label">Linked Records</div>
          <div className="metric-value">{linkedCount}</div>
          <div className="metric-foot">Records tied to a patient profile</div>
        </div>
        <div className="metric-card accent-violet">
          <div className="metric-icon">
            <Minus size={17} />
          </div>
          <div className="metric-label">Unlinked Records</div>
          <div className="metric-value">{unlinkedRecords}</div>
          <div className="metric-foot">Needs a patient assigned</div>
        </div>
      </section>

      <div className="filter-chips">
        {filterChips.map((chip) => (
          <button
            key={chip.key}
            onClick={() => setStatusFilter(chip.key)}
            className={`filter-chip${statusFilter === chip.key ? ' active' : ''}`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="filter-chips" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, contact, or ID..."
            style={{ width: 280, background: 'var(--bg-elevated)', border: '1px solid var(--hairline)', borderRadius: 8, padding: '8px 12px 8px 32px', fontSize: 12, color: 'var(--text-primary)', outline: 'none' }}
          />
        </div>
        <span className="entry-count">{filtered.length} entries</span>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" style={{ gap: 20 }}>
        {filtered.length === 0 ? (
          <div className="empty-center" style={{ gridColumn: '1 / -1' }}>
            <p style={{ fontSize: 15, marginBottom: 4 }}>No patients found</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Add your first patient to get started</p>
          </div>
        ) : (
          filtered.map((patient) => {
            const recordCount = getPatientRecordCount(patient.name, records);
            return (
              <div
                key={patient.id}
                onClick={() => setSelected(patient)}
                className="surface-card"
                style={{ cursor: 'pointer', padding: 20 }}
              >
                <div className="flex items-start justify-between" style={{ marginBottom: 16 }}>
                  <div className="flex items-center" style={{ gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(79,216,196,0.15), rgba(139,147,248,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--accent-teal)', border: '1px solid rgba(79,216,196,0.1)' }}>
                      {initials(patient.name)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{patient.name}</h3>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{patient.gender}, {patient.age} yrs</p>
                    </div>
                  </div>
                  <StatusBadge status={patient.status} />
                </div>

                {patient.tags && patient.tags.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    {patient.tags.map((t) => (
                      <span key={t} className={`tag-pill ${TAG_CLASS[t] || ''}`}>{TAG_LABEL[t] || t}</span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  <div className="flex items-center" style={{ gap: 8, color: 'var(--text-secondary)' }}>
                    <Phone size={11} style={{ flexShrink: 0 }} />
                    <span>{patient.contact}</span>
                  </div>
                  {patient.address && (
                    <div className="flex items-center" style={{ gap: 8, color: 'var(--text-secondary)' }}>
                      <MapPin size={11} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{patient.address}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between" style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--hairline)' }}>
                  <span style={{ fontSize: 10, color: 'var(--accent-teal)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Activity size={10} />
                    {recordCount} record{recordCount !== 1 ? 's' : ''}
                  </span>
                  <div className="flex" style={{ gap: 4, opacity: 0, transition: 'opacity 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditPatient(patient); setShowModal(true); }}
                      title="Edit patient"
                      style={{ padding: 6, borderRadius: 6, color: 'var(--accent-teal)' }}
                    ><Edit3 size={13} /></button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(patient); }}
                      title="Delete patient"
                      style={{ padding: 6, borderRadius: 6, color: 'var(--accent-red)' }}
                    ><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      <PatientDetailPanel
        patient={selected}
        recordCount={selected ? getPatientRecordCount(selected.name, records) : 0}
        onClose={() => setSelected(null)}
        onEdit={() => { setEditPatient(selected); setShowModal(true); setSelected(null); }}
        onDelete={() => { setDeleteTarget(selected); setSelected(null); }}
      />

      <PatientModal
        open={showModal}
        patient={editPatient}
        onClose={() => { setShowModal(false); setEditPatient(null); }}
        onSave={handleSave}
      />

      {deleteTarget && (
        <div className="modal-overlay-center" onClick={() => setDeleteTarget(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(242,104,90,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={18} style={{ color: 'var(--accent-red)' }} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Delete Patient</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={() => { deletePatient(deleteTarget.id); setDeleteTarget(null); }} className="btn-danger" style={{ flex: 1 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
