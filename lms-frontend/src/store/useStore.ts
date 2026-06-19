import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import type { LabRecord, Operator, SampleType, Patient } from '../types';
import { fetchWithTimeout } from '../lib/utils';

const API_BASE = 'http://localhost:5000';

interface AppState {
  records: LabRecord[];
  patients: Patient[];
  operators: Operator[];
  sampleTypes: SampleType[];
  liveConnected: boolean;
  lastSynced: number | null;
  fetchError: string | null;
  profileName: string;
  profileEmail: string;

  setRecords: (records: LabRecord[]) => void;
  addRecord: (record: Omit<LabRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRecord: (id: string, data: Partial<LabRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  bulkUpdateStatus: (ids: string[], status: LabRecord['status']) => void;

  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePatient: (id: string, data: Partial<Patient>) => void;
  deletePatient: (id: string) => void;

  updateProfile: (name: string, email: string) => void;

  addOperator: (op: Omit<Operator, 'id'>) => void;
  removeOperator: (id: string) => void;
  addSampleType: (name: string) => void;
  removeSampleType: (id: string) => void;

  setLiveConnected: (v: boolean) => void;
  setFetchError: (v: string | null) => void;

  fetchFromApi: () => Promise<void>;
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error || `HTTP ${res.status}`);
  }
  return res;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      records: [],
      patients: [
        { id: 'pat-1', name: 'Alice Johnson', age: 34, gender: 'Female', contact: '+1-555-0101', address: '123 Main St, Apt 4B', status: 'Active', createdAt: '2025-11-15T10:00:00Z', updatedAt: '2025-11-15T10:00:00Z' },
        { id: 'pat-2', name: 'Bob Martinez', age: 47, gender: 'Male', contact: '+1-555-0102', address: '456 Oak Ave', status: 'Active', createdAt: '2025-12-03T14:30:00Z', updatedAt: '2025-12-03T14:30:00Z' },
        { id: 'pat-3', name: 'Carol Wu', age: 28, gender: 'Female', contact: '+1-555-0103', status: 'Active', createdAt: '2026-01-20T09:15:00Z', updatedAt: '2026-01-20T09:15:00Z' },
        { id: 'pat-4', name: 'David Kim', age: 52, gender: 'Male', contact: '+1-555-0104', address: '789 Pine Rd', status: 'Inactive', createdAt: '2026-02-10T11:00:00Z', updatedAt: '2026-03-01T16:00:00Z' },
        { id: 'pat-5', name: 'Elena Garcia', age: 39, gender: 'Female', contact: '+1-555-0105', address: '321 Elm St', status: 'Active', createdAt: '2026-03-05T08:45:00Z', updatedAt: '2026-03-05T08:45:00Z' },
      ],
      operators: [
        { id: 'op-1', name: 'Dr. Sarah Chen', email: 'sarah@lms.local', active: true },
        { id: 'op-2', name: 'Mark Rivera', email: 'mark@lms.local', active: true },
        { id: 'op-3', name: 'Lisa Park', email: 'lisa@lms.local', active: true },
      ],
      sampleTypes: [
        { id: 'st-1', name: 'Blood Panel' },
        { id: 'st-2', name: 'Urine Culture' },
        { id: 'st-3', name: 'Tissue Biopsy' },
      ],
      liveConnected: false,
      lastSynced: null,
      fetchError: null,
      profileName: 'vornxy',
      profileEmail: 'vornxy@fedora',

      setRecords: (records) => {
        const clean = records.filter((r) => r.id && typeof r.id === 'string');
        if (clean.length !== records.length) {
          console.error(`[LMS] Filtered ${records.length - clean.length} corrupt records (missing or invalid id)`);
        }
        set({ records: clean });
      },

      addRecord: async (data) => {
        try {
          const res = await apiFetch('/records', {
            method: 'POST',
            body: JSON.stringify({
              sampleName: data.sampleName,
              status: data.status,
              operator: data.operator,
            }),
          });
          const saved = await res.json();
          set((s) => ({
            records: [{ ...saved, updatedAt: saved.createdAt }, ...s.records],
          }));
          toast.success('Record created');
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to create record');
        }
      },

