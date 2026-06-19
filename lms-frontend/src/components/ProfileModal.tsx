import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Bell, LogOut, Settings } from 'lucide-react';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileModal({ open, onClose }: ProfileModalProps) {
  const navigate = useNavigate();
  const profileName = useStore((s) => s.profileName);
  const profileEmail = useStore((s) => s.profileEmail);

  const [pendingAlerts, setPendingAlerts] = useState(true);
  const [dailySummary, setDailySummary] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(false);

  if (!open) return null;

  const role = 'Root Admin';
  const initials = (profileName || 'VX').slice(0, 2).toUpperCase();

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-panel" role="dialog" aria-modal="true" aria-label="Profile and settings">
        <div className="modal-header">
          <div className="modal-avatar-lg">{initials}</div>
          <div className="modal-header-meta">
            <div className="mname">{profileEmail}</div>
            <div className="memail">{role}</div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <h4><Bell size={13} style={{ marginRight: 5, verticalAlign: -1 }} /> Notifications</h4>
            <div className="setting-row" style={{ padding: '8px 4px' }}>
              <div className="setting-row-text"><strong>Pending sample alerts</strong><p>Email when a sample is pending over 24h</p></div>
              <label className="toggle"><input type="checkbox" checked={pendingAlerts} onChange={() => setPendingAlerts(!pendingAlerts)} /><span className="track"><span className="knob"></span></span></label>
            </div>
            <div className="setting-row" style={{ padding: '8px 4px' }}>
              <div className="setting-row-text"><strong>Daily summary report</strong><p>End-of-day digest of record activity</p></div>
              <label className="toggle"><input type="checkbox" checked={dailySummary} onChange={() => setDailySummary(!dailySummary)} /><span className="track"><span className="knob"></span></span></label>
            </div>
            <div className="setting-row" style={{ padding: '8px 4px', borderBottom: 'none' }}>
              <div className="setting-row-text"><strong>Critical result alerts</strong><p>Immediate alert for flagged critical results</p></div>
              <label className="toggle"><input type="checkbox" checked={criticalAlerts} onChange={() => setCriticalAlerts(!criticalAlerts)} /><span className="track"><span className="knob"></span></span></label>
            </div>
          </div>

          <div className="modal-section">
            <button
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => { onClose(); navigate('/settings'); }}
            >
              <Settings size={15} />
              Manage workspace
            </button>
          </div>

          <div className="modal-section" style={{ display: 'flex', flexDirection: 'column' }}>
            <button className="modal-logout">
              <LogOut size={15} />
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
