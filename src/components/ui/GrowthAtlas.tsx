import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Bookmark, Check, Copy,
  Download, ExternalLink, Globe2, Linkedin, MapPin, RotateCcw, Search
} from 'lucide-react';
import { gpsTo3D } from '../../data/GoogleMapsStoreRegistry';
import { GROWTH_PARKS, GrowthCompany, GrowthPark, quoteAtlasCsvCell } from '../../data/growthAtlas';
import { cameraControlBus } from '../../services/cameraControlBus';
import { fetchTrafficFlow } from '../../services/tomtomService';
import { SimulationMode, TrafficFlowData } from '../../types';

interface GrowthAtlasProps {
  children: React.ReactNode;
  mode: SimulationMode;
  active: boolean;
  onOpenSimulator: () => void;
}

const savedKey = 'bengaluru-growth-atlas-leads';
const leadDetailsKey = 'bengaluru-growth-atlas-lead-details';
const reviewNotesKey = 'bengaluru-growth-atlas-review-notes';
type LeadStage = 'Research' | 'Contacted' | 'Qualified';
type LeadDetails = { stage: LeadStage; note: string };
type RoadSample = { status: 'loading' | 'unavailable' } | { status: 'ready'; data: TrafficFlowData; distanceMeters: number };
const leadStages: LeadStage[] = ['Research', 'Contacted', 'Qualified'];
const companyKey = (park: GrowthPark, company: GrowthCompany) => `${park.id}:${company.name}`;
const mapsUrl = (park: GrowthPark) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${park.name}, ${park.area}, Bengaluru`)}&query_place_id=${encodeURIComponent(park.googlePlaceId)}`;
const directionsUrl = (park: GrowthPark) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${park.name}, ${park.area}, Bengaluru`)}&destination_place_id=${encodeURIComponent(park.googlePlaceId)}`;
const areaGuideUrl = (park: GrowthPark) => `/parks/${park.id.replace(/_/g, '-')}/`;
let placesLibrary: Promise<void> | undefined;
const loadPlacesLibrary = (key: string) => {
  if (!placesLibrary) placesLibrary = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Maps could not load'));
    document.head.append(script);
  }).then(async () => {
    const maps = (window as unknown as { google?: { maps?: { importLibrary: (name: string) => Promise<unknown> } } }).google?.maps;
    if (!maps) throw new Error('Google Maps did not initialize');
    await maps.importLibrary('places');
  }).catch((error) => { placesLibrary = undefined; throw error; });
  return placesLibrary;
};
const streetMapUrl = (lat: number, lng: number) => {
  const bbox = [lng - 0.007, lat - 0.006, lng + 0.007, lat + 0.006].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`;
};
const initialPark = GROWTH_PARKS.find((park) => park.id === new URLSearchParams(window.location.search).get('park')) || GROWTH_PARKS[0];
const preferredSurface = (park: GrowthPark) => park.mapCoverage === 'context' || window.matchMedia('(max-width: 850px)').matches ? 'osm' : 'twin';

function CompanyMark({ company }: { company: GrowthCompany }) {
  const [failed, setFailed] = useState(false);
  const domain = company.website ? new URL(company.website).hostname : null;
  // Juniper's site icon now resolves to HPE, so keep the sourced tenant name's initials.
  const hasMatchingIcon = !!company.logoUrl || (!!domain && company.name !== 'Juniper Networks');
  return (
    <span className={`atlas-company-mark${company.logoUrl ? ' has-logo' : ''}`} aria-hidden="true">
      {company.name.slice(0, 2).toUpperCase()}
      {!failed && hasMatchingIcon && (
        <img
          src={company.logoUrl || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain || '')}&sz=64`}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

