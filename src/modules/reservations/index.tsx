import { useEffect, useMemo, useState } from 'react';
import { ModuleWrapper } from '../../components/ModuleWrapper';

type Reservation = {
  id: string;
  partySize: number;
  time: string; // ISO timestamp
  status?: 'booked' | 'seated' | 'cancelled' | 'no-show';
};

type CsvRow = {
  dateStr: string;
  timeStr: string;
  partySize: number;
};

type FetchResult = {
  reservations: Reservation[];
};

const getTodayRange = () => {
  // Uses the system's local timezone. For Pacific Time, ensure the host OS is set to PT.
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const formatTime = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '—';
  }
};

export const ReservationsModule = () => {
  const [data, setData] = useState<FetchResult>({ reservations: [] });
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [source, setSource] = useState<'api' | 'csv' | 'mock'>('mock');
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        setError(null);
        const apiUrl = (import.meta.env.VITE_RESERVATIONS_API_URL as string) || '';
        if (apiUrl) {
          const dayStart = new Date(`${selectedDate}T00:00:00`);
          const dayEnd = new Date(`${selectedDate}T23:59:59`);
          const url = new URL(apiUrl);
          url.searchParams.set('from', dayStart.toISOString());
          url.searchParams.set('to', dayEnd.toISOString());
          const res = await fetch(url.toString(), { signal: controller.signal });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          setData({ reservations: json?.reservations ?? [] });
        } else {
          // Fallback mock data if no API configured
          const mock: Reservation[] = [
            { id: 'r1', partySize: 2, time: new Date().toISOString(), status: 'booked' },
            { id: 'r2', partySize: 4, time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), status: 'booked' },
            { id: 'r3', partySize: 3, time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), status: 'booked' },
          ];
          setData({ reservations: mock });
        }
        setUpdatedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        setError(e?.message || 'Failed to load reservations');
      }
    };
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => { controller.abort(); clearInterval(interval); };
  }, [selectedDate]);

  const totals = useMemo(() => {
    const reservationsToday = data.reservations.length;
    const peopleTotal = data.reservations.reduce((sum, r) => sum + (r.partySize || 0), 0);
    return { reservationsToday, peopleTotal };
  }, [data]);

  const handleCsvUpload = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length === 0) throw new Error('CSV is empty');
        const header = lines[0].split(',').map(h => h.trim());
        const idxSite = header.indexOf('SiteName');
        const idxDate = header.indexOf('BusinessDate');
        const idxTime = header.indexOf('RSVP_Time');
        const idxParty = header.indexOf('party_size');
        if (idxDate === -1 || idxTime === -1 || idxParty === -1) {
          throw new Error('CSV must include BusinessDate, RSVP_Time, party_size');
        }
        const rawRows: CsvRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',');
          if (parts.length < header.length) continue;
          const dateStr = parts[idxDate]?.trim();
          const timeStr = parts[idxTime]?.trim();
          const partyStr = parts[idxParty]?.trim();
          if (!dateStr || !timeStr || !partyStr) continue;
          rawRows.push({
            dateStr,
            timeStr,
            partySize: Number(partyStr) || 0,
          });
        }
        setCsvRows(rawRows);
        // Apply current selectedDate filter immediately
        const dayStart = new Date(`${selectedDate}T00:00:00`);
        const dayEnd = new Date(`${selectedDate}T23:59:59`);
        // Dedupe by date+time+party_size
        const seen = new Set<string>();
        const filtered: Reservation[] = rawRows
          .map((r, idx) => {
            const dt = new Date(`${r.dateStr}T${r.timeStr}`);
            const yyyy = dt.getFullYear();
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const dd = String(dt.getDate()).padStart(2, '0');
            const rowDate = `${yyyy}-${mm}-${dd}`;
            if (rowDate === selectedDate && dt >= dayStart && dt <= dayEnd) {
              const key = `${rowDate}|${r.timeStr}|${r.partySize}`;
              if (seen.has(key)) return null;
              seen.add(key);
              return {
                id: `${idx + 1}-${r.dateStr}-${r.timeStr}`,
                partySize: r.partySize,
                time: dt.toISOString(),
                status: 'booked',
              } as Reservation;
            }
            return null;
          })
          .filter((x): x is Reservation => x !== null);
        setData({ reservations: filtered });
        setUpdatedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
        setSource('csv');
      } catch (e: any) {
        setError(e?.message || 'Failed to parse CSV');
      }
    };
    reader.onerror = () => setError('Failed to read CSV file');
    reader.readAsText(file);
  };

  // Re-filter CSV on date change without requiring a re-upload
  useEffect(() => {
    if (source !== 'csv' || csvRows.length === 0) return;
    const dayStart = new Date(`${selectedDate}T00:00:00`);
    const dayEnd = new Date(`${selectedDate}T23:59:59`);
    const seen = new Set<string>();
    const filtered: Reservation[] = csvRows
      .map((r, idx) => {
        const dt = new Date(`${r.dateStr}T${r.timeStr}`);
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        const rowDate = `${yyyy}-${mm}-${dd}`;
        if (rowDate === selectedDate && dt >= dayStart && dt <= dayEnd) {
          const key = `${rowDate}|${r.timeStr}|${r.partySize}`;
          if (seen.has(key)) return null;
          seen.add(key);
          return {
            id: `${idx + 1}-${r.dateStr}-${r.timeStr}`,
            partySize: r.partySize,
            time: dt.toISOString(),
            status: 'booked',
          } as Reservation;
        }
        return null;
      })
      .filter((x): x is Reservation => x !== null);
    setData({ reservations: filtered });
    setUpdatedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
  }, [selectedDate, source, csvRows]);

  return (
    <ModuleWrapper title="Upcoming Reservations">
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="w-full max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-500">Source: {source.toUpperCase()}</div>
            <label className="text-xs text-gray-600">Date
              <input
                className="ml-2 border rounded px-2 py-1 text-xs"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </label>
          </div>
          <label className="text-xs">
            <span className="mr-2 text-gray-600">Upload CSV</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleCsvUpload(f);
              }}
            />
          </label>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="grid grid-cols-2 gap-10 text-center">
          <div>
            <div className="text-sm text-gray-500">Total Reservations (Today)</div>
            <div className="text-6xl font-bold text-indigo-600">{totals.reservationsToday}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Total People (Today)</div>
            <div className="text-6xl font-bold text-indigo-600">{totals.peopleTotal}</div>
          </div>
        </div>
        <div className="mt-8 w-full max-w-3xl">
          <div className="text-sm font-medium text-gray-700 mb-3">Upcoming — highest party sizes</div>
          <div className="grid grid-cols-3 gap-5 text-center">
            {[...data.reservations]
              .sort((a, b) => b.partySize - a.partySize)
              .slice(0, 6)
              .map(r => (
              <div key={r.id} className="p-3 bg-white rounded shadow-sm">
                <div className="text-sm text-gray-500">{formatTime(r.time)}</div>
                <div className="text-lg font-semibold">Party {r.partySize}</div>
              </div>
            ))}
            {data.reservations.length === 0 && (
              <div className="col-span-3 text-center text-sm text-gray-500">No reservations today</div>
            )}
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500">Last updated: {updatedAt || '—'}</div>
      </div>
    </ModuleWrapper>
  );
};

export default ReservationsModule;