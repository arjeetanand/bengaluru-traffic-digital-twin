import React from 'react';
import { X, MapPin, Activity, Gauge, Flame, Wind, Car, Shield } from 'lucide-react';
import { TrafficFlowData, SimulationMetrics, SignalStatus } from '../../types';
import { ACTIVE_CITY, ACTIVE_JUNCTION_NAME, ACTIVE_COORDINATES } from '../../config/location';

interface JunctionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  flowData: TrafficFlowData;
  metrics: SimulationMetrics;
  signalStatus: SignalStatus;
  vehicleCount: number;
  onVehicleCountChange: (count: number) => void;
}

export const JunctionDetailModal: React.FC<JunctionDetailModalProps> = ({
  isOpen,
  onClose,
  flowData,
  metrics,
  signalStatus,
  vehicleCount,
  onVehicleCountChange
}) => {
  if (!isOpen) return null;

  const speedPercent = Math.min(100, Math.round((flowData.currentSpeed / flowData.freeFlowSpeed) * 100));

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="junction-modal-title"
      onClick={onClose}
    >
      <div className="junction-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <MapPin size={18} className="text-cyan" />
            <div>
              <h3 id="junction-modal-title">{ACTIVE_JUNCTION_NAME}</h3>
              <span className="modal-sub">
                {ACTIVE_CITY} • {ACTIVE_COORDINATES.lat.toFixed(6)}, {ACTIVE_COORDINATES.lng.toFixed(6)}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close junction telemetry"
          >
            <X size={16} />
          </button>
        </div>

        {/* Live or modelled traffic flow telemetry */}
        <div className="modal-section">
          <div className="section-title">
            <Activity size={14} className="text-cyan" />
            <span>{flowData.isDemo ? 'MODELLED FLOW TELEMETRY (DEMO TWIN)' : 'LIVE FLOW TELEMETRY (TOMTOM LIVE)'}</span>
          </div>

          <div className="telemetry-grid">
            <div className="telemetry-card">
              <span className="telemetry-label">CURRENT SPEED</span>
              <div className="telemetry-value text-emerald">
                {flowData.currentSpeed} <span className="telemetry-unit">km/h</span>
              </div>
              <span className="telemetry-sub">{flowData.isDemo ? 'Modelled road velocity' : 'Live road velocity'}</span>
            </div>

            <div className="telemetry-card">
              <span className="telemetry-label">FREE FLOW SPEED</span>
              <div className="telemetry-value text-slate">
                {flowData.freeFlowSpeed} <span className="telemetry-unit">km/h</span>
              </div>
              <span className="telemetry-sub">Uncongested Benchmark</span>
            </div>

            <div className="telemetry-card">
              <span className="telemetry-label">SPEED RATIO</span>
              <div className="telemetry-value text-amber">
                {speedPercent}%
              </div>
              <span className="telemetry-sub">Capacity Efficiency</span>
            </div>

            <div className="telemetry-card">
              <span className="telemetry-label">TRAVEL TIME</span>
              <div className="telemetry-value text-sky">
                {Math.round(flowData.currentTravelTime / 60)}m {flowData.currentTravelTime % 60}s
              </div>
              <span className="telemetry-sub">Free Flow: {Math.round(flowData.freeFlowTravelTime / 60)}m</span>
            </div>
          </div>
        </div>

        {/* Traffic Signals & Flow Rate */}
        <div className="modal-section">
          <div className="section-title">
            <Gauge size={14} className="text-emerald" />
            <span>JUNCTION THROUGHPUT & SIGNALS</span>
          </div>

          <div className="telemetry-grid">
            <div className="telemetry-card">
              <span className="telemetry-label">AVERAGE FLOW RATE</span>
              <div className="telemetry-value text-cyan">
                {metrics.avgFlowPerHour.toLocaleString()} <span className="telemetry-unit">veh/hr</span>
              </div>
              <span className="telemetry-sub">Passage Volume</span>
            </div>

            <div className="telemetry-card">
              <span className="telemetry-label">AVG QUEUE DELAY</span>
              <div className="telemetry-value text-amber">
                {metrics.avgDelaySeconds} <span className="telemetry-unit">sec</span>
              </div>
              <span className="telemetry-sub">Per Vehicle Stopped</span>
            </div>

            <div className="telemetry-card">
              <span className="telemetry-label">SIGNAL PHASE</span>
              <div className="telemetry-value text-purple">
                {signalStatus.phase.replace('_', ' ')}
              </div>
              <span className="telemetry-sub">Next change in {signalStatus.timer}s</span>
            </div>

            <div className="telemetry-card">
              <span className="telemetry-label">ROAD CLOSURE</span>
              <div className="telemetry-value text-emerald">
                {flowData.roadClosure ? 'CLOSED' : 'OPEN'}
              </div>
              <span className="telemetry-sub">{flowData.isDemo ? 'Modelled road class' : `TomTom FRC: ${flowData.frc || 'FRC2'}`}</span>
            </div>
          </div>
        </div>

        {/* Environmental Footprint Estimates */}
        <div className="modal-section">
          <div className="section-title">
            <Flame size={14} className="text-amber" />
            <span>IDLING EMISSIONS (MODELLED ESTIMATE)</span>
          </div>

          <div className="telemetry-grid">
            <div className="telemetry-card">
              <span className="telemetry-label">EST. IDLING CO₂</span>
              <div className="telemetry-value text-amber">
                {metrics.idlingCO2KgHr} <span className="telemetry-unit">kg/hr</span>
              </div>
              <span className="telemetry-sub">Urban fleet idle factor</span>
            </div>

            <div className="telemetry-card">
              <span className="telemetry-label">EST. WASTED FUEL</span>
              <div className="telemetry-value text-rose">
                {metrics.fuelWastedLitersHr} <span className="telemetry-unit">L/hr</span>
              </div>
              <span className="telemetry-sub">Modelled idle burn</span>
            </div>

            <div className="telemetry-card">
              <span className="telemetry-label">AIR DISPERSION</span>
              <div className="telemetry-value text-slate">
                <Wind size={15} style={{ display: 'inline', marginRight: 4 }} />
                Normal
              </div>
              <span className="telemetry-sub">Boundary Layer Height</span>
            </div>

            <div className="telemetry-card">
              <span className="telemetry-label">DATA CONFIDENCE</span>
              <div className="telemetry-value text-emerald">
                <Shield size={14} style={{ display: 'inline', marginRight: 4 }} />
                {flowData.isDemo ? 'MODEL' : `${Math.round(flowData.confidence * 100)}%`}
              </div>
              <span className="telemetry-sub">{flowData.isDemo ? 'Scenario input quality' : 'Sensor feed reliability'}</span>
            </div>
          </div>
        </div>

        {/* Fleet Density Slider */}
        <div className="modal-section density-slider-section">
          <div className="section-title">
            <Car size={14} className="text-cyan" />
            <span>INSTANCED VEHICLE DENSITY ({vehicleCount} active)</span>
          </div>
          <div className="slider-container">
            <input
              type="range"
              min={800}
              max={2000}
              step={100}
              value={vehicleCount}
              onChange={(e) => onVehicleCountChange(Number(e.target.value))}
              className="density-slider"
            />
            <div className="slider-labels">
              <span>800 (Light)</span>
              <span>1,400 (Bengaluru Standard)</span>
              <span>2,000 (Peak Rush)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
