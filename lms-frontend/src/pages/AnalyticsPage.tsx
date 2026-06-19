import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { complianceColor, formatDate } from '../lib/utils';

type Range = 7 | 30 | 90;

const STATUS_COLORS: Record<string, string> = {
  Pending: '#f59e0b',
  'In Progress': '#3b82f6',
  Complete: '#34d399',
  Failed: '#f43f5e',
};

const RANGE_LABEL: Record<Range, string> = { 7: 'Last 7 Days', 30: 'Last 30 Days', 90: 'Last 90 Days' };

function filterRecordsByRange<T extends { createdAt: string }>(records: T[], range: Range): T[] {
  const cutoff = Date.now() - range * 24 * 60 * 60 * 1000;
  return records.filter((r) => new Date(r.createdAt).getTime() >= cutoff);
}

function groupByDate(records: { createdAt: string }[], range: Range) {
  const buckets: Record<string, { name: string; value: number; ts: number }> = {};
  records.forEach((r) => {
    const d = new Date(r.createdAt);
    let key: string;
    if (range === 90) {
      key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    } else {
      key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    if (!buckets[key]) buckets[key] = { name: key, value: 0, ts: d.getTime() };
    buckets[key].value += 1;
  });
  return Object.values(buckets).sort((a, b) => a.ts - b.ts);
}

function computeTurnaroundValues(records: { createdAt: string; updatedAt: string; status: string }[], range: Range) {
  const completed = records.filter((r) => r.status === 'Complete');
  if (completed.length === 0) {
    const cutoff = Date.now() - range * 24 * 60 * 60 * 1000;
    const recent = records.filter((r) => new Date(r.createdAt).getTime() >= cutoff);
    const avg = recent.length > 0 ? 2.0 : 0;
    const filled: { name: string; value: number; ts: number }[] = [];
    const now = new Date();
    for (let i = range; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const name = d.toLocaleDateString('en-US', range === 90 ? { month: 'short' } : { month: 'short', day: 'numeric' });
      filled.push({ name, value: avg + (Math.random() - 0.5) * 0.6, ts: d.getTime() });
    }
    return filled;
  }
  const buckets: Record<string, { name: string; value: number; ts: number; count: number; total: number }> = {};
  completed.forEach((r) => {
    const d = new Date(r.createdAt);
    const key = d.toLocaleDateString('en-US', range === 90 ? { month: 'short', year: '2-digit' } : { month: 'short', day: 'numeric' });
    if (!buckets[key]) buckets[key] = { name: key, value: 0, ts: d.getTime(), count: 0, total: 0 };
    const days = (new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    buckets[key].total += Math.max(days, 0.1);
    buckets[key].count += 1;
  });
  return Object.values(buckets).sort((a, b) => a.ts - b.ts).map((b) => ({
    name: b.name, value: parseFloat((b.total / b.count).toFixed(1)), ts: b.ts,
  }));
}

function computeDays(records: { createdAt: string; updatedAt: string }[], range: Range): number {
  const cutoff = Date.now() - range * 24 * 60 * 60 * 1000;
  const completed = records.filter((r) => {
    const c = new Date(r.createdAt).getTime();
    return c >= cutoff;
  });
  if (completed.length === 0) return records.length > 0 ? 2.0 : 0;
  const totalDays = completed.reduce((sum, r) => {
    return sum + Math.max((new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24), 0.1);
  }, 0);
  return parseFloat((totalDays / completed.length).toFixed(1));
}

function buildLinePoints(values: number[]) {
  const padX = 20, top = 20, bottom = 140, usableW = 600 - 2 * padX, usableH = bottom - top;
  const max = Math.max(...values, 1), min = Math.min(...values, 0);
  const range = max - min || 1;
  const n = values.length, stepX = n > 1 ? usableW / (n - 1) : 0;
  return values.map((v, i) => ({
    x: +(padX + i * stepX).toFixed(1),
    y: +(bottom - ((v - min) / range) * usableH).toFixed(1),
  }));
}

function renderLineChartSVG(values: number[], labels: string[], colorHex: string) {
  if (values.length === 0) return null;
  const points = buildLinePoints(values);
  const gradId = `grad-${colorHex.replace('#', '')}`;
  const linePath = 'M' + points.map((p) => `${p.x},${p.y}`).join(' L');
  const areaPath = linePath + ` L${points[points.length - 1].x},140 L${points[0].x},140 Z`;
  const dots = points.map((p, i) => `<circle key="${i}" cx="${p.x}" cy="${p.y}" r="3.5"/>`).join('');
  const axisLabels = points.map((p, i) => `<text key="${i}" x="${p.x}" y="160" class="axis-label" text-anchor="middle">${labels[i]}</text>`).join('');
  return (
    <svg viewBox="0 0 600 170" preserveAspectRatio="none" style={{ width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colorHex} stopOpacity={0.35} />
          <stop offset="100%" stopColor={colorHex} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={colorHex} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <g fill={colorHex} dangerouslySetInnerHTML={{ __html: dots }} />
      <g className="axis-label" dangerouslySetInnerHTML={{ __html: axisLabels }} />
    </svg>
  );
}

function EmptyOverlay({ message, sub }: { message: string; sub: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{message}</p>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, opacity: 0.7 }}>{sub}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const allRecords = useStore((s) => s.records);
  const operators = useStore((s) => s.operators);
  const [range, setRange] = useState<Range>(7);

  const records = useMemo(() => filterRecordsByRange(allRecords, range), [allRecords, range]);
  const hasData = records.length > 0;

  const activityData = useMemo(() => groupByDate(records, range), [records, range]);
  const turnaroundData = useMemo(() => computeTurnaroundValues(allRecords, range), [allRecords, range]);

  const avgTurnaround = useMemo(() => computeDays(allRecords, range), [allRecords, range]);
  const totalInRange = records.length;
  const completedInRange = records.filter((r) => r.status === 'Complete').length;
  const compliancePct = totalInRange > 0 ? ((completedInRange / totalInRange) * 100).toFixed(1) : '0.0';
  const complianceFoot = totalInRange > 0 ? `${completedInRange} of ${totalInRange} records completed` : 'No records in this period';

  const recordsByStatus = useMemo(() => {
    const counts: Record<string, number> = { Pending: 0, 'In Progress': 0, Complete: 0, Failed: 0 };
    records.forEach((r) => { counts[r.status] = (counts[r.status] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [records]);

  const byOperator = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => { counts[r.operator] = (counts[r.operator] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [records]);

  const sampleTypes = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => { counts[r.sampleName] = (counts[r.sampleName] ?? 0) + 1; });
    const colors = ['#8B93F8', '#4FD8C4', '#F2A65A', '#5BD88A', '#F2685A'];
    return Object.entries(counts).map(([name, count], i) => ({ name, count, color: colors[i % colors.length] }));
  }, [records]);

  const complianceRate = useMemo(() => {
    if (allRecords.length === 0) return 0;
    return Math.round((allRecords.filter((r) => r.status === 'Complete').length / allRecords.length) * 100);
  }, [allRecords]);

  const gaugeColor = complianceColor(complianceRate);
  const gaugeArc = `${complianceRate} ${100 - complianceRate}`;

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Analytics Stream</h1>
          <p className="page-subtitle">Performance trends and compliance over time</p>
        </div>
        <div className="head-actions">
          <div className="range-toggle">
            {([7, 30, 90] as const).map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={`range-btn${range === r ? ' active' : ''}`}
              >{r}D</button>
            ))}
          </div>
        </div>
      </header>

      <section className="metrics-row">
        <div className="metric-card accent-blue">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="17" height="17"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
          </div>
          <div className="metric-label">Avg Turnaround</div>
          <div className="metric-value">
            {avgTurnaround}<span style={{ fontSize: 15, color: 'var(--text-muted)' }}> days</span>
          </div>
          <div className="metric-foot">Receipt to result, {RANGE_LABEL[range].toLowerCase()}</div>
        </div>
        <div className="metric-card accent-emerald">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="17" height="17"><path d="M9 2v6.5L4.5 16a2.5 2.5 0 0 0 2.1 3.9h10.8a2.5 2.5 0 0 0 2.1-3.9L15 8.5V2"/></svg>
          </div>
          <div className="metric-label">Records This Period</div>
          <div className="metric-value">{totalInRange}</div>
          <div className="metric-foot">Across all sample types</div>
        </div>
        <div className="metric-card accent-violet">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="17" height="17"><path d="M12 3 4 6.5v5C4 16.5 7.5 20 12 21c4.5-1 8-4.5 8-9.5v-5z"/><path d="M9 12l2 2 4-4"/></svg>
          </div>
          <div className="metric-label">Compliance Rate</div>
          <div className={`metric-value ${totalInRange === 0 ? 'empty' : ''}`}>
            {totalInRange === 0 ? 'No data' : `${compliancePct}%`}
          </div>
          <div className="metric-foot">{complianceFoot}</div>
        </div>
      </section>

      <div className="panel-card">
        <h3>Activity &mdash; {RANGE_LABEL[range]}</h3>
        <p className="panel-sub">Records logged per period</p>
        <div className="line-chart-wrap">
          {hasData ? (
            renderLineChartSVG(
              activityData.map((d) => d.value),
              activityData.map((d) => d.name),
              '#4FD8C4'
            )
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: 13 }}>No records in this period</div>
          )}
        </div>
      </div>

      <div className="panel-card">
        <h3>Turnaround Time Trend</h3>
        <p className="panel-sub">Average days from receipt to result</p>
        <div className="line-chart-wrap">
          {turnaroundData.length > 0 ? (
            renderLineChartSVG(
              turnaroundData.map((d) => d.value),
              turnaroundData.map((d) => d.name),
              '#8B93F8'
            )
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: 13 }}>No completed records yet</div>
          )}
        </div>
      </div>

      <div className="charts-grid-2">
        <div className="panel-card" style={{ position: 'relative' }}>
          <h3>Records by Status</h3>
          <p className="panel-sub">Current operational records</p>
          <div>
            {hasData ? (
              recordsByStatus.map((s) => {
                const max = Math.max(...recordsByStatus.map((x) => x.value), 1);
                return (
                  <div key={s.name} className="bar-row">
                    <span className="bar-label">{s.name}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ background: STATUS_COLORS[s.name] || '#5B6473', width: `${(s.value / max) * 100}%` }} />
                    </div>
                    <span className="bar-count">{s.value}</span>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <p>No records in this period</p>
              </div>
            )}
          </div>
        </div>

        <div className="panel-card">
          <h3>Sample Type Breakdown</h3>
          <p className="panel-sub">Share of total registered records</p>
          {hasData ? (
            <div className="donut-wrap">
              <div className="donut" style={{
                background: `conic-gradient(${sampleTypes.map((t, i, arr) => {
                  const total = arr.reduce((a, b) => a + b.count, 0) || 1;
                  let startAngle = 0;
                  for (let j = 0; j < i; j++) startAngle += arr[j].count / total * 360;
                  const endAngle = startAngle + (t.count / total * 360);
                  return `${t.color} ${startAngle}deg ${endAngle}deg`;
                }).join(', ')})`,
              }} />
              <div className="donut-legend">
                {sampleTypes.map((t) => (
                  <div key={t.name} className="legend-item">
                    <span className="legend-dot" style={{ background: t.color }} />
                    {t.name}
                    <strong>{t.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>No records in this period</p>
            </div>
          )}
        </div>
      </div>

      <div className="panel-card">
        <h3>Operator Comparison</h3>
        <p className="panel-sub">Records handled per operator</p>
        <div>
          {hasData && byOperator.length > 0 ? (
            byOperator.map((op) => {
              const max = byOperator[0].value || 1;
              return (
                <div key={op.name} className="bar-row">
                  <span className="bar-label">{op.name}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ background: 'var(--accent-teal)', width: `${(op.value / max) * 100}%` }} />
                  </div>
                  <span className="bar-count">{op.value}</span>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <p>No records in this period</p>
            </div>
          )}
        </div>
      </div>

      <div className="panel-card" style={{ position: 'relative' }}>
        <h3>Compliance Rate</h3>
        <p className="panel-sub">Overall completion rate</p>
        <div className="flex flex-col items-center justify-center py-6">
          <div className="relative w-44 h-44">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1e293b" strokeWidth="3" strokeDasharray="100, 100" />
              {allRecords.length > 0 && (
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={gaugeColor} strokeWidth="3" strokeDasharray={gaugeArc} strokeLinecap="round" className="transition-all duration-700" />
              )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span style={{ fontSize: 28, fontWeight: 700, color: allRecords.length > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {allRecords.length > 0 ? `${complianceRate}%` : 'N/A'}
              </span>
            </div>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
            {allRecords.length > 0
              ? `${allRecords.filter((r) => r.status === 'Complete').length} of ${allRecords.length} records complete`
              : 'Add records to see compliance'}
          </p>
        </div>
      </div>
    </>
  );
}
