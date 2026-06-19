import { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import StatusBadge from '../components/shared/StatusBadge';
import DetailPanel from '../components/shared/DetailPanel';
import RecordModal from '../components/shared/RecordModal';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { MetricSkeleton, TableSkeleton } from '../components/shared/Skeleton';
import { Plus, Search, RefreshCw, AlertTriangle, Copy, Check, Link2, Minus } from 'lucide-react';
import type { LabRecord, ActivityEntry } from '../types';
import { formatDate, formatTime, initials, copyToClipboard, isOverdueHours } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function AnimatedValue({ target }: { target: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const dur = 800;
    const step = Math.max(1, Math.floor(target / 30));
    const interval = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(interval); } else setValue(start);
    }, dur / 30);
    return () => clearInterval(interval);
  }, [target]);
  return <>{value.toLocaleString()}</>;
}

const ALERT_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.01"/></svg>';

function needsAttention(records: LabRecord[]): LabRecord[] {
  return records.filter((r) => r.status === 'Pending' && isOverdueHours(r.createdAt, 0.5));
}

function buildActivityFeed(records: LabRecord[]): ActivityEntry[] {
  const sorted = [...records].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  return sorted.map((r) => {
    let action = 'registered';
    let icon: 'plus' | 'progress' | 'complete' = 'plus';
    let color = 'var(--accent-teal)';
    if (r.status === 'In Progress') { action = 'moved to In Progress'; icon = 'progress'; color = 'var(--accent-violet)'; }
    else if (r.status === 'Complete') { action = 'marked Completed'; icon = 'complete'; color = 'var(--accent-green)'; }
    return {
      actor: r.operator,
      action,
      target: r.sampleName,
      time: `${formatDate(r.createdAt)}, ${formatTime(r.createdAt)}`,
      icon,
      color,
    };
  });
}

function workloadByOperator(records: LabRecord[]): { label: string; count: number }[] {
  const counts: Record<string, number> = {};
  records.filter((r) => r.status === 'Pending' || r.status === 'In Progress').forEach((r) => {
    counts[r.operator] = (counts[r.operator] || 0) + 1;
  });
  return Object.entries(counts).map(([label, count]) => ({ label, count }));
}

function CopyButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="copy-btn"
      onClick={(e) => { e.stopPropagation(); copyToClipboard(id).then(() => { setCopied(true); toast.success('ID copied'); setTimeout(() => setCopied(false), 1200); }).catch(() => {}); }}
      aria-label="Copy full ID"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

