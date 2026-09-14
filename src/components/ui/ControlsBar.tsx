import React from 'react';
import {
  Moon,
  Sun,
  CloudRain,
  Cloud,
  Video,
  Play,
  FastForward,
  Zap,
  Radio,
  Sliders,
  Footprints,
  Building2
} from 'lucide-react';
import { SimulationMode } from '../../types';

interface ControlsBarProps {
  mode: SimulationMode;
  onUpdateMode: (updates: Partial<SimulationMode>) => void;
  isDemo: boolean;
  onToggleDemo: () => void;
  onOpenJunctionDetail: () => void;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  mode,
  onUpdateMode,
  isDemo,
  onToggleDemo,
  onOpenJunctionDetail
}) => {
  return (
    <div className="controls-bar-container">
      {/* ── Footpath Walkability Audit Toggle ── */}
      <button
        className={`control-btn ${mode.footpathAuditMode ? 'audit-active' : ''}`}
        onClick={() => onUpdateMode({ footpathAuditMode: !mode.footpathAuditMode })}
        title="Toggle Footpath Walkability Audit: Green (Paved), Red (Missing), Amber (Blocked/Encroached)"
      >
        <Footprints size={15} />
        <span>AUDIT PATHS</span>
      </button>

      {/* ── 3D Building Engine Toggle: Real OSM Digital Twin vs Google 3D Tiles ── */}
      <button
        className={`control-btn ${mode.buildingMode === 'google-tiles' ? 'active' : ''}`}
        onClick={() => {
          const next = mode.buildingMode === 'google-tiles' ? 'osm' : 'google-tiles';
          if (next === 'google-tiles' && !mode.googleMapsApiKey) {
            const entered = window.prompt(
              'Enter your Google Maps Platform API Key (with Map Tiles API enabled) to stream Google Photorealistic 3D Tiles:',
              mode.googleMapsApiKey || ''
            );
            if (entered) {
              onUpdateMode({ buildingMode: 'google-tiles', googleMapsApiKey: entered.trim() });
            }
          } else {
            onUpdateMode({ buildingMode: next });
          }
        }}
        title={
          mode.buildingMode === 'google-tiles'
            ? 'Active: Google Photorealistic 3D Tiles. Click to switch to OSM Digital Twin.'
            : 'Active: OSM 3D Digital Twin (Photographic Facades). Click to stream Google 3D Tiles.'
        }
      >
        <Building2 size={15} />
        <span>{mode.buildingMode === 'google-tiles' ? 'GOOGLE 3D TILES' : 'OSM 3D TWIN'}</span>
      </button>

      {/* ── Night Mode Toggle ── */}
      <button
        className={`control-btn ${mode.isNight ? 'active' : ''}`}
        onClick={() => onUpdateMode({ isNight: !mode.isNight })}
        title={mode.isNight ? 'Switch to Golden Hour Day' : 'Switch to Night View'}
      >
        {mode.isNight ? <Moon size={15} /> : <Sun size={15} />}
        <span>{mode.isNight ? 'NIGHT' : 'DAY'}</span>
      </button>

      {/* ── Rain Simulation Toggle ── */}
      <button
        className={`control-btn ${mode.isRaining ? 'active' : ''}`}
        onClick={() => onUpdateMode({ isRaining: !mode.isRaining })}
        title={mode.isRaining ? 'Clear Weather' : 'Simulate Rain & Wet Roads'}
      >
        {mode.isRaining ? <CloudRain size={15} /> : <Cloud size={15} />}
        <span>{mode.isRaining ? 'RAIN' : 'CLEAR'}</span>
      </button>

      {/* ── Cinematic Auto-Orbit Toggle ── */}
      <button
        className={`control-btn ${mode.isCinematic ? 'active' : ''}`}
        onClick={() => onUpdateMode({ isCinematic: !mode.isCinematic })}
        title="Toggle automatic cinematic camera rotation"
      >
        <Video size={15} />
        <span>CINEMATIC</span>
      </button>

      {/* ── Camera View Angle Presets (Corridors & Landmarks) ── */}
      <div className="btn-group">
        {(['overview', 'crossover', 'multiplex', 'kalamandir', 'spicegarden', 'underpass'] as const).map((preset) => (
          <button
            key={preset}
            className={`group-item ${mode.cameraPreset === preset ? 'active' : ''}`}
            onClick={() => onUpdateMode({ cameraPreset: preset })}
            title={`Switch to ${preset} view`}
          >
            {preset === 'spicegarden' ? 'SPICE GARDEN' : preset.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── Simulation Speed 1x / 10x / 60x ── */}
      <div className="btn-group">
        <button
          className={`group-item ${mode.simSpeed === 1 ? 'active' : ''}`}
          onClick={() => onUpdateMode({ simSpeed: 1 })}
          title="Real-time 1x speed"
        >
          <Play size={11} />
          <span>1×</span>
        </button>
        <button
          className={`group-item ${mode.simSpeed === 10 ? 'active' : ''}`}
          onClick={() => onUpdateMode({ simSpeed: 10 })}
          title="Accelerated 10x speed"
        >
          <FastForward size={11} />
          <span>10×</span>
        </button>
        <button
          className={`group-item ${mode.simSpeed === 60 ? 'active' : ''}`}
          onClick={() => onUpdateMode({ simSpeed: 60 })}
          title="High-speed stress test 60x speed"
        >
          <Zap size={11} />
          <span>60×</span>
        </button>
      </div>

      {/* ── Live / Demo Toggle ── */}
      <button
        className={`control-btn live-toggle-btn ${!isDemo ? 'active-live' : 'active-demo'}`}
        onClick={onToggleDemo}
        title="Toggle between Live TomTom API data and Baked Demo Traffic"
      >
        <Radio size={14} className={!isDemo ? 'pulse-live' : ''} />
        <span>{!isDemo ? 'LIVE TOMTOM' : 'DEMO MODE'}</span>
      </button>

      {/* ── Inspect Junction Button ── */}
      <button
        className="control-btn inspect-btn"
        onClick={onOpenJunctionDetail}
        title="Open detailed telemetry for Marathahalli junction"
      >
        <Sliders size={14} />
        <span>INSPECT</span>
      </button>
    </div>
  );
};
