import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { LabRecord } from '../types';

export function useRealtimeStats() {
  const setRecords = useStore((s) => s.setRecords);
  const setLiveConnected = useStore((s) => s.setLiveConnected);
  const setFetchError = useStore((s) => s.setFetchError);

  useEffect(() => {
    let es: EventSource;
    let closed = false;

    function connect() {
      if (closed) return;
      es = new EventSource('http://localhost:5000/stream');

      es.onopen = () => {
        setLiveConnected(true);
        setFetchError(null);
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.records) {
            const current = useStore.getState().records;
            const serverIds = new Set(data.records.map((r: LabRecord) => r.id));
            const merged = [
              ...data.records,
              ...current.filter((r) => !serverIds.has(r.id)),
            ];
            setRecords(merged);
          }
        } catch {
          // ignore parse errors
        }
      };

      es.onerror = () => {
        setLiveConnected(false);
        es.close();
        if (!closed) setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      closed = true;
      if (es) es.close();
    };
  }, [setRecords, setLiveConnected, setFetchError]);
}
