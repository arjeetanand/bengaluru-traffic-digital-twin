import React from 'react';
import { EffectComposer, Bloom, Vignette, ToneMapping, N8AO, ChromaticAberration } from '@react-three/postprocessing';
import {
  BLOOM_INTENSITY_DAY,
  BLOOM_INTENSITY_NIGHT,
  BLOOM_LUMINANCE_THRESHOLD,
  BLOOM_LUMINANCE_SMOOTHING
} from '../../config/location';

interface PostProcessingPipelineProps {
  isNight: boolean;
  isRaining: boolean;
}

// React 18 / TypeScript JSX typing adapter for @react-three/postprocessing wrapped effects
const SafeN8AO = N8AO as unknown as (props: {
  aoRadius?: number;
  intensity?: number;
  color?: string;
  distanceFalloff?: number;
  quality?: string;
}) => JSX.Element;

const SafeBloom = Bloom as unknown as (props: {
  intensity?: number;
  luminanceThreshold?: number;
  luminanceSmoothing?: number;
  mipmapBlur?: boolean;
}) => JSX.Element;

const SafeVignette = Vignette as unknown as (props: {
  eskil?: boolean;
  offset?: number;
  darkness?: number;
}) => JSX.Element;

const SafeToneMapping = ToneMapping as unknown as (props: Record<string, unknown>) => JSX.Element;

const SafeChromaticAberration = ChromaticAberration as unknown as (props: {
  offset?: [number, number];
  radialModulation?: boolean;
  modulationOffset?: number;
}) => JSX.Element;

const SafeEffectComposer = EffectComposer as unknown as React.FC<{
  disableNormalPass?: boolean;
  multisampling?: number;
  children: React.ReactNode;
}>;

export const PostProcessingPipeline: React.FC<PostProcessingPipelineProps> = ({
  isNight,
  isRaining
}) => {
  const bloomIntensity = isNight ? BLOOM_INTENSITY_NIGHT : BLOOM_INTENSITY_DAY;
  const vignetteDarkness = isNight ? 0.75 : (isRaining ? 0.65 : 0.45);

  return (
    <SafeEffectComposer disableNormalPass multisampling={0}>
      {/* Ambient Occlusion: soft contact shadows under flyovers, vehicles, and buildings
          aoRadius tuned for scene scale (0–300 world units): 4.5m gives realistic contact shadow */}
      <SafeN8AO
        aoRadius={4.5}
        intensity={1.2}
        color="#060a0e"
        distanceFalloff={1.0}
        quality="medium"
      />

      {/* Bloom: selective glow on headlights, traffic signals, streetlights, and illuminated windows */}
      <SafeBloom
        intensity={bloomIntensity}
        luminanceThreshold={BLOOM_LUMINANCE_THRESHOLD}
        luminanceSmoothing={BLOOM_LUMINANCE_SMOOTHING}
        mipmapBlur
      />

      {/* Vignette: cinematic corner falloff */}
      <SafeVignette
        eskil={false}
        offset={0.15}
        darkness={vignetteDarkness}
      />

      {/* Subtle Chromatic Aberration: realistic camera lens fringe at 1:1 pixel scale */}
      <SafeChromaticAberration
        offset={[0.00018, 0.00018]}
        radialModulation
        modulationOffset={0.65}
      />

      {/* Filmic Tone Mapping */}
      <SafeToneMapping />
    </SafeEffectComposer>
  );
};