function GoogleReviews({ park, apiKey }: { park: GrowthPark; apiKey: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const widget = useRef<HTMLElement>(null);

  useEffect(() => {
    if (status !== 'ready') return;
    const onError = () => setStatus('error');
    const element = widget.current;
    element?.addEventListener('gmp-error', onError);
    return () => element?.removeEventListener('gmp-error', onError);
  }, [status]);

  const openReviews = () => {
    setStatus('loading');
    loadPlacesLibrary(apiKey).then(() => setStatus('ready')).catch(() => setStatus('error'));
  };

  return <div className="atlas-google-reviews">
    {status === 'idle' && <button type="button" onClick={openReviews}>Load live Google reviews</button>}
    {status === 'loading' && <p role="status">Loading Google reviews…</p>}
    {status === 'error' && <><p role="status">Live reviews are unavailable. If you changed the API key, reload the page. <a href={mapsUrl(park)} target="_blank" rel="noopener noreferrer">Open the Google listing</a>.</p><button type="button" onClick={openReviews}>Retry live reviews</button></>}
    {status === 'ready' && React.createElement('gmp-place-details', { key: park.googlePlaceId, ref: widget },
      React.createElement('gmp-place-details-place-request', { place: park.googlePlaceId }),
      React.createElement('gmp-place-content-config', null,
        React.createElement('gmp-place-name'),
        React.createElement('gmp-place-rating'),
        React.createElement('gmp-place-reviews')
      )
    )}
  </div>;
}

export const GrowthAtlas: React.FC<GrowthAtlasProps> = ({ children, mode, active, onOpenSimulator }) => {
  const [selectedId, setSelectedId] = useState(initialPark.id);
  const [mapSurface, setMapSurface] = useState<'twin' | 'google' | 'osm'>(() => preferredSurface(initialPark));
  const [mapReady, setMapReady] = useState(false);
  const [mapInteractive, setMapInteractive] = useState(false);
  const [query, setQuery] = useState('');
  const [service, setService] = useState('corporate shuttle');
  const [saved, setSaved] = useState<string[]>(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(savedKey) || '[]');
      return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  });
  const [leadDetails, setLeadDetails] = useState<Record<string, LeadDetails>>(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(leadDetailsKey) || '{}');
      if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
      return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, LeadDetails] => {
        const detail = entry[1] as LeadDetails;
        return !!detail && leadStages.includes(detail.stage) && typeof detail.note === 'string';
      }));
    } catch {
      return {};
    }
  });
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(reviewNotesKey) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value)
        ? Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
        : {};
    } catch {
      return {};
    }
  });
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [roadSamples, setRoadSamples] = useState<Record<string, RoadSample>>({});
  const selected = GROWTH_PARKS.find((park) => park.id === selectedId) || GROWTH_PARKS[0];
  const roadSample = roadSamples[selected.id];
  const reviewNote = reviewNotes[selected.id] || '';
  const selectedIndex = GROWTH_PARKS.indexOf(selected);
  const matchingParks = useMemo(() => GROWTH_PARKS.filter((park) => {
    const haystack = `${park.name} ${park.area} ${park.featuredCompanies.map((company) => company.name).join(' ')}`;
    return haystack.toLowerCase().includes(query.trim().toLowerCase());
  }), [query]);
  const savedCompanies = GROWTH_PARKS.flatMap((park) => park.featuredCompanies
    .filter((company) => saved.includes(companyKey(park, company)))
    .map((company) => ({ park, company })));

  useEffect(() => {
    try {
      localStorage.setItem(savedKey, JSON.stringify(saved));
    } catch {
      // The in-session shortlist still works when browser storage is unavailable.
    }
  }, [saved]);

  useEffect(() => {
    try {
      localStorage.setItem(reviewNotesKey, JSON.stringify(reviewNotes));
    } catch {
      // Review notes remain editable during this session.
    }
  }, [reviewNotes]);

  useEffect(() => {
    try {
      localStorage.setItem(leadDetailsKey, JSON.stringify(leadDetails));
    } catch {
      // The prospect workspace still works during this session.
    }
  }, [leadDetails]);

  useEffect(() => {
    setCopyState('idle');
  }, [selectedId, service]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('park', selected.id);
    window.history.replaceState(window.history.state, '', url);
    document.title = active ? `${selected.name} workplace mobility leads | OFFSET Bengaluru` : 'Bengaluru Traffic Lab | OFFSET';
    document.querySelector('meta[name="description"]')?.setAttribute('content',
      active ? `Explore ${selected.name} in ${selected.area}, Bengaluru. Find sourced company links, Google Maps reviews, and a workplace mobility growth brief.` : 'Explore Bengaluru traffic scenarios and mobility data in the 3D traffic lab.');
  }, [active, selected]);

  const flyToPark = (park: GrowthPark) => {
    if (park.lat === undefined || park.lng === undefined) return;
    const [x, , z] = gpsTo3D(park.lat, park.lng);
    cameraControlBus.flyTo([x + 320, 500, z + 500], [x, 10, z]);
  };

  useEffect(() => {
    if (!active || mapSurface !== 'twin' || selected.mapCoverage !== 'corridor') return;
    const frame = requestAnimationFrame(() => flyToPark(selected));
    return () => cancelAnimationFrame(frame);
  }, [active, selected, mapSurface]);

  useEffect(() => setMapReady(false), [selectedId, mapSurface]);
  useEffect(() => setMapInteractive(false), [selectedId, mapSurface]);
  useEffect(() => {
    if (!mapInteractive) return;
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMapInteractive(false); };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [mapInteractive]);

  const selectPark = (park: GrowthPark) => {
    if (park.id === selectedId && mapSurface === 'twin') flyToPark(park);
    setSelectedId(park.id);
    setMapSurface(preferredSurface(park));
  };

  const checkNearbyRoad = async () => {
    const park = selected;
    if (park.lat === undefined || park.lng === undefined) return;
    setRoadSamples((samples) => ({ ...samples, [park.id]: { status: 'loading' } }));
    try {
      const result = await fetchTrafficFlow(false, { lat: park.lat, lng: park.lng });
      setRoadSamples((samples) => ({ ...samples, [park.id]: result.data.isDemo || result.roadDistanceMeters === undefined
        ? { status: 'unavailable' }
        : { status: 'ready', data: result.data, distanceMeters: result.roadDistanceMeters } }));
    } catch {
      setRoadSamples((samples) => ({ ...samples, [park.id]: { status: 'unavailable' } }));
    }
  };

  const toggleSaved = (park: GrowthPark, company: GrowthCompany) => {
    const key = companyKey(park, company);
    setSaved((previous) => previous.includes(key)
      ? previous.filter((item) => item !== key)
      : [...previous, key]);
  };

  const exportLeads = () => {
    if (savedCompanies.length === 0) return;
    const rows = [
      ['Company', 'Tech park', 'Area', 'Stage', 'Next step', 'Movement hypothesis', 'Review observation', 'Website', 'LinkedIn', 'Occupancy source'],
      ...savedCompanies.map(({ park, company }) => [
        company.name, park.name, park.area, leadDetails[companyKey(park, company)]?.stage || 'Research', leadDetails[companyKey(park, company)]?.note || '', park.painHypothesis, reviewNotes[park.id] || '', company.website || '', company.linkedin || '', company.sourceUrl
      ])
    ];
    const csv = rows.map((row) => row.map(quoteAtlasCsvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bengaluru-tech-park-leads.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copyBrief = async () => {
    const brief = [
      `Area: ${selected.name}, ${selected.area}, Bengaluru`,
      `Offer: ${service.trim() || 'your service'}`,
      `Search intent: ${service.trim() || 'your service'} near ${selected.name}, Bengaluru`,
      `Movement hypothesis: ${selected.painHypothesis}`,
      ...(roadSample?.status === 'ready' ? [`Nearby TomTom road segment sampled at ${new Date(roadSample.data.timestamp).toLocaleString()}: ${roadSample.data.currentSpeed} km/h, ${roadSample.data.freeFlowSpeed} km/h free flow. One road fragment, not a route or park average.`] : []),
      ...(reviewNote.trim() ? [`Review observation (your note): ${reviewNote.trim()}`, `Review source: ${mapsUrl(selected)}`] : []),
      `Lead angle: ${selected.leadAngle}`,
      `Maps: ${mapsUrl(selected)}`
    ].join('\n');
    try {
      await navigator.clipboard.writeText(brief);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  return (
    <div className="atlas-shell" id="top">
      <header className="atlas-header">
        <a className="atlas-wordmark" href="#top" aria-label="Bengaluru Growth Atlas, back to top">
          <span className="atlas-wordmark-symbol" aria-hidden="true"><span /></span>
          <span><strong>OFFSET</strong><small>BENGALURU GROWTH ATLAS</small></span>
        </a>
        <nav className="atlas-header-nav" aria-label="Main navigation">
          <a href="#explore">Explore the corridor</a>
          <a href="#growth">Growth brief</a>
          <button type="button" onClick={onOpenSimulator}>Traffic lab <ArrowUpRight size={15} /></button>
        </nav>
      </header>

      <main>
        <section className="atlas-intro" aria-labelledby="atlas-title">
          <div>
            <p className="atlas-kicker"><span /> EAST BENGALURU / OUTER RING ROAD</p>
            <h1 id="atlas-title">A city of offices.<br /><em>A map of opportunity.</em></h1>
          </div>
          <div className="atlas-intro-side">
            <p>Find workplace mobility prospects from Ecospace to Marathahalli and Mahadevapura. See who works where, check the place on Google Maps, then build an area-specific search and outreach brief.</p>
            <a href="#explore">Start exploring <ArrowDownRight size={18} /></a>
          </div>
        </section>

        <section className="atlas-explorer" id="explore" aria-label="Bengaluru tech park explorer">
          <div className="atlas-map-panel">
            <div className={`atlas-map-canvas${mapInteractive ? ' is-interactive' : ''}`} role="region" tabIndex={mapSurface === 'twin' && mapInteractive ? 0 : undefined} aria-describedby="atlas-map-help" aria-label={mapSurface === 'twin' ? 'Interactive 3D map from Marathahalli to Mahadevapura' : `${mapSurface === 'osm' ? 'Street map' : 'Google Map'} of ${selected.name}`}>
              {mapSurface === 'twin' ? children : mapSurface === 'osm' && selected.lat !== undefined && selected.lng !== undefined ? <iframe
                title={`Street map of ${selected.name}`}
                src={streetMapUrl(selected.lat, selected.lng)}
              /> : <>
                {!mapReady && <div className="atlas-map-fallback">
                  <MapPin size={26} aria-hidden="true" />
                  <small>WIDER AREA / GOOGLE MAPS</small>
                  <strong>{selected.name}</strong>
                  <span>{selected.area}, Bengaluru</span>
                  <p>If the live preview is unavailable here, switch to the street map or open the place directly in Google Maps.</p>
                  <a href={mapsUrl(selected)} target="_blank" rel="noopener noreferrer">Open on Google Maps <ArrowUpRight size={16} /></a>
                </div>}
                {mode.googleMapsApiKey && <iframe
                  title={`Google Map of ${selected.name}`}
                  src={`https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(mode.googleMapsApiKey)}&q=${encodeURIComponent(`${selected.name}, ${selected.area}, Bengaluru`)}`}
                  referrerPolicy="strict-origin-when-cross-origin"
                  onLoad={() => setMapReady(true)}
                  onError={() => setMapReady(false)}
                  allowFullScreen
                />}
              </>}
              {!mapInteractive && <div className="atlas-map-scroll-shield" aria-hidden="true" />}
              <button className="atlas-map-gesture-toggle" type="button" aria-pressed={mapInteractive} onClick={() => setMapInteractive(!mapInteractive)}>{mapInteractive ? 'Scroll page' : 'Move map'}</button>
            </div>
            <div className="atlas-map-head">
                <div className="atlas-map-heading"><span className="atlas-live-dot" /><strong>{selected.name.toUpperCase()}</strong><small>{mapSurface === 'twin' ? 'OSM 3D TWIN · MARATHAHALLI → MAHADEVAPURA' : mapSurface === 'osm' ? 'OPENSTREETMAP · DRAG TO EXPLORE' : 'GOOGLE MAPS · PLACE PREVIEW'}</small></div>
              <div className="atlas-map-actions">
                {mapSurface !== 'twin' && selected.mapCoverage === 'corridor' && <button type="button" onClick={() => setMapSurface('twin')}>3D twin</button>}
                {mapSurface !== 'osm' && <button type="button" onClick={() => setMapSurface('osm')}>Street map</button>}
                {mapSurface !== 'google' && mode.googleMapsApiKey && <button type="button" onClick={() => setMapSurface('google')}>Google Map</button>}
                {mapSurface === 'twin' && <button type="button" onClick={() => flyToPark(selected)} aria-label="Reset 3D map view"><RotateCcw size={15} /> Reset</button>}
              </div>
            </div>
            <div className="atlas-map-bottom">
              <p id="atlas-map-help">{!mapInteractive ? <>Scroll page normally <span>·</span> Choose Move map to pan or zoom</> : mapSurface === 'twin' ? <>Drag to pan <span>·</span> Scroll to zoom <span>·</span> Right drag to rotate <span>·</span> Escape or Scroll page to leave map</> : <>Drag to pan <span>·</span> Use map controls to zoom <span>·</span> Escape or Scroll page to leave map</>}{mapSurface !== 'twin' && <> <span>·</span> <a href={mapsUrl(selected)} target="_blank" rel="noopener noreferrer">Open place and reviews on Google Maps <ArrowUpRight size={13} /></a></>}</p>
              {selected.mapCoverage === 'context' && <span className="atlas-context-note">Wider-area context · exact 3D detail unavailable</span>}
            </div>
            <a className="atlas-map-credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors · ODbL</a>
            <div className="atlas-park-rail">
              <div className="atlas-park-rail-label"><MapPin size={14} /><span>PLACES<br />ON THE MAP</span></div>
              <div className="atlas-rail-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a park or company" aria-label="Find a park or company" /></div>
              <div className="atlas-park-list" role="group" aria-label="Choose a tech park">
                {matchingParks.length ? matchingParks.map((park) => (
                  <button type="button" key={park.id} className={selected.id === park.id ? 'is-selected' : ''} onClick={() => selectPark(park)} aria-pressed={selected.id === park.id}>
                    <span className="atlas-park-index">{String(GROWTH_PARKS.indexOf(park) + 1).padStart(2, '0')}</span>
                    <span><strong>{park.name}</strong><small>{park.area}</small></span>
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </button>
                )) : <p className="atlas-no-results">No matching parks or companies.</p>}
              </div>
            </div>
            <div className="atlas-logo-wall">
              <div className="atlas-logo-wall-head"><span>AT THIS PLACE</span><small>SOURCED COMPANIES & WORKSPACES</small></div>
              <div className="atlas-logo-grid">
                {selected.featuredCompanies.map((company) => <a key={company.name} href={company.website || company.linkedin || company.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`${company.name} ${company.website ? 'website' : 'company profile'}`} title={company.name}>
                  <CompanyMark company={company} /><span>{company.name}</span>
                </a>)}
              </div>
            </div>
          </div>

          <aside className="atlas-inspector">
            <div className="atlas-inspector-top"><span>PLACE DOSSIER</span><span>{String(selectedIndex + 1).padStart(2, '0')} / {String(GROWTH_PARKS.length).padStart(2, '0')}</span></div>
            <div className="atlas-inspector-title"><span className="atlas-place-dot" /><div><p>{selected.area} · Bengaluru</p><h2 aria-live="polite">{selected.name}</h2></div></div>
            <p className="atlas-description">{selected.description}</p>
            <p className="atlas-coverage"><span>{selected.mapCoverage === 'corridor' ? '3D area anchor' : 'Wider-area place'}</span> · {selected.lat === undefined ? 'Open Google Maps for exact location' : 'Approximate point anchor'}</p>
            <div className="atlas-place-links">
              <a href={mapsUrl(selected)} target="_blank" rel="noopener noreferrer"><MapPin size={15} /> Google Maps <ExternalLink size={13} /></a>
              <a href={mapsUrl(selected)} target="_blank" rel="noopener noreferrer">Google reviews <ExternalLink size={13} /></a>
              <a href={directionsUrl(selected)} target="_blank" rel="noopener noreferrer">Directions <ExternalLink size={13} /></a>
              <a href={areaGuideUrl(selected)}>Area guide <ArrowRight size={13} /></a>
            </div>
            <p className="atlas-review-note">Open the Google listing to read or write a review. Ratings and feedback are owned by Google and may change.</p>
            {mode.googleMapsApiKey && <GoogleReviews key={`${selected.id}:${mode.googleMapsApiKey}`} park={selected} apiKey={mode.googleMapsApiKey} />}
            <div className="atlas-review-observation">
              <label htmlFor="atlas-review-note">Your movement insight from reviews</label>
              <textarea id="atlas-review-note" value={reviewNote} maxLength={400} onChange={(event) => setReviewNotes((notes) => ({ ...notes, [selected.id]: event.target.value }))} placeholder="Summarize a pickup, access, parking, or commute issue you found in current reviews." />
              <small>Saved on this device and included in the area brief. Check the live listing before outreach.</small>
            </div>
            <div className="atlas-companies-heading"><div><span>INSIDE THE PARK</span><h3>{selected.id === 'google_ananta' ? 'Campus company' : 'Featured occupiers'}</h3></div><small>{selected.featuredCompanies.length} sourced</small></div>
            <ul className="atlas-company-list">
              {selected.featuredCompanies.map((company) => {
                const isSaved = saved.includes(companyKey(selected, company));
                return (
                  <li key={company.name}>
                    <CompanyMark company={company} />
                    <div className="atlas-company-info"><strong>{company.name}</strong><a href={company.sourceUrl} target="_blank" rel="noopener noreferrer">Location source <ArrowUpRight size={12} /></a></div>
                    <div className="atlas-company-links">
                      {company.website && <a href={company.website} target="_blank" rel="noopener noreferrer" aria-label={`${company.name} website`} title="Website"><Globe2 size={15} /></a>}
                      {company.linkedin && <a href={company.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${company.name} on LinkedIn`} title="LinkedIn"><Linkedin size={15} /></a>}
                      <button type="button" onClick={() => toggleSaved(selected, company)} aria-label={`${isSaved ? 'Remove' : 'Save'} ${company.name} ${isSaved ? 'from' : 'to'} lead list`} aria-pressed={isSaved} title={isSaved ? 'Remove lead' : 'Save lead'}><Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} /></button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="atlas-tenant-note">Featured names are sourced examples, not a complete or live tenant directory.</p>
          </aside>
        </section>

        <section className="atlas-growth" id="growth" aria-labelledby="growth-title">
          <div className="atlas-growth-head"><p>FROM MOVEMENT TO MARKET</p><h2 id="growth-title">Make the place <em>useful.</em></h2><span>Current focus <ArrowRight size={14} /> {selected.name}</span></div>
          <div className="atlas-growth-grid">
            <article>
              <span className="atlas-section-no">01 / OBSERVE</span>
              <h3>Movement friction</h3>
              <p>{selected.painHypothesis}</p>
              {reviewNote.trim() && <p className="atlas-review-insight">Your review insight: {reviewNote.trim()}</p>}
              <div className="atlas-road-sample">
                <button type="button" onClick={checkNearbyRoad} disabled={roadSample?.status === 'loading'}>
                  {roadSample?.status === 'loading' ? 'Checking nearby road…' : roadSample?.status === 'ready' ? 'Refresh road sample' : 'Check nearby road now'}
                </button>
                {roadSample?.status === 'unavailable' && <p role="status">Live road sample unavailable. Check the connection or TomTom setup.</p>}
                {roadSample?.status === 'ready' && <div role="status">
                  <strong>{roadSample.data.currentSpeed} km/h sampled <span>/ {roadSample.data.freeFlowSpeed} km/h free flow</span></strong>
                  <p>{roadSample.data.roadClosure ? 'Road closure reported for this segment.' : roadSample.data.currentSpeed < roadSample.data.freeFlowSpeed ? `${Math.max(0, roadSample.data.currentTravelTime - roadSample.data.freeFlowTravelTime)} seconds above free-flow travel time on this segment.` : roadSample.data.currentSpeed > roadSample.data.freeFlowSpeed ? 'Sampled speed was above free flow on this segment.' : 'Sampled speed matched free flow on this segment.'}</p>
                  <small>TomTom · sampled {new Date(roadSample.data.timestamp).toLocaleString()} · {roadSample.data.frc} · confidence {Math.round(roadSample.data.confidence * 100)}% · geometry point within {Math.ceil(roadSample.distanceMeters / 100) * 100} m of approximate park centre. One nearby road direction, not a campus or route average.</small>
                </div>}
              </div>
              <small>Opportunity hypothesis · validate with local interviews and current reviews</small>
            </article>
            <article><span className="atlas-section-no">02 / GET FOUND</span><h3>Local search angle</h3><p className="atlas-example-query">“{selected.seoQuery}”</p><label htmlFor="atlas-service">Your offer</label><input id="atlas-service" value={service} onChange={(event) => setService(event.target.value)} maxLength={70} placeholder="e.g. corporate shuttle" /><div className="atlas-keyword">{service.trim() || 'your service'} near {selected.name}, Bengaluru</div></article>
            <article><span className="atlas-section-no">03 / WIN A LEAD</span><h3>Outreach hook</h3><p>{selected.leadAngle}</p><button className="atlas-copy" type="button" onClick={copyBrief}>{copyState === 'copied' ? <Check size={15} /> : <Copy size={15} />}{copyState === 'copied' ? 'Brief copied' : copyState === 'failed' ? 'Copy unavailable' : 'Copy area brief'}</button></article>
          </div>
          <div className="atlas-lead-bar"><div><span>YOUR PROSPECT LIST</span><strong>{savedCompanies.length} saved {savedCompanies.length === 1 ? 'company' : 'companies'}</strong><small>Save occupiers, record an outreach step, then export their public links.</small></div><button type="button" onClick={exportLeads} disabled={savedCompanies.length === 0}><Download size={16} /> Export lead list</button></div>
          {savedCompanies.length > 0 && <div className="atlas-lead-queue" role="group" aria-label="Saved prospect workspace">{savedCompanies.map(({ park, company }) => {
            const key = companyKey(park, company);
            const detail = leadDetails[key] || { stage: 'Research', note: '' };
            return <div key={key}>
              <span><strong>{company.name}</strong><small>{park.name}</small></span>
              <select aria-label={`${company.name} outreach stage`} value={detail.stage} onChange={(event) => setLeadDetails((details) => ({ ...details, [key]: { ...detail, stage: event.target.value as LeadStage } }))}>{leadStages.map((stage) => <option key={stage}>{stage}</option>)}</select>
              <input aria-label={`${company.name} next step`} value={detail.note} maxLength={160} placeholder="Contact route or next step" onChange={(event) => setLeadDetails((details) => ({ ...details, [key]: { ...detail, note: event.target.value } }))} />
            </div>;
          })}</div>}
        </section>
      </main>

      <footer className="atlas-footer"><span>OFFSET / BENGALURU</span><p>3D roads and buildings: © OpenStreetMap contributors. Traffic and movement opportunities are modelled or hypotheses. Company locations link to their sources; check current occupancy before outreach.</p><a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer">Selected place source <ArrowUpRight size={14} /></a></footer>
    </div>
  );
};