export default function Dashboard() {
  const records = useStore((s) => s.records);
  const updateRecord = useStore((s) => s.updateRecord);
  const deleteRecord = useStore((s) => s.deleteRecord);
  const liveConnected = useStore((s) => s.liveConnected);
  const lastSynced = useStore((s) => s.lastSynced);
  const fetchError = useStore((s) => s.fetchError);
  const fetchFromApi = useStore((s) => s.fetchFromApi);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<LabRecord | null>(null);
  const [editRecord, setEditRecord] = useState<LabRecord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LabRecord | null>(null);
  const [syncedAgo, setSyncedAgo] = useState('');

  const navigate = useNavigate();
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    fetchFromApi().finally(() => setLoading(false));
  }, [fetchFromApi]);

  useEffect(() => {
    if (!lastSynced) return;
    const update = () => {
      const sec = Math.floor((Date.now() - lastSynced) / 1000);
      setSyncedAgo(sec < 60 ? `${sec}s ago` : `${Math.floor(sec / 60)}m ago`);
    };
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, [lastSynced]);

  const total = records.length;
  const openCases = records.filter((r) => r.status === 'Pending' || r.status === 'In Progress').length;
  const completed = records.filter((r) => r.status === 'Complete').length;
  const compliancePct = total > 0 ? (completed / total) * 100 : 0;
  const complianceText = total === 0 ? 'No data yet' : `${compliancePct.toFixed(1)}%`;

  const filtered = useMemo(
    () => records.filter(
      (r) => r.sampleName.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase()) || r.operator.toLowerCase().includes(search.toLowerCase())
    ), [records, search]
  );
  const recent = useMemo(() => filtered.slice(0, 10), [filtered]);

  const attentionItems = useMemo(() => needsAttention(records), [records]);
  const activityFeed = useMemo(() => buildActivityFeed(records), [records]);
  const workload = useMemo(() => workloadByOperator(records), [records]);
  const maxWorkload = Math.max(...workload.map((w) => w.count), 1);

  const handleSave = (data: Partial<LabRecord>) => {
    if (editRecord) updateRecord(editRecord.id, data);
    setShowModal(false);
    setEditRecord(null);
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">System Workspace</h1>
          <p className="page-subtitle">LMS Core &mdash; operational overview and compliance tracking</p>
        </div>
        <div className="head-actions">
          <button data-add-record onClick={() => navigate('/records')} className="btn-primary">
            <Plus size={15} />
            New Record
          </button>
          {lastSynced && (
            <div className="live-badge" title={`Last synced: ${syncedAgo}`}>
              <span className="pulse-dot"></span>LIVE
            </div>
          )}
        </div>
      </header>

      {loading ? (
        <section className="metrics-row">
          <MetricSkeleton />
          <MetricSkeleton />
          <MetricSkeleton />
        </section>
      ) : fetchError ? (
        <section className="error-banner" style={{ marginBottom: 24 }}>
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} style={{ color: 'var(--accent-red)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-red)' }}>Unable to connect to server</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Retrying... {fetchError}</p>
            </div>
          </div>
          <button onClick={() => { setLoading(true); fetchFromApi().finally(() => setLoading(false)); }} className="btn-ghost">
            <RefreshCw size={14} />
            Retry
          </button>
        </section>
      ) : (
        <section className="metrics-row">
          <div className="metric-card accent-blue">
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="17" height="17"><path d="M9 2v6.5L4.5 16a2.5 2.5 0 0 0 2.1 3.9h10.8a2.5 2.5 0 0 0 2.1-3.9L15 8.5V2"/><path d="M8.5 14h7"/><path d="M7 2h10"/></svg>
            </div>
            <div className="metric-label">Total Registered Records</div>
            <div className="metric-value"><AnimatedValue target={total} /></div>
            <div className="metric-foot">All sample types, all time</div>
          </div>
          <div className="metric-card accent-emerald">
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="17" height="17"><path d="M3 12h4l2-6 4 12 2-6h6"/></svg>
            </div>
            <div className="metric-label">Open Cases</div>
            <div className="metric-value"><AnimatedValue target={openCases} /></div>
            <div className="metric-foot">Pending or in progress</div>
          </div>
          <div className="metric-card accent-violet">
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="17" height="17"><path d="M12 3 4 6.5v5C4 16.5 7.5 20 12 21c4.5-1 8-4.5 8-9.5v-5z"/><path d="M9 12l2 2 4-4"/></svg>
            </div>
            <div className="metric-label">Compliance Rate</div>
            <div className={`metric-value ${total === 0 ? 'empty' : ''}`}>{complianceText}</div>
            <div className="metric-foot">
              {total === 0 ? 'Register a record to begin tracking' : `${completed} of ${total} records completed`}
            </div>
          </div>
        </section>
      )}

      {!loading && !fetchError && (
        <section className="dash-grid-2">
          <div className="panel-card">
            <h3>Needs Attention</h3>
            <p className="panel-sub">Pending samples older than 24 hours</p>
            <div>
              {attentionItems.length === 0 ? (
                <div className="empty-state">
                  <Check size={28} style={{ color: 'var(--accent-green)' }} />
                  <p>All caught up &mdash; nothing overdue</p>
                </div>
              ) : (
                attentionItems.map((r) => (
                  <div key={r.id} className="attention-row">
                    <div className="attention-icon" dangerouslySetInnerHTML={{ __html: ALERT_ICON }} />
                    <div className="attention-text">
                      <strong>{r.sampleName}</strong>
                      <p>{r.operator} &middot; pending since {formatDate(r.createdAt)}</p>
                    </div>
                    <button className="btn-ghost">Escalate</button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="panel-card">
            <h3>Workload by Operator</h3>
            <p className="panel-sub">Open cases currently assigned</p>
            <div>
              {workload.length === 0 ? (
                <div className="empty-state">
                  <Check size={28} style={{ color: 'var(--accent-green)' }} />
                  <p>No open cases</p>
                </div>
              ) : (
                workload.map((w) => (
                  <div key={w.label} className="bar-row">
                    <span className="bar-label">{w.label}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ background: 'var(--accent-violet)', width: `${(w.count / maxWorkload) * 100}%` }} />
                    </div>
                    <span className="bar-count">{w.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {!loading && !fetchError && activityFeed.length > 0 && (
        <div className="panel-card">
          <h3>Recent Activity</h3>
          <p className="panel-sub">Latest changes across all records</p>
          <ul className="activity-feed">
            {activityFeed.map((a, i) => (
              <li key={i} className="activity-item">
                <div className="activity-line" />
                <div className="activity-icon" style={{ color: a.color }}>
                  {a.icon === 'plus' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M12 5v14M5 12h14"/></svg>
                  ) : a.icon === 'progress' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M21 12a9 9 0 1 1-9-9"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M20 6 9 17l-5-5"/></svg>
                  )}
                </div>
                <div>
                  <div className="activity-text"><strong>{a.actor}</strong> {a.action} <strong>{a.target}</strong></div>
                  <div className="activity-time">{a.time}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="table-card">
        <div className="table-header">
          <h2 className="table-heading">Recent Operational Records</h2>
          <div className="table-controls">
            <div className="search-wrap">
              <Search size={15} />
              <input data-search-input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search records..." />
            </div>
            <span className="entry-count">{filtered.length} entries</span>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID Code</th>
                <th>Sample Name</th>
                <th>Patient</th>
                <th>Operator</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={4} cols={6} />
              ) : recent.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    <p style={{ fontSize: 15, marginBottom: 4 }}>No records found</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Add your first record to get started</p>
                  </td>
                </tr>
              ) : (
                recent.map((r) => (
                  <tr key={r.id} onClick={() => setSelected(r)} className="cursor-pointer">
                    <td>
                      <div className="id-cell">
                        <span className="cell-mono" title={r.id}>{r.id.slice(0, 8)}&hellip;</span>
                        <CopyButton id={r.id} />
                      </div>
                    </td>
                    <td><span className="entity-name">{r.sampleName}</span></td>
                    <td>
                      {r.patientName ? (
                        <span className="patient-linked">
                          <Link2 size={13} />
                          {r.patientName}
                        </span>
                      ) : (
                        <span className="patient-unlinked">
                          <Minus size={13} />
                          Not linked
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="operator-cell">
                        <span className="op-avatar">{initials(r.operator)}</span>
                        {r.operator}
                      </div>
                    </td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="date-cell">{formatDate(r.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <DetailPanel
        record={selected}
        onClose={() => setSelected(null)}
        onEdit={() => { setEditRecord(selected); setShowModal(true); setSelected(null); }}
        onDelete={() => { setDeleteTarget(selected); setSelected(null); }}
      />
      <RecordModal open={showModal} record={editRecord} onClose={() => { setShowModal(false); setEditRecord(null); }} onSave={handleSave} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Record"
        message={`Are you sure you want to delete record ${deleteTarget?.id}? This action cannot be undone.`}
        onConfirm={() => { if (deleteTarget) deleteRecord(deleteTarget.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
