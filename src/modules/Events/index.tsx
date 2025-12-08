import { useEffect, useState } from 'react';
import { ModuleWrapper } from '../../components/ModuleWrapper';

interface EventItem {
  id: string;
  name: string;
  date: string;
  source?: string;
  url?: string;
  address?: string;
  imageUrl?: string;
}

export const EventsModule = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [status, setStatus] = useState<string>('Loading…');

  useEffect(() => {
    // Lazy Dog Restaurant & Bar – Brea, CA (approx coordinates)
    // Note: RSS feeds generally do not include precise geo; keeping these
    // coords documented here for future providers that support radius filters.
    // const latitude = 33.9153;
    // const longitude = -117.8880;
    // const radiusMiles = 5;

    // Comma-separated list of public RSS/ICS feeds exposed via Vite env
    const feedsEnv = (import.meta.env.VITE_EVENTS_FEEDS as string | undefined)?.split(',').map(s => s.trim()).filter(Boolean) ?? [];

    // Example public feeds (you can replace with local calendars)
    const defaultFeeds: string[] = [
      // Use rss2json to avoid CORS on RSS feeds
      // City or venue calendars can be added here
      // 'https://api.rss2json.com/v1/api.json?rss_url=https://example.com/events.rss'
    ];

    const feeds = feedsEnv.length ? feedsEnv : defaultFeeds;

    const fetchFeed = async (feedUrl: string): Promise<EventItem[]> => {
      try {
        const res = await fetch(feedUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const items = (data?.items ?? []).map((item: any) => {
          const name = item?.title ?? 'Untitled';
          const imageUrl = getImageForEvent(name);
          return {
            id: item?.guid ?? item?.link ?? Math.random().toString(36).slice(2),
            name,
            date: item?.pubDate ?? item?.date ?? '',
            source: data?.feed?.title ?? 'Feed',
            url: item?.link,
            imageUrl,
          } as EventItem;
        });
        return items;
      } catch (e) {
        return [];
      }
    };

    const isNearBrea = (text: string) => {
      const t = (text || '').toLowerCase();
      return t.includes('brea') || t.includes('92821') || t.includes('orange county');
    };

    const fetchEvents = async () => {
      try {
        setStatus('Loading…');
        if (!feeds.length) {
          // Generate mock Brea-area events for the next 7 days
          const venues = ['Brea Downtown', 'Brea Mall', 'Carbon Canyon Regional Park', 'City of Brea Community Center'];
          const addresses: Record<string, string> = {
            'Brea Downtown': '330 W Birch St, Brea, CA 92821',
            'Brea Mall': '1065 Brea Mall, Brea, CA 92821',
            'Carbon Canyon Regional Park': '4442 Carbon Canyon Rd, Brea, CA 92823',
            'City of Brea Community Center': '695 Madison Way, Brea, CA 92821',
          };
          const types = ['Live Music', 'Trivia Night', 'Food Truck Rally', 'Outdoor Yoga', 'Art Walk', 'Open Mic', 'Family Movie Night'];
          // typeImages removed; using getImageForEvent(name) keyword mapping
          const today = new Date();
          const mock: EventItem[] = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            d.setHours(19, 0, 0, 0); // 7:00 PM
            const name = `Brea ${types[i % types.length]}`;
            const venue = venues[i % venues.length];
            return {
              id: `mock-${d.getTime()}`,
              name: `${name} • ${venue}`,
              date: d.toISOString(),
              source: 'Mock',
              url: undefined,
              address: addresses[venue],
              imageUrl: getImageForEvent(name),
            };
          });
          setEvents(mock);
          setStatus(`Showing ${mock.length} mock events (next 7 days)`);
          return;
        }
        const all: EventItem[][] = await Promise.all(feeds.map(fetchFeed));
        const merged = all.flat();
        // Filter loosely for Brea proximity by text (no geo in RSS)
        // Also exclude any events that mention Lazy Dog
        const filtered = merged.filter(ev => {
          const text = `${ev.name} ${ev.source ?? ''} ${ev.address ?? ''}`.toLowerCase();
          return isNearBrea(text) && !text.includes('lazy dog');
        });
        // Sort by date asc if parseable
        const sorted = filtered.sort((a, b) => {
          const ta = Date.parse(a.date || '');
          const tb = Date.parse(b.date || '');
          return (isNaN(ta) ? 0 : ta) - (isNaN(tb) ? 0 : tb);
        }).slice(0, 15);
        setEvents(sorted);
        setStatus(sorted.length ? `Found ${sorted.length} events` : 'No events found');
      } catch (err) {
        setStatus('Error loading events');
        setEvents([]);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 60_000);
    return () => clearInterval(interval);
  }, []);

  const formatDateTime = (raw: string) => {
    if (!raw) return '';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <ModuleWrapper title="Nearby Events (Brea)">
      <div className="flex flex-col h-full p-4 space-y-3">
        <div className="text-sm text-gray-600">{status}</div>
        <ul className="space-y-2">
          {events.map((ev) => (
            <li key={ev.id} className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div className="flex items-start gap-3">
                {ev.imageUrl ? (
                  <img src={ev.imageUrl} alt="event" className="w-16 h-16 rounded object-cover" />
                ) : null}
                <div>
                <div className="text-base font-semibold">{ev.name}</div>
                <div className="text-sm text-gray-600">
                  {formatDateTime(ev.date)}{ev.source ? ` • ${ev.source}` : ''}
                </div>
                {ev.address ? (
                  <div className="text-sm text-gray-500">{ev.address}</div>
                ) : null}
                </div>
              </div>
              {ev.url ? (
                <a href={ev.url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm">Details</a>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </ModuleWrapper>
  );
};

// Pick an icon based on common keywords in the event name.
function getImageForEvent(name: string): string {
  const n = (name || '').toLowerCase();
  const pick = (emoji: string, color: string = '2563eb') => `https://placehold.co/80x80/${color}/ffffff?text=${encodeURIComponent(emoji)}`;
  if (/(music|band|concert|dj)/.test(n)) {
    // Use a simple inline SVG music note as the thumbnail image
    const svg = encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">\n' +
      '<rect width="80" height="80" rx="8" fill="#2563eb"/>\n' +
      '<path d="M50 18v30.5c0 6-5.5 10.5-12 10.5s-12-4.5-12-10.5 5.5-10.5 12-10.5c2.2 0 4.2.5 6 1.4V18h6z" fill="#ffffff"/>\n' +
      '</svg>'
    );
    return `data:image/svg+xml,${svg}`;
  }
  if (/(trivia|quiz|pub trivia|pub quiz)/.test(n)) {
    const svg = encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">\n' +
      '<rect width="80" height="80" rx="8" fill="#059669"/>\n' +
      '<path d="M40 18c-9.4 0-17 7.6-17 17 0 6.2 3.5 11.7 8.7 14.5l.3 4.5h16l.3-4.5C53.5 46.7 57 41.2 57 35c0-9.4-7.6-17-17-17z" fill="#fef3c7"/>\n' +
      '<rect x="32" y="54" width="16" height="6" rx="2" fill="#d97706"/>\n' +
      '<rect x="34" y="61" width="12" height="4" rx="2" fill="#92400e"/>\n' +
      '</svg>'
    );
    return `data:image/svg+xml,${svg}`;
  }
  if (/(food truck|taco|bbq|brew|beer|food|dinner|brunch)/.test(n)) {
    // Inline SVG taco icon
    const svg = encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">\n' +
      '<rect width="80" height="80" rx="8" fill="#f59e0b"/>\n' +
      '<path d="M20 50c0-11 9-20 20-20 11 0 20 9 20 20H20z" fill="#fcd34d"/>\n' +
      '<path d="M22 48c3-7 10-12 18-12 8 0 15 5 18 12" stroke="#10b981" stroke-width="4" stroke-linecap="round" fill="none"/>\n' +
      '<circle cx="34" cy="46" r="3" fill="#ef4444"/>\n' +
      '<circle cx="42" cy="44" r="3" fill="#ef4444"/>\n' +
      '<circle cx="50" cy="47" r="3" fill="#ef4444"/>\n' +
      '</svg>'
    );
    return `data:image/svg+xml,${svg}`;
  }
  if (/(yoga|fitness|run|workout|exercise)/.test(n)) {
    // Inline SVG of a person stretching
    const svg = encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">\n' +
      '<rect width="80" height="80" rx="8" fill="#10b981"/>\n' +
      // head
      '<circle cx="40" cy="20" r="6" fill="#ffffff"/>\n' +
      // arms stretching
      '<path d="M20 30 C30 28, 34 28, 40 32" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round"/>\n' +
      '<path d="M60 30 C50 28, 46 28, 40 32" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round"/>\n' +
      // torso
      '<path d="M40 26 L40 44" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>\n' +
      // legs in stretch
      '<path d="M40 44 L28 56" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>\n' +
      '<path d="M40 44 L52 56" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>\n' +
      '</svg>'
    );
    return `data:image/svg+xml,${svg}`;
  }
  if (/(art|gallery|paint|craft)/.test(n)) {
    // Use a public domain Van Gogh image (Wikimedia Commons thumbnail)
    // Source: The Starry Night (public domain)
    const vanGogh = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/120px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg';
    return vanGogh;
  }
  if (/(open mic|comedy|karaoke|standup|open\s*mic)/.test(n)) {
    // Inline SVG microphone icon
    const svg = encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">\n' +
      '<rect width="80" height="80" rx="8" fill="#7c3aed"/>\n' +
      '<rect x="34" y="18" width="12" height="22" rx="6" fill="#ffffff"/>\n' +
      '<path d="M40 40 v10" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>\n' +
      '<path d="M30 55 h20" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>\n' +
      '</svg>'
    );
    return `data:image/svg+xml,${svg}`;
  }
  if (/(movie|film|cinema|screening)/.test(n)) {
    // Inline SVG movie screen icon
    const svg = encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">\n' +
      '<rect width="80" height="80" rx="8" fill="#374151"/>\n' +
      '<rect x="16" y="22" width="48" height="28" rx="3" fill="#111827" stroke="#ffffff" stroke-width="2"/>\n' +
      '<rect x="20" y="26" width="40" height="20" fill="#1f2937"/>\n' +
      '<rect x="24" y="50" width="32" height="4" rx="2" fill="#6b7280"/>\n' +
      '</svg>'
    );
    return `data:image/svg+xml,${svg}`;
  }
  if (/(kids|family|community)/.test(n)) return pick('👨‍👩‍👧‍👦', '3b82f6');
  if (/(market|fair|festival)/.test(n)) return pick('🛍️', 'e11d48');
  return pick('📅', '9ca3af');
}
