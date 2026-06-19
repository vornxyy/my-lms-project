import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2, Download, Edit3, Check, X } from 'lucide-react';
import { initials } from '../lib/utils';

export default function SettingsPage() {
  const operators = useStore((s) => s.operators);
  const addOperator = useStore((s) => s.addOperator);
  const removeOperator = useStore((s) => s.removeOperator);
  const sampleTypes = useStore((s) => s.sampleTypes);
  const addSampleType = useStore((s) => s.addSampleType);
  const removeSampleType = useStore((s) => s.removeSampleType);
  const records = useStore((s) => s.records);
  const profileName = useStore((s) => s.profileName);
  const profileEmail = useStore((s) => s.profileEmail);
  const updateProfile = useStore((s) => s.updateProfile);

  const [opName, setOpName] = useState('');
  const [opEmail, setOpEmail] = useState('');
  const [stName, setStName] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState(profileName);
  const [editEmail, setEditEmail] = useState(profileEmail);

  const handleAddOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opName.trim()) return;
    addOperator({ name: opName.trim(), email: opEmail.trim() || `${opName.trim().toLowerCase().replace(/\s+/g, '.')}@lms.local`, active: true });
    setOpName('');
    setOpEmail('');
  };

  const handleAddSampleType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stName.trim()) return;
    addSampleType(stName.trim());
    setStName('');
  };

  const handleSaveProfile = () => {
    updateProfile(editName.trim() || profileName, editEmail.trim() || profileEmail);
    setEditingProfile(false);
  };

  const exportCSV = () => {
    const headers = ['ID Code', 'Sample Name', 'Operator', 'Status', 'Patient Name', 'Notes', 'Created At'];
    const rows = records.map((r) =>
      [r.id, r.sampleName, r.operator, r.status, r.patientName ?? '', r.notes ?? '', r.createdAt]
        .map((v) => `"${v.replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lms-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const rows = records.map((r) =>
      `<tr><td>${r.id}</td><td>${r.sampleName}</td><td>${r.operator}</td><td>${r.status}</td><td>${new Date(r.createdAt).toLocaleDateString()}</td></tr>`
    ).join('');
    win.document.write(`
      <html><head><title>LMS Export</title>
      <style>body{font-family:sans-serif;padding:2rem}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f5f5f5}</style>
      </head><body>
      <h1>LMS Records Export</h1>
      <p>${new Date().toLocaleDateString()}</p>
      <table><thead><tr><th>ID</th><th>Sample</th><th>Operator</th><th>Status</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>
      </body></html>`);
    win.document.close();
    win.print();
  };

  const hasRecords = records.length > 0;

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure operators, sample types, and manage data</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 24 }}>
        <div className="surface-card">
          <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            Manage Operators
            <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 400, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 12 }}>{operators.length} operators</span>
          </h3>
          <form onSubmit={handleAddOperator} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div className="form-field" style={{ marginBottom: 0, flex: 1 }}>
              <input value={opName} onChange={(e) => setOpName(e.target.value)} placeholder="Name" />
            </div>
            <div className="form-field" style={{ marginBottom: 0, flex: 1 }}>
              <input value={opEmail} onChange={(e) => setOpEmail(e.target.value)} placeholder="Email" />
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '8px 12px' }}><Plus size={14} />Add</button>
          </form>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 224, overflowY: 'auto' }}>
            {operators.map((op) => (
              <div key={op.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--hairline)' }}>
                <div className="flex items-center" style={{ gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(79,216,196,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--accent-teal)' }}>
                    {op.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{op.name}</p>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{op.email}</p>
                  </div>
                </div>
                <button onClick={() => removeOperator(op.id)} style={{ color: 'var(--text-muted)' }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card">
          <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Sample Types</h3>
          <form onSubmit={handleAddSampleType} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div className="form-field" style={{ marginBottom: 0, flex: 1 }}>
              <input value={stName} onChange={(e) => setStName(e.target.value)} placeholder="Sample type name" />
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '8px 12px' }}><Plus size={14} />Add</button>
          </form>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 224, overflowY: 'auto' }}>
            {sampleTypes.map((st) => (
              <div key={st.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--hairline)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{st.name}</span>
                <button onClick={() => removeSampleType(st.id)} style={{ color: 'var(--text-muted)' }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card">
          <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Export Data</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={exportCSV}
              disabled={!hasRecords}
              className="btn-secondary"
              style={{ flex: 1, opacity: hasRecords ? 1 : 0.4, cursor: hasRecords ? 'pointer' : 'not-allowed' }}
              title={!hasRecords ? 'Add records first' : 'Export as CSV'}
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={exportPDF}
              disabled={!hasRecords}
              className="btn-secondary"
              style={{ flex: 1, opacity: hasRecords ? 1 : 0.4, cursor: hasRecords ? 'pointer' : 'not-allowed' }}
              title={!hasRecords ? 'Add records first' : 'Export as PDF'}
            >
              <Download size={16} />
              Export PDF
            </button>
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 12 }}>{records.length} records available for export</p>
        </div>

        <div className="surface-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: 1 }}>User Profile</h3>
            {!editingProfile && (
              <button onClick={() => { setEditName(profileName); setEditEmail(profileEmail); setEditingProfile(true); }} className="btn-ghost" style={{ fontSize: 11 }}>
                <Edit3 size={12} /> Edit
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-violet))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'white', boxShadow: '0 8px 24px rgba(79,216,196,0.2)' }}>
              {initials(profileName || 'VX')}
            </div>
            <div>
              {editingProfile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" style={{ width: 160 }} />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email" style={{ width: 160 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={handleSaveProfile} className="btn-primary" style={{ padding: '4px 10px', fontSize: 10 }}><Check size={10} />Save</button>
                    <button onClick={() => setEditingProfile(false)} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 10 }}><X size={10} />Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{profileName}</h4>
                  <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 10px', borderRadius: 12, background: 'rgba(91,216,138,0.1)', border: '1px solid rgba(91,216,138,0.2)', fontSize: 10, fontWeight: 700, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: 1 }}>Root Admin</span>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--hairline)' }}>
              <span>Role</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Administrator</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--hairline)' }}>
              <span>Records Managed</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{records.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--hairline)' }}>
              <span>Theme</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Dark Mode</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
