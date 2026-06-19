export type RecordStatus = 'Pending' | 'In Progress' | 'Complete' | 'Failed';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  contact: string;
  address?: string;
  status: 'Active' | 'Inactive';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEntry {
  actor: string;
  action: string;
  target: string;
  time: string;
  icon: 'plus' | 'progress' | 'complete';
  color: string;
}

export interface LabRecord {
  id: string;
  sampleName: string;
  operator: string;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
  patientName?: string;
  notes?: string;
}

export interface SummaryData {
  totalRecords: number;
  activeEngagements: number;
  compliance: string;
}

export interface Operator {
  id: string;
  name: string;
  email: string;
  active: boolean;
}

export interface SampleType {
  id: string;
  name: string;
}

export type FetchState = 'idle' | 'loading' | 'success' | 'error';
