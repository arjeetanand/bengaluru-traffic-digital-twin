import type { FC } from 'react';
import {
  Boxes,
  ClipboardCheck,
  Database,
  Globe2,
  MapPinned,
  ChevronDown
} from 'lucide-react';
import '../../styles/accuracyLegend.css';

export interface AccuracyLegendProps {
  cameraMode: 'walk' | 'overview';
}

const ACCURACY_ITEMS = [
  {
    label: 'SOURCE-BACKED',
    tone: 'source',
    description: 'OSM roads, crossings, signals, and building footprints.',
    Icon: Database
  },
  {
    label: 'MODELLED',
    tone: 'modelled',
    description: 'Vehicle fleet, signal timing, planting, and missing-link audit.',
    Icon: Boxes
  },
  {
    label: 'FIELD VERIFY',
    tone: 'verify',
    description: 'Footpath audit plus exact facade and elevation detail.',
    Icon: ClipboardCheck
  },
  {
    label: 'OPTIONAL PROVIDER',
    tone: 'provider',
    description: 'Google tiles or Sketchfab reference models can supplement the scene.',
    Icon: Globe2
  }
] as const;

const MODE_COPY = {
  walk: {
    label: 'WALK MODE',
    description: 'Eye-level inspection follows mapped roads and footpaths; it does not imply a surveyed facade or grade.'
  },
  overview: {
    label: 'OVERVIEW MODE',
    description: 'Bird view is best for comparing mapped geometry and corridor coverage; detailed heights remain indicative.'
  }
} as const;

export const AccuracyLegend: FC<AccuracyLegendProps> = ({ cameraMode }) => {
  const modeCopy = MODE_COPY[cameraMode];

  return (
    <aside className="accuracy-legend" aria-label="3D twin source accuracy legend">
      <details className="accuracy-legend__details" open>
        <summary className="accuracy-legend__summary">
          <span className="accuracy-legend__summary-icon" aria-hidden="true">
            <MapPinned size={15} strokeWidth={1.9} />
          </span>
          <span className="accuracy-legend__summary-copy">
            <span className="accuracy-legend__eyebrow">PROVENANCE KEY</span>
            <span className="accuracy-legend__title">SOURCE ACCURACY</span>
          </span>
          <span className="accuracy-legend__mode">{modeCopy.label}</span>
          <ChevronDown className="accuracy-legend__chevron" size={15} strokeWidth={1.9} aria-hidden="true" />
        </summary>

        <div className="accuracy-legend__body">
          <p className="accuracy-legend__intro">
            Read the scene by evidence level. A realistic-looking detail is not automatically survey-grade.
          </p>

          <ul className="accuracy-legend__list">
            {ACCURACY_ITEMS.map(({ label, tone, description, Icon }) => (
              <li className={`accuracy-legend__item accuracy-legend__item--${tone}`} key={label}>
                <span className="accuracy-legend__item-icon" aria-hidden="true">
                  <Icon size={14} strokeWidth={1.9} />
                </span>
                <span className="accuracy-legend__item-copy">
                  <span className="accuracy-legend__item-label">{label}</span>
                  <span className="accuracy-legend__item-description">{description}</span>
                </span>
              </li>
            ))}
          </ul>

          <p className="accuracy-legend__mode-note">
            <span className="accuracy-legend__mode-note-label">{modeCopy.label}</span>
            {modeCopy.description}
          </p>
        </div>
      </details>
    </aside>
  );
};
