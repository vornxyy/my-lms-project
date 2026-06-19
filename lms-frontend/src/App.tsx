import { useCallback, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import ProfileModal from './components/ProfileModal';
import Dashboard from './pages/Dashboard';
import PatientsPage from './pages/PatientsPage';
import RecordsPage from './pages/RecordsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useRealtimeStats } from './hooks/useRealtimeStats';

export default function App() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  useRealtimeStats();

  const handleNewRecord = useCallback(() => {
    navigate('/records');
    setTimeout(() => {
      const addBtn = document.querySelector('[data-add-record]') as HTMLButtonElement;
      addBtn?.click();
    }, 100);
  }, [navigate]);

  const handleSearchFocus = useCallback(() => {
    setTimeout(() => {
      const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
      searchInput?.focus();
    }, 50);
  }, []);

  const handleEscape = useCallback(() => {
    setProfileOpen(false);
    const detailClose = document.querySelector('[data-detail-close]') as HTMLButtonElement;
    if (detailClose) { detailClose.click(); return; }
    const modalClose = document.querySelector('[data-modal-close]') as HTMLButtonElement;
    if (modalClose) { modalClose.click(); return; }
  }, []);

  useKeyboardShortcuts({
    onNewRecord: handleNewRecord,
    onSearchFocus: handleSearchFocus,
    onEscape: handleEscape,
  });

  return (
    <div className="app-layout">
      <Sidebar onProfileOpen={() => setProfileOpen(true)} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#34d399', secondary: '#1e293b' },
          },
          error: {
            iconTheme: { primary: '#f43f5e', secondary: '#1e293b' },
          },
        }}
      />
    </div>
  );
}
