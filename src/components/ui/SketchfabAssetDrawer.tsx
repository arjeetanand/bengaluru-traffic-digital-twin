import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  Layers3,
  ShieldCheck,
  X
} from 'lucide-react';
import {
  getSketchfabAsset,
  SKETCHFAB_ASSETS,
  SketchfabAsset
} from '../../data/sketchfabAssets';
import '../../styles/sketchfabAssetDrawer.css';

export interface SketchfabAssetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAssetId?: string;
  onSelectAsset?: (asset: SketchfabAsset) => void;
}

type EmbedState = 'loading' | 'ready' | 'error';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), a[href], iframe, [tabindex]:not([tabindex="-1"])'
  ));
}

function getInitialAssetId(): string {
  return SKETCHFAB_ASSETS[0]?.id ?? '';
}

function getCategoryClass(category: SketchfabAsset['category']): string {
  return `sketchfab-asset-card--${category}`;
}

export const SketchfabAssetDrawer: React.FC<SketchfabAssetDrawerProps> = ({
  isOpen,
  onClose,
  selectedAssetId,
  onSelectAsset
}) => {
  const [internalSelectedAssetId, setInternalSelectedAssetId] = useState(getInitialAssetId);
  const [embedStates, setEmbedStates] = useState<Record<string, EmbedState>>({});
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const activeAssetId = selectedAssetId ?? internalSelectedAssetId;
  const selectedAsset = useMemo(
    () => getSketchfabAsset(activeAssetId) ?? SKETCHFAB_ASSETS[0],
    [activeAssetId]
  );

  useEffect(() => {
    if (!isOpen) {
      previouslyFocusedRef.current?.focus();
      previouslyFocusedRef.current = null;
      return undefined;
    }

    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusableElements = getFocusableElements(drawerRef.current);
      if (focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSelectAsset = useCallback((asset: SketchfabAsset) => {
    if (selectedAssetId === undefined) {
      setInternalSelectedAssetId(asset.id);
    }
    onSelectAsset?.(asset);
  }, [onSelectAsset, selectedAssetId]);

  const handleEmbedLoad = useCallback((assetId: string) => {
    setEmbedStates((current) => ({ ...current, [assetId]: 'ready' }));
  }, []);

  const handleEmbedError = useCallback((assetId: string) => {
    setEmbedStates((current) => ({ ...current, [assetId]: 'error' }));
  }, []);

  if (!isOpen || !selectedAsset) return null;

  const selectedEmbedState = embedStates[selectedAsset.id] ?? 'loading';

  return (
    <div className="sketchfab-drawer-layer">
      <button
        type="button"
        className="sketchfab-drawer-backdrop"
        onClick={onClose}
        aria-label="Close Sketchfab asset library"
        tabIndex={-1}
      />

      <aside
        ref={drawerRef}
        className="sketchfab-asset-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sketchfab-drawer-title"
        aria-describedby="sketchfab-drawer-description"
      >
        <header className="sketchfab-drawer__header">
          <div className="sketchfab-drawer__heading-group">
            <div className="sketchfab-drawer__eyebrow">
              <span className="sketchfab-drawer__signal" aria-hidden="true" />
              <span>REFERENCE ASSET LIBRARY</span>
              <span className="sketchfab-drawer__eyebrow-count">04 MODELS</span>
            </div>
            <h2 id="sketchfab-drawer-title">Sketchfab / 3D references</h2>
            <p id="sketchfab-drawer-description">
              Curated open-license references for the Bengaluru traffic twin.
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="sketchfab-drawer__close"
            onClick={onClose}
            aria-label="Close Sketchfab asset library"
            title="Close asset library"
          >
            <X size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </header>

        <div className="sketchfab-drawer__content">
          <section className="sketchfab-drawer__preview" aria-labelledby="sketchfab-preview-title">
            <div className="sketchfab-drawer__section-heading">
              <div>
                <span className="sketchfab-drawer__section-kicker">ACTIVE PREVIEW</span>
                <h3 id="sketchfab-preview-title">{selectedAsset.name}</h3>
              </div>
              <span className={`sketchfab-drawer__state sketchfab-drawer__state--${selectedEmbedState}`}>
                <span className="sketchfab-drawer__state-dot" aria-hidden="true" />
                {selectedEmbedState === 'error' ? 'LINK READY' : selectedEmbedState === 'ready' ? 'EMBED READY' : 'LOADING'}
              </span>
            </div>

            <div className="sketchfab-drawer__embed-frame">
              {selectedEmbedState === 'error' ? (
                <div className="sketchfab-drawer__embed-fallback" role="status">
                  <div className="sketchfab-drawer__fallback-icon" aria-hidden="true">
                    <ExternalLink size={20} strokeWidth={1.6} />
                  </div>
                  <strong>Preview unavailable in this session</strong>
                  <p>Open the attributed model page to inspect the full 3D asset.</p>
                  <a
                    className="sketchfab-drawer__primary-link"
                    href={selectedAsset.sketchfabUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open on Sketchfab
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                </div>
              ) : (
                <iframe
                  key={selectedAsset.id}
                  className="sketchfab-drawer__embed"
                  src={selectedAsset.embedUrl}
                  title={`${selectedAsset.name} 3D preview`}
                  allow="autoplay; fullscreen; xr-spatial-tracking; web-share"
                  allowFullScreen
                  frameBorder="0"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  onLoad={() => handleEmbedLoad(selectedAsset.id)}
                  onError={() => handleEmbedError(selectedAsset.id)}
                />
              )}
            </div>

            <div className="sketchfab-drawer__preview-meta">
              <div className="sketchfab-drawer__preview-title-row">
                <span className={`sketchfab-drawer__category-badge ${getCategoryClass(selectedAsset.category)}`}>
                  {selectedAsset.categoryLabel}
                </span>
                <span className="sketchfab-drawer__uid">UID {selectedAsset.uid.slice(0, 8)}…</span>
              </div>
              <p>{selectedAsset.description}</p>
              <span className="sketchfab-drawer__usage-note">
                <ShieldCheck size={13} aria-hidden="true" />
                {selectedAsset.usageNote}
              </span>
              <a
                className="sketchfab-drawer__primary-link sketchfab-drawer__preview-link"
                href={selectedAsset.sketchfabUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open on Sketchfab
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            </div>
          </section>

          <section className="sketchfab-drawer__registry" aria-labelledby="sketchfab-registry-title">
            <div className="sketchfab-drawer__section-heading sketchfab-drawer__section-heading--registry">
              <div>
                <span className="sketchfab-drawer__section-kicker">CURATED REGISTRY</span>
                <h3 id="sketchfab-registry-title">Select a reference</h3>
              </div>
              <span className="sketchfab-drawer__registry-status">
                <Layers3 size={13} aria-hidden="true" />
                {SKETCHFAB_ASSETS.length} AVAILABLE
              </span>
            </div>

            <div className="sketchfab-drawer__cards" role="list">
              {SKETCHFAB_ASSETS.map((asset, index) => {
                const isSelected = asset.id === selectedAsset.id;
                return (
                  <div className="sketchfab-asset-card-wrap" key={asset.id} role="listitem">
                    <button
                      type="button"
                      className={`sketchfab-asset-card ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => handleSelectAsset(asset)}
                      aria-pressed={isSelected}
                      aria-label={`${isSelected ? 'Selected' : 'Select'} ${asset.name}`}
                    >
                      <span className={`sketchfab-asset-card__index ${getCategoryClass(asset.category)}`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="sketchfab-asset-card__copy">
                        <span className="sketchfab-asset-card__topline">
                          <span>{asset.categoryLabel}</span>
                          {isSelected ? <CheckCircle2 size={14} aria-hidden="true" /> : <Box size={14} aria-hidden="true" />}
                        </span>
                        <strong>{asset.name}</strong>
                        <span className="sketchfab-asset-card__creator">BY {asset.creator.toUpperCase()}</span>
                      </span>
                      <span className="sketchfab-asset-card__chevron" aria-hidden="true">›</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="sketchfab-drawer__attribution" aria-labelledby="sketchfab-attribution-title">
            <div className="sketchfab-drawer__section-heading sketchfab-drawer__section-heading--compact">
              <div>
                <span className="sketchfab-drawer__section-kicker">SOURCE + LICENSE</span>
                <h3 id="sketchfab-attribution-title">{selectedAsset.creator}</h3>
              </div>
              <FileCheck2 size={16} aria-hidden="true" />
            </div>
            <div className="sketchfab-drawer__credit-row">
              <span>CREATOR</span>
              <strong>{selectedAsset.creator}</strong>
            </div>
            <div className="sketchfab-drawer__credit-row">
              <span>LICENSE</span>
              <a href={selectedAsset.license.url} target="_blank" rel="noopener noreferrer">
                {selectedAsset.license.label}
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            </div>
            <div className="sketchfab-drawer__credit-row">
              <span>MODEL PAGE</span>
              <a href={selectedAsset.sketchfabUrl} target="_blank" rel="noopener noreferrer">
                View on Sketchfab
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            </div>
          </section>

          <p className="sketchfab-drawer__disclaimer">
            <ShieldCheck size={13} aria-hidden="true" />
            Open-license visual references only. Corridor geometry, roads, signals, and landmarks remain modelled or source-backed separately.
          </p>
        </div>
      </aside>
    </div>
  );
};
