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
    // Source RSS feeds
    const feedUrls = [
      'https://www.cityofbrea.gov/RSSFeed.aspx?ModID=58&CID=All-calendar.xml',
      'https://www.eventbrite.com/d/ca--brea/all-events/',
    ];
    // Use AllOrigins to bypass CORS and retrieve raw XML for each
    const proxied = feedUrls.map(u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`);

    const fetchEvents = async () => {
      try {
        setStatus('Loading…');
        const fetchAndParse = async (url: string): Promise<EventItem[]> => {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const xmlText = await res.text();
          const parser = new DOMParser();
          // Eventbrite is HTML; RSS sources are XML. Detect based on URL.
          if (/eventbrite\.com/.test(url)) {
            const doc = parser.parseFromString(xmlText, 'text/html');
            // Prefer structured data via JSON-LD if available
            const ldScripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
            let eventsEB: EventItem[] = [];
            for (const script of ldScripts) {
              try {
                const json = JSON.parse(script.textContent || 'null');
                const list = Array.isArray(json) ? json : (json?.itemListElement || json?.['@graph'] || []);
                const candidates = Array.isArray(list) ? list : [];
                for (const item of candidates) {
                  const entity: any = item?.item || item; // ItemListElement or direct Event
                  if (entity?.['@type'] === 'Event' || entity?.type === 'Event') {
                    const title = entity?.name || 'Event';
                    const start = entity?.startDate || entity?.startTime || '';
                    const link = entity?.url || undefined;
                    let dateIso = '';
                    const parsedStart = Date.parse(start);
                    if (!isNaN(parsedStart)) dateIso = new Date(parsedStart).toISOString();
                    const imageUrl = getImageForEvent(title);
                    eventsEB.push({
                      id: link ?? `eb-${Math.random().toString(36).slice(2)}`,
                      name: title,
                      date: dateIso || start,
                      source: 'Eventbrite',
                      url: link,
                      address: entity?.location?.address?.streetAddress || undefined,
                      imageUrl,
                    });
                  }
                }
              } catch (e) {}
            }
            // Fallback to DOM card parsing if JSON-LD not present
            if (eventsEB.length === 0) {
              const cards = Array.from(doc.querySelectorAll('[data-testid="event-card"], [data-spec="event-card"]'));
              eventsEB = cards.map((card, i) => {
                const title = card.querySelector('[data-testid="event-card-title"], [data-spec="event-card-title"], h3, .eds-event-card__formatted-name')?.textContent?.trim() || 'Event';
                const linkRel = card.querySelector('a[href*="eventbrite.com/e/"]') as HTMLAnchorElement | null;
                const link = linkRel?.href || undefined;
                const dateText = card.querySelector('[data-testid="event-card-date"], [data-spec="event-card-date"], time, .eds-event-card-content__sub-title')?.textContent?.trim() || '';
                let dateIso = '';
                const parsedDate = Date.parse(dateText);
                if (!isNaN(parsedDate)) dateIso = new Date(parsedDate).toISOString();
                const imageUrl = getImageForEvent(title);
                return {
                  id: link ?? `eb-${i}-${Math.random().toString(36).slice(2)}`,
                  name: title,
                  date: dateIso || dateText,
                  source: 'Eventbrite',
                  url: link,
                  address: undefined,
                  imageUrl,
                };
              });
            }
            return eventsEB;
          }
          // Default XML RSS parsing
          const doc = parser.parseFromString(xmlText, 'text/xml');
          const channelTitle = doc.querySelector('channel > title')?.textContent ?? 'Events';
          const items = Array.from(doc.querySelectorAll('item'));
          const eventsParsed: EventItem[] = items.map((item) => {
            const title = item.querySelector('title')?.textContent ?? 'Untitled';
            const link = item.querySelector('link')?.textContent ?? undefined;
            const pubDate = item.querySelector('pubDate')?.textContent ?? '';
            const description = item.querySelector('description')?.textContent ?? '';
            // Prefer actual event date (from title/description) over publication date
            const text = `${title} ${description}`;
            const patterns: RegExp[] = [
              // Dec 12, 2025 7:00 PM or December 12, 2025 7:00 PM
              /(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}(?:\s+\d{1,2}:\d{2}\s*(AM|PM))?/i,
              // 12/12/2025 or 12/12/2025 7:00 PM
              /\b\d{1,2}\/\d{1,2}\/\d{2,4}(?:\s+\d{1,2}:\d{2}\s*(AM|PM))?\b/,
              // Range with start-end times after a date
              /(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}\s+\d{1,2}:\d{2}\s*(AM|PM)\s*-\s*\d{1,2}:\d{2}\s*(AM|PM)/i,
              /\b\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}\s*(AM|PM)\s*-\s*\d{1,2}:\d{2}\s*(AM|PM)\b/,
            ];
            let dateIso = '';
            for (const re of patterns) {
              const m = text.match(re);
              if (m) {
                let candidate = m[0];
                if (/\s-\s/.test(candidate)) {
                  candidate = candidate.replace(/\s*-\s*\d{1,2}:\d{2}\s*(AM|PM)/i, '');
                }
                const dt = Date.parse(candidate);
                if (!isNaN(dt)) {
                  dateIso = new Date(dt).toISOString();
                  break;
                }
              }
            }
            if (!dateIso) {
              const parsed = Date.parse(pubDate);
              if (!isNaN(parsed)) dateIso = new Date(parsed).toISOString();
            }
            const imageUrl = getImageForEvent(title);
            return {
              id: link ?? Math.random().toString(36).slice(2),
              name: title,
              date: dateIso || pubDate,
              source: channelTitle,
              url: link,
              address: undefined,
              imageUrl,
            };
          });
          return eventsParsed;
        };

        const results = await Promise.allSettled(proxied.map(fetchAndParse));
        const merged: EventItem[] = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);

        // Filter to next 7 days, then sort and limit
        const now = new Date();
        const in7 = new Date();
        in7.setDate(now.getDate() + 7);
        const upcoming = merged.filter(ev => {
          const t = Date.parse(ev.date || '');
          if (isNaN(t)) return false;
          const d = new Date(t);
          return d >= now && d <= in7;
        });
        const sorted = upcoming.sort((a, b) => {
          const ta = Date.parse(a.date || '');
          const tb = Date.parse(b.date || '');
          return (isNaN(ta) ? 0 : ta) - (isNaN(tb) ? 0 : tb);
        }).slice(0, 20);

        setEvents(sorted);
        setStatus(sorted.length ? `Found ${sorted.length} events (next 7 days)` : 'No events in next 7 days');
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

  const formatDateOnly = (raw: string) => {
    if (!raw) return '';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <ModuleWrapper title="Brea Events">
      <div className="flex flex-col h-full p-4 space-y-3 max-h-[650px] overflow-y-auto">
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
                  {(ev.source && ev.source.toLowerCase().includes('brea')) ? formatDateOnly(ev.date) : formatDateTime(ev.date)}{ev.source ? ` • ${ev.source}` : ''}
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
  // RF events -> antenna icon
  if (/\brf\b/.test(n)) {
    const svg = encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">\n' +
      '<rect width="80" height="80" rx="8" fill="#0f766e"/>\n' +
      // mast
      '<rect x="38" y="26" width="4" height="28" fill="#ffffff"/>\n' +
      '<rect x="34" y="54" width="12" height="4" fill="#ffffff"/>\n' +
      // waves
      '<path d="M40 24 C46 24, 52 30, 52 36" stroke="#a7f3d0" stroke-width="2" fill="none"/>\n' +
      '<path d="M40 20 C50 20, 58 30, 58 40" stroke="#a7f3d0" stroke-width="2" fill="none"/>\n' +
      '<path d="M40 24 C34 24, 28 30, 28 36" stroke="#a7f3d0" stroke-width="2" fill="none"/>\n' +
      '<path d="M40 20 C30 20, 22 30, 22 40" stroke="#a7f3d0" stroke-width="2" fill="none"/>\n' +
      // signal dot
      '<circle cx="40" cy="24" r="3" fill="#22d3ee"/>\n' +
      '</svg>'
    );
    return `data:image/svg+xml,${svg}`;
  }
  // Holiday events -> fireworks icon
  if (/(holiday|new\s*year|christmas|hanukkah|thanksgiving|independence\s*day|memorial\s*day|labor\s*day)/.test(n)) {
    const svg = encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">\n' +
      '<rect width="80" height="80" rx="8" fill="#111827"/>\n' +
      // burst 1
      '<circle cx="26" cy="30" r="2" fill="#f59e0b"/>\n' +
      '<path d="M26 30 l-10 -4" stroke="#f59e0b" stroke-width="2"/>\n' +
      '<path d="M26 30 l8 -6" stroke="#f59e0b" stroke-width="2"/>\n' +
      '<path d="M26 30 l2 10" stroke="#f59e0b" stroke-width="2"/>\n' +
      // burst 2
      '<circle cx="54" cy="22" r="2" fill="#3b82f6"/>\n' +
      '<path d="M54 22 l-9 -3" stroke="#3b82f6" stroke-width="2"/>\n' +
      '<path d="M54 22 l7 -5" stroke="#3b82f6" stroke-width="2"/>\n' +
      '<path d="M54 22 l3 9" stroke="#3b82f6" stroke-width="2"/>\n' +
      // burst 3
      '<circle cx="40" cy="48" r="2" fill="#ef4444"/>\n' +
      '<path d="M40 48 l-8 -6" stroke="#ef4444" stroke-width="2"/>\n' +
      '<path d="M40 48 l10 -2" stroke="#ef4444" stroke-width="2"/>\n' +
      '<path d="M40 48 l-2 10" stroke="#ef4444" stroke-width="2"/>\n' +
      // sparkles
      '<circle cx="20" cy="50" r="1.5" fill="#e5e7eb"/>\n' +
      '<circle cx="62" cy="40" r="1.5" fill="#e5e7eb"/>\n' +
      '</svg>'
    );
    return `data:image/svg+xml,${svg}`;
  }
  // Amazing Circus or Amazing Digital -> circus tent icon
  if (/\bamazing\s+circus\b/.test(n) || /\bamazing\s+digital\b/.test(n)) {
    const svg = encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">\n' +
      '<rect width="80" height="80" rx="8" fill="#dc2626"/>\n' +
      // tent base
      '<path d="M16 56 L40 26 L64 56 Z" fill="#f59e0b" stroke="#ffffff" stroke-width="2"/>\n' +
      // stripes
      '<path d="M40 26 L28 56" stroke="#ffffff" stroke-width="3"/>\n' +
      '<path d="M40 26 L40 56" stroke="#ffffff" stroke-width="3"/>\n' +
      '<path d="M40 26 L52 56" stroke="#ffffff" stroke-width="3"/>\n' +
      // flag
      '<path d="M40 20 L40 26" stroke="#ffffff" stroke-width="2"/>\n' +
      '<path d="M40 20 L50 22 L40 24 Z" fill="#3b82f6"/>\n' +
      '</svg>'
    );
    return `data:image/svg+xml,${svg}`;
  }
  // Planning-related events -> map icon
  if (/(planning\s*meeting|planning\s*\b|planning\s*commission|general\s*plan|zoning)/.test(n)) {
    const svg = encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">\n' +
      '<rect width="80" height="80" rx="8" fill="#0ea5e9"/>\n' +
      // folded map panels
      '<path d="M14 22 L34 16 L48 22 L66 16 L66 58 L48 64 L34 58 L14 64 Z" fill="#38bdf8" stroke="#ffffff" stroke-width="2"/>\n' +
      // roads
      '<path d="M20 28 L40 22 L40 54" stroke="#1f2937" stroke-width="3" fill="none"/>\n' +
      '<path d="M28 56 L52 50" stroke="#1f2937" stroke-width="3" fill="none"/>\n' +
      // pin
      '<path d="M48 36 c0 -6 5 -11 11 -11 s11 5 11 11 c0 8 -11 18 -11 18 s-11 -10 -11 -18" fill="#ef4444"/>\n' +
      '<circle cx="59" cy="36" r="4" fill="#f8fafc"/>\n' +
      '</svg>'
    );
    return `data:image/svg+xml,${svg}`;
  }
  // Council meetings -> table icon
  if (/(city\s*council|council\s*meeting)/.test(n)) {
    const svg = encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">\n' +
      '<rect width="80" height="80" rx="8" fill="#1f2937"/>\n' +
      '<rect x="12" y="30" width="56" height="16" rx="4" fill="#b45309"/>\n' +
      '<rect x="18" y="46" width="6" height="12" fill="#92400e"/>\n' +
      '<rect x="56" y="46" width="6" height="12" fill="#92400e"/>\n' +
      '<rect x="10" y="24" width="10" height="8" rx="2" fill="#6b7280"/>\n' +
      '<rect x="60" y="24" width="10" height="8" rx="2" fill="#6b7280"/>\n' +
      '<rect x="10" y="48" width="10" height="8" rx="2" fill="#6b7280"/>\n' +
      '<rect x="60" y="48" width="10" height="8" rx="2" fill="#6b7280"/>\n' +
      '</svg>'
    );
    return `data:image/svg+xml,${svg}`;
  }
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
