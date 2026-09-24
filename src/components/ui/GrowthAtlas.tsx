import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Bookmark, Check, Copy,
  Download, ExternalLink, Globe2, Linkedin, MapPin, RotateCcw, Search
} from 'lucide-react';
import { gpsTo3D } from '../../data/GoogleMapsStoreRegistry';
import { GROWTH_PARKS, GrowthCompany, GrowthPark } from '../../data/growthAtlas';
import { cameraControlBus } from '../../services/cameraControlBus';
import { SimulationMode } from '../../types';

interface GrowthAtlasProps {
  children: React.ReactNode;
  mode: SimulationMode;
  active: boolean;
  onOpenSimulator: () => void;
}

const savedKey = 'bengaluru-growth-atlas-leads';
const companyKey = (park: GrowthPark, company: GrowthCompany) => `${park.id}:${company.name}`;
const mapsUrl = (park: GrowthPark) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${park.name}, ${park.area}, Bengaluru`)}`;
const directionsUrl = (park: GrowthPark) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${park.name}, ${park.area}, Bengaluru`)}`;
const streetMapUrl = (lat: number, lng: number) => {
  const bbox = [lng - 0.007, lat - 0.006, lng + 0.007, lat + 0.006].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`;
};
const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
const initialPark = GROWTH_PARKS.find((park) => park.id === new URLSearchParams(window.location.search).get('park')) || GROWTH_PARKS[0];

function CompanyMark({ company }: { company: GrowthCompany }) {
  const [failed, setFailed] = useState(false);
  const domain = new URL(company.website).hostname;
  return (
    <span className="atlas-company-mark" aria-hidden="true">
      {company.name.slice(0, 2).toUpperCase()}
      {!failed && (
        <img
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

export const GrowthAtlas: React.FC<GrowthAtlasProps> = ({ children, mode, active, onOpenSimulator }) => {
  const [selectedId, setSelectedId] = useState(initialPark.id);
  const [mapSurface, setMapSurface] = useState<'twin' | 'google' | 'osm'>(initialPark.mapCoverage === 'context' ? 'osm' : 'twin');
  const [mapReady, setMapReady] = useState(false);
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
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const selected = GROWTH_PARKS.find((park) => park.id === selectedId) || GROWTH_PARKS[0];
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
    cameraControlBus.flyTo([x + 190, 300, z + 300], [x, 10, z]);
  };

  useEffect(() => {
    if (!active || mapSurface !== 'twin' || selected.mapCoverage !== 'corridor') return;
    const frame = requestAnimationFrame(() => flyToPark(selected));
    return () => cancelAnimationFrame(frame);
  }, [active, selected, mapSurface]);

  useEffect(() => setMapReady(false), [selectedId, mapSurface]);

  const selectPark = (park: GrowthPark) => {
    if (park.id === selectedId && mapSurface === 'twin') flyToPark(park);
    setSelectedId(park.id);
    setMapSurface(park.mapCoverage === 'context' ? 'osm' : 'twin');
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
      ['Company', 'Tech park', 'Area', 'Website', 'LinkedIn', 'Occupancy source'],
      ...savedCompanies.map(({ park, company }) => [
        company.name, park.name, park.area, company.website, company.linkedin || '', company.sourceUrl
      ])
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
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
            <div className="atlas-map-canvas" role="region" tabIndex={mapSurface === 'twin' ? 0 : undefined} aria-describedby="atlas-map-help" aria-label={mapSurface === 'twin' ? 'Interactive 3D map of the Bellandur to Marathahalli corridor' : `${mapSurface === 'osm' ? 'Street map' : 'Google Map'} of ${selected.name}`}>
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
            </div>
            <div className="atlas-map-head">
              <div className="atlas-map-heading"><span className="atlas-live-dot" /><strong>{selected.name.toUpperCase()}</strong><small>{mapSurface === 'twin' ? 'OSM 3D TWIN · BELLANDUR → MARATHAHALLI' : mapSurface === 'osm' ? 'OPENSTREETMAP · DRAG TO EXPLORE' : 'GOOGLE MAPS · PLACE PREVIEW'}</small></div>
              <div className="atlas-map-actions">
                {mapSurface !== 'twin' && selected.mapCoverage === 'corridor' && <button type="button" onClick={() => setMapSurface('twin')}>3D twin</button>}
                {mapSurface !== 'osm' && <button type="button" onClick={() => setMapSurface('osm')}>Street map</button>}
                {mapSurface !== 'google' && mode.googleMapsApiKey && <button type="button" onClick={() => setMapSurface('google')}>Google Map</button>}
                {mapSurface === 'twin' && <button type="button" onClick={() => cameraControlBus.triggerResetView()} aria-label="Reset 3D map view"><RotateCcw size={15} /> Reset</button>}
              </div>
            </div>
            <div className="atlas-map-bottom">
              <p id="atlas-map-help">{mapSurface === 'twin' ? <>Drag to pan <span>·</span> Scroll to zoom <span>·</span> Right drag to rotate <span>·</span> Reset button to return</> : <>{mapSurface === 'osm' && <>Drag to pan <span>·</span> +/− to zoom <span>·</span> </>}<a href={mapsUrl(selected)} target="_blank" rel="noopener noreferrer">Open place and reviews on Google Maps <ArrowUpRight size={13} /></a></>}</p>
              {selected.mapCoverage === 'context' && <span className="atlas-context-note">Wider-area context · exact 3D detail unavailable</span>}
            </div>
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
                {selected.featuredCompanies.map((company) => <a key={company.name} href={company.website} target="_blank" rel="noopener noreferrer" aria-label={`${company.name} website`} title={company.name}>
                  <CompanyMark company={company} /><span>{company.name}</span>
                </a>)}
              </div>
            </div>
          </div>

          <aside className="atlas-inspector">
            <div className="atlas-inspector-top"><span>PLACE DOSSIER</span><span>{String(selectedIndex + 1).padStart(2, '0')} / {String(GROWTH_PARKS.length).padStart(2, '0')}</span></div>
            <div className="atlas-inspector-title"><span className="atlas-place-dot" /><div><p>{selected.area} · Bengaluru</p><h2 aria-live="polite">{selected.name}</h2></div></div>
            <p className="atlas-description">{selected.description}</p>
            <p className="atlas-coverage"><span>{selected.mapCoverage === 'corridor' ? '3D corridor anchor' : 'Wider-area place'}</span> · {selected.lat === undefined ? 'Open Google Maps for exact location' : 'Approximate point anchor'}</p>
            <div className="atlas-place-links">
              <a href={mapsUrl(selected)} target="_blank" rel="noopener noreferrer"><MapPin size={15} /> Google Maps <ExternalLink size={13} /></a>
              <a href={mapsUrl(selected)} target="_blank" rel="noopener noreferrer">Find reviews <ExternalLink size={13} /></a>
              <a href={directionsUrl(selected)} target="_blank" rel="noopener noreferrer">Directions <ExternalLink size={13} /></a>
            </div>
            <p className="atlas-review-note">Open the live Google listing and choose Reviews to see current ratings and feedback.</p>
            <div className="atlas-companies-heading"><div><span>INSIDE THE PARK</span><h3>{selected.id === 'google_ananta' ? 'Campus company' : 'Featured occupiers'}</h3></div><small>{selected.featuredCompanies.length} sourced</small></div>
            <ul className="atlas-company-list">
              {selected.featuredCompanies.map((company) => {
                const isSaved = saved.includes(companyKey(selected, company));
                return (
                  <li key={company.name}>
                    <CompanyMark company={company} />
                    <div className="atlas-company-info"><strong>{company.name}</strong><a href={company.sourceUrl} target="_blank" rel="noopener noreferrer">Location source <ArrowUpRight size={12} /></a></div>
                    <div className="atlas-company-links">
                      <a href={company.website} target="_blank" rel="noopener noreferrer" aria-label={`${company.name} website`} title="Website"><Globe2 size={15} /></a>
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
            <article><span className="atlas-section-no">01 / OBSERVE</span><h3>Movement friction</h3><p>{selected.painHypothesis}</p><small>Opportunity hypothesis · validate with local interviews and current reviews</small></article>
            <article><span className="atlas-section-no">02 / GET FOUND</span><h3>Local search angle</h3><p className="atlas-example-query">“{selected.seoQuery}”</p><label htmlFor="atlas-service">Your offer</label><input id="atlas-service" value={service} onChange={(event) => setService(event.target.value)} maxLength={70} placeholder="e.g. corporate shuttle" /><div className="atlas-keyword">{service.trim() || 'your service'} near {selected.name}, Bengaluru</div></article>
            <article><span className="atlas-section-no">03 / WIN A LEAD</span><h3>Outreach hook</h3><p>{selected.leadAngle}</p><button className="atlas-copy" type="button" onClick={copyBrief}>{copyState === 'copied' ? <Check size={15} /> : <Copy size={15} />}{copyState === 'copied' ? 'Brief copied' : copyState === 'failed' ? 'Copy unavailable' : 'Copy area brief'}</button></article>
          </div>
          <div className="atlas-lead-bar"><div><span>YOUR PROSPECT LIST</span><strong>{savedCompanies.length} saved {savedCompanies.length === 1 ? 'company' : 'companies'}</strong><small>Save occupiers from the place dossier, then export their public links.</small></div><button type="button" onClick={exportLeads} disabled={savedCompanies.length === 0}><Download size={16} /> Export lead list</button></div>
        </section>
      </main>

      <footer className="atlas-footer"><span>OFFSET / BENGALURU</span><p>3D roads and buildings: © OpenStreetMap contributors. Traffic and movement opportunities are modelled or hypotheses. Company locations link to their sources; check current occupancy before outreach.</p><a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer">Selected place source <ArrowUpRight size={14} /></a></footer>
    </div>
  );
};
