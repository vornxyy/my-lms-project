import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import StatusBadge from '../components/shared/StatusBadge';
import RecordModal from '../components/shared/RecordModal';
import DetailPanel from '../components/shared/DetailPanel';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import Pagination from '../components/shared/Pagination';
import { Plus, Search, CheckSquare, Edit3, Trash2 } from 'lucide-react';
import type { LabRecord, RecordStatus } from '../types';
import { formatDate } from '../lib/utils';

const statusFilters: (RecordStatus | 'All')[] = ['All', 'Pending', 'In Progress', 'Complete', 'Failed'];

const actionBtn =
  'p-1.5 rounded-md transition-colors';

export default function RecordsPage() {
  const records = useStore((s) => s.records);
  const addRecord = useStore((s) => s.addRecord);
  const updateRecord = useStore((s) => s.updateRecord);
  const deleteRecord = useStore((s) => s.deleteRecord);
  const bulkUpdateStatus = useStore((s) => s.bulkUpdateStatus);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RecordStatus | 'All'>('All');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState<LabRecord | null>(null);
  const [selected, setSelected] = useState<LabRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LabRecord | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<RecordStatus>('Pending');

  const perPage = 10;

  const filtered = useMemo(() => {
    let list = records.filter((r) => r.id && typeof r.id === 'string');
    if (statusFilter !== 'All') list = list.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) => r.sampleName.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.operator.toLowerCase().includes(q)
      );
    }
    return list;
  }, [records, search, statusFilter]);

  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / perPage);
  if (page > totalPages && totalPages > 0) setPage(totalPages);

  const handleSave = (data: Partial<LabRecord>) => {
    if (editRecord) updateRecord(editRecord.id, data);
    else addRecord(data as Omit<LabRecord, 'id' | 'createdAt' | 'updatedAt'>);
    setShowModal(false);
    setEditRecord(null);
  };

  const toggleBulkSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleBulkUpdate = () => {
    if (selectedIds.length === 0) return;
    bulkUpdateStatus(selectedIds, bulkStatus);
    setSelectedIds([]);
    setBulkMode(false);
  };

  const colSpan = bulkMode ? 8 : 7;

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Records</h1>
          <p className="page-subtitle">Manage lab records, samples, and patient data</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setBulkMode(!bulkMode)}
            className={`btn-ghost ${bulkMode ? 'active' : ''}`}
          >
            <CheckSquare size={14} />
            Bulk
          </button>
          <button data-add-record onClick={() => { setEditRecord(null); setShowModal(true); }} className="btn-primary">
            <Plus size={16} />
            Add Record
          </button>
        </div>
      </header>

      <div className="filter-chips" style={{ marginBottom: 16 }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input data-search-input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by ID, name, or operator..." style={{ width: 280, background: 'var(--bg-elevated)', border: '1px solid var(--hairline)', borderRadius: 8, padding: '8px 12px 8px 32px', fontSize: 12, color: 'var(--text-primary)', outline: 'none' }} />
        </div>
        <div className="flex items-center gap-1.5">
          {statusFilters.map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`filter-chip${statusFilter === s ? ' active' : ''}`}
            >
              {s === 'All' ? s : s}
            </button>
          ))}
        </div>
        {bulkMode && selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as RecordStatus)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--hairline)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'var(--text-primary)', outline: 'none' }}>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Complete">Complete</option>
              <option value="Failed">Failed</option>
            </select>
            <button onClick={handleBulkUpdate} className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}>Update {selectedIds.length}</button>
          </div>
        )}
      </div>

      <section className="table-section">
        <header className="table-header">
          <h2 className="table-heading">All Records</h2>
          <span className="table-count">{filtered.length} entries</span>
        </header>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {bulkMode && <th style={{ width: 40 }}><span className="sr-only">Select</span></th>}
                <th>ID Code</th>
                <th>Sample Name</th>
                <th>Patient Name</th>
                <th>Operator</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ width: 80, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="table-empty">
                    <p style={{ fontSize: 15, marginBottom: 4 }}>No records found</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Add your first record to get started</p>
                  </td>
                </tr>
              ) : (
                paged.map((r, i) => (
                  <tr key={r.id || `corrupt-${i}`} className="tr-hover">
                    {bulkMode && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => r.id && toggleBulkSelect(r.id)} disabled={!r.id} />
                      </td>
                    )}
                    <td className="cell-mono">{r.id || <span style={{ color: 'var(--accent-red)', fontStyle: 'italic' }}>missing</span>}</td>
                    <td><span className="entity-name">{r.sampleName}</span></td>
                    <td><span style={{ color: 'var(--text-secondary)' }}>{r.patientName || '\u2014'}</span></td>
                    <td><span className="entity-name">{r.operator}</span></td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="cell-mono">{formatDate(r.createdAt)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditRecord(r); setShowModal(true); }}
                          className={`${actionBtn} ${!r.id ? 'disabled' : ''}`}
                          title={r.id ? 'Edit record' : 'Cannot edit: missing id'}
                          disabled={!r.id}
                          style={{ color: 'var(--accent-teal)' }}
                        >
                          <Edit3 size={14} />
                        </button>
                        {r.id ? (
                          <button
                            onClick={() => setDeleteTarget(r)}
                            className={actionBtn}
                            title="Delete record"
                            style={{ color: 'var(--accent-red)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : (
                          <button
                            disabled
                            className={actionBtn}
                            title="Cannot delete: missing id"
                            style={{ color: 'var(--accent-red)', opacity: 0.3, cursor: 'not-allowed' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination current={page} total={filtered.length} perPage={perPage} onChange={setPage} />
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
