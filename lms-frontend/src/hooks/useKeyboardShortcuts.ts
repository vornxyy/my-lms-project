import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutHandlers {
  onNewRecord?: () => void;
  onSearchFocus?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const navigate = useNavigate();

  useEffect(() => {
    let gPressed = false;
    let gTimeout: ReturnType<typeof setTimeout> | null = null;

    function handleSequence(e: KeyboardEvent) {
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        gPressed = true;
        if (gTimeout) clearTimeout(gTimeout);
        gTimeout = setTimeout(() => { gPressed = false; }, 500);
        return;
      }

      if (gPressed) {
        gPressed = false;
        if (gTimeout) clearTimeout(gTimeout);
        switch (e.key) {
          case 'd': navigate('/'); break;
          case 'r': navigate('/records'); break;
          case 'a': navigate('/analytics'); break;
          case 's': navigate('/settings'); break;
        }
        e.preventDefault();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (handlers.onSearchFocus) handlers.onSearchFocus();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        if (handlers.onNewRecord) handlers.onNewRecord();
        return;
      }

      if (e.key === 'Escape' && handlers.onEscape) {
        e.preventDefault();
        handlers.onEscape();
      }
    }

    window.addEventListener('keydown', handleSequence);
    return () => window.removeEventListener('keydown', handleSequence);
  }, [navigate, handlers]);
}