      updateRecord: async (id, data) => {
        try {
          await apiFetch(`/records/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
          });
          set((s) => ({
            records: s.records.map((r) =>
              r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
            ),
          }));
          toast.success('Record updated');
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to update record');
        }
      },

      deleteRecord: async (id) => {
        if (!id || typeof id !== 'string') {
          console.error('[LMS] deleteRecord called with invalid id:', id);
          toast.error('Cannot delete: record has no valid id');
          return;
        }
        try {
          await apiFetch(`/records/${id}`, { method: 'DELETE' });
          set((s) => ({ records: s.records.filter((r) => r.id !== id) }));
          toast('Record deleted', { icon: '\u2139\uFE0F' });
        } catch (err) {
          if (err instanceof ApiError && err.status === 404) {
            set((s) => ({ records: s.records.filter((r) => r.id !== id) }));
            toast('Record deleted', { icon: '\u2139\uFE0F' });
          } else {
            toast.error(err instanceof Error ? err.message : 'Failed to delete record');
          }
        }
      },

      bulkUpdateStatus: (ids, status) => {
        set((s) => ({
          records: s.records.map((r) =>
            ids.includes(r.id) ? { ...r, status, updatedAt: new Date().toISOString() } : r
          ),
        }));
        toast.success(`${ids.length} records updated`);
      },

      addPatient: (data) => {
        const now = new Date().toISOString();
        const patient: Patient = {
          ...data,
          id: `pat-${Date.now()}`,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ patients: [...s.patients, patient] }));
        toast.success('Patient added');
      },

      updatePatient: (id, data) => {
        set((s) => ({
          patients: s.patients.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          ),
        }));
        toast.success('Patient updated');
      },

      deletePatient: (id) => {
        set((s) => ({ patients: s.patients.filter((p) => p.id !== id) }));
        toast('Patient removed', { icon: '\u2139\uFE0F' });
      },

      updateProfile: (name, email) => set({ profileName: name, profileEmail: email }),

      addOperator: (op) => {
        const id = `op-${Date.now()}`;
        set((s) => ({ operators: [...s.operators, { ...op, id }] }));
        toast.success('Operator added');
      },

      removeOperator: (id) => {
        set((s) => ({ operators: s.operators.filter((o) => o.id !== id) }));
        toast('Operator removed', { icon: '\u2139\uFE0F' });
      },

      addSampleType: (name) => {
        const id = `st-${Date.now()}`;
        set((s) => ({ sampleTypes: [...s.sampleTypes, { id, name }] }));
        toast.success('Sample type added');
      },

      removeSampleType: (id) => {
        set((s) => ({ sampleTypes: s.sampleTypes.filter((t) => t.id !== id) }));
        toast('Sample type removed', { icon: '\u2139\uFE0F' });
      },

      setLiveConnected: (v) => set({ liveConnected: v }),
      setFetchError: (v) => set({ fetchError: v }),

      fetchFromApi: async () => {
        set({ fetchError: null });
        try {
          const [summaryRes, recordsRes] = await Promise.all([
            fetchWithTimeout('http://localhost:5000/summary'),
            fetchWithTimeout('http://localhost:5000/records'),
          ]);
          if (!summaryRes.ok || !recordsRes.ok) {
            throw new Error(`Server responded with ${summaryRes.status} / ${recordsRes.status}`);
          }
          const summary = await summaryRes.json();
          const records = await recordsRes.json();
          set({
            records,
            liveConnected: true,
            lastSynced: Date.now(),
            fetchError: null,
          });
          toast.success(`Loaded ${records.length} records`);
          console.log('[LMS] Fetched summary:', summary);
        } catch (err: unknown) {
          console.error('[LMS] Fetch failed:', err);
          const msg = err instanceof Error ? err.message : 'Connection failed';
          set({ liveConnected: false, fetchError: msg });
          toast.error('Could not connect to server');
        }
      },
    }),
    {
      name: 'lms-store',
      partialize: (state) => ({
        records: state.records,
        patients: state.patients,
        operators: state.operators,
        sampleTypes: state.sampleTypes,
        profileName: state.profileName,
        profileEmail: state.profileEmail,
      }),
    }
  )
);
