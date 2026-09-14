import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Star,
  ExternalLink,
  X,
  Phone,
  Compass,
  Store,
  Navigation
} from 'lucide-react';
import {
  GOOGLE_MAPS_PROMINENT_STORES,
  GoogleMapsStore,
  getStoreCameraFraming,
  getStoreGoogleMapsUrl,
  gpsTo3D
} from '../../data/GoogleMapsStoreRegistry';
import { cameraControlBus } from '../../services/cameraControlBus';

interface GoogleMapsStoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStoreId?: string;
  onSelectStore: (store: GoogleMapsStore) => void;
}

export const GoogleMapsStoreDrawer: React.FC<GoogleMapsStoreDrawerProps> = ({
  isOpen,
  onClose,
  selectedStoreId,
  onSelectStore
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredStores = useMemo(() => {
    return GOOGLE_MAPS_PROMINENT_STORES.filter((store) => {
      const matchesCategory =
        categoryFilter === 'all' || store.category === categoryFilter;
      const matchesSearch =
        searchQuery === '' ||
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.kannadaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [categoryFilter, searchQuery]);

  const selectedStore = useMemo(() => {
    return (
      GOOGLE_MAPS_PROMINENT_STORES.find((s) => s.id === selectedStoreId) ||
      GOOGLE_MAPS_PROMINENT_STORES[0]
    );
  }, [selectedStoreId]);

  if (!isOpen) return null;

  const handleFlyTo = (store: GoogleMapsStore) => {
    const framing = getStoreCameraFraming(store);
    cameraControlBus.flyTo(framing.position, framing.target);
    onSelectStore(store);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '410px',
        maxWidth: '92vw',
        height: '100vh',
        background: 'rgba(10, 15, 29, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderLeft: '1px solid rgba(56, 189, 248, 0.25)',
        boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.75)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}
    >
      {/* ── Top Header ── */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.85)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #ea4335, #b91c1c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(234, 67, 53, 0.4)'
            }}
          >
            <MapPin size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.5px' }}>
              GOOGLE MAPS STORES
            </div>
            <div style={{ fontSize: '10px', color: '#38bdf8', letterSpacing: '0.2px' }}>
              GROUND-TRUTH 3D GPS SIMULATION
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '6px',
            padding: '6px',
            cursor: 'pointer',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Close store explorer"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        {/* Search input */}
        <input
          type="text"
          placeholder="Search Kalamandir, Multiplex, Tanishq..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: 'rgba(2, 6, 23, 0.7)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '6px',
            padding: '8px 12px',
            color: '#f8fafc',
            fontSize: '12px',
            outline: 'none'
          }}
        />

        {/* Category Pills */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '4px'
          }}
        >
          {[
            { id: 'all', label: 'ALL' },
            { id: 'silks', label: 'SILKS' },
            { id: 'jewellery', label: 'JEWELLERY' },
            { id: 'cinema', label: 'CINEMA' },
            { id: 'electronics', label: 'ELECTRONICS' },
            { id: 'apparel', label: 'APPAREL' },
            { id: 'dining', label: 'DINING' },
            { id: 'transit', label: 'TRANSIT' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: '4px',
                border:
                  categoryFilter === cat.id
                    ? '1px solid #38bdf8'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                background:
                  categoryFilter === cat.id
                    ? 'rgba(14, 116, 144, 0.4)'
                    : 'rgba(255, 255, 255, 0.04)',
                color: categoryFilter === cat.id ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Active Selected Store Inspector Card ── */}
      {selectedStore && (
        <div
          style={{
            margin: '12px 16px',
            padding: '14px',
            background: 'rgba(15, 23, 42, 0.95)',
            borderRadius: '10px',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>
                {selectedStore.name}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', marginTop: '1px' }}>
                {selectedStore.kannadaName}
              </div>
            </div>

            {/* Rating pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(234, 179, 8, 0.2)',
                border: '1px solid rgba(234, 179, 8, 0.5)',
                padding: '3px 7px',
                borderRadius: '6px'
              }}
            >
              <Star size={12} fill="#facc15" color="#facc15" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#fef08a' }}>
                {selectedStore.rating.toFixed(1)}
              </span>
              <span style={{ fontSize: '9px', color: '#cbd5e1' }}>
                ({selectedStore.reviewCount.toLocaleString()})
              </span>
            </div>
          </div>

          {/* Subtitle / Tagline */}
          <div
            style={{
              fontSize: '9.5px',
              fontWeight: 600,
              color: '#38bdf8',
              letterSpacing: '0.4px',
              textTransform: 'uppercase'
            }}
          >
            {selectedStore.bannerSubtitle}
          </div>

          {/* GPS Coordinates Grid */}
          <div
            style={{
              background: 'rgba(2, 6, 23, 0.75)',
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontFamily: 'monospace',
              fontSize: '10.5px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>REAL LATITUDE:</span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                {selectedStore.lat.toFixed(7)}° N
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>REAL LONGITUDE:</span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                {selectedStore.lng.toFixed(7)}° E
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>3D WORLD (X, Y, Z):</span>
              <span style={{ color: '#a5f3fc' }}>
                [{gpsTo3D(selectedStore.lat, selectedStore.lng).join(', ')}]m
              </span>
            </div>
          </div>

          {/* Address & Phone */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '10.5px', color: '#cbd5e1' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
              <MapPin size={13} color="#94a3b8" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{selectedStore.address}</span>
            </div>
            {selectedStore.phone && (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <Phone size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
                <span>{selectedStore.phone}</span>
              </div>
            )}
          </div>

          {/* Action Buttons: Fly To & Open Google Maps */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              onClick={() => handleFlyTo(selectedStore)}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                border: 'none',
                borderRadius: '6px',
                padding: '9px 12px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)'
              }}
            >
              <Navigation size={13} />
              <span>FLY TO STORE IN 3D</span>
            </button>

            <a
              href={getStoreGoogleMapsUrl(selectedStore)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                padding: '9px 12px',
                color: '#f8fafc',
                fontSize: '11px',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px'
              }}
              title="Open verified location in official Google Maps"
            >
              <ExternalLink size={13} />
              <span>MAPS</span>
            </a>
          </div>
        </div>
      )}

      {/* ── Scrollable Store List ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px', marginTop: '6px' }}>
          VERIFIED CORRIDOR STORES ({filteredStores.length})
        </div>

        {filteredStores.map((store) => {
          const isSelected = selectedStoreId === store.id;
          const [sx, , sz] = gpsTo3D(store.lat, store.lng);
          return (
            <div
              key={store.id}
              onClick={() => {
                onSelectStore(store);
                handleFlyTo(store);
              }}
              style={{
                background: isSelected
                  ? 'rgba(14, 116, 144, 0.35)'
                  : 'rgba(15, 23, 42, 0.65)',
                border: isSelected
                  ? '1.5px solid #38bdf8'
                  : '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '8px',
                padding: '10px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: store.brandColor || '#334155',
                    border: `1px solid ${store.accentColor || '#64748b'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Store size={15} color="#ffffff" />
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: isSelected ? '#38bdf8' : '#f8fafc',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {store.name}
                  </div>
                  <div
                    style={{
                      fontSize: '9.5px',
                      color: '#94a3b8',
                      fontFamily: 'monospace',
                      marginTop: '1px'
                    }}
                  >
                    {store.lat.toFixed(6)}, {store.lng.toFixed(6)} • [X: {sx}m, Z: {sz}m]
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: '#facc15'
                  }}
                >
                  <span>★</span>
                  <span>{store.rating.toFixed(1)}</span>
                </div>
                <div
                  style={{
                    fontSize: '8.5px',
                    textTransform: 'uppercase',
                    color: '#94a3b8',
                    background: 'rgba(255, 255, 255, 0.06)',
                    padding: '1px 5px',
                    borderRadius: '3px'
                  }}
                >
                  {store.category}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer Stats ── */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(2, 6, 23, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: '#94a3b8'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Compass size={12} color="#38bdf8" />
          <span>MARATHAHALLI JUNCTION (0, 0)</span>
        </div>
        <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>
          12.956840° N, 77.701176° E
        </span>
      </div>
    </div>
  );
};
