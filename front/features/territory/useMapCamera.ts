import { useEffect, useRef, type RefObject } from 'react';
import { circleBounds, type circleFeature } from './mapArea';

type Camera = {
  setCamera(config: { centerCoordinate: number[]; zoomLevel: number; animationDuration: number }): void;
  fitBounds(ne: number[], sw: number[], padding: number[], duration: number): void;
};
/** Caixa [lng, lat] que a câmera deve enquadrar; um objeto novo pede novo enquadramento. */
export type CameraBounds = { northEast: [number, number]; southWest: [number, number] };
type Target = { latitude: number; longitude: number; zoom: number; bounds?: CameraBounds };
/** [topo, direita, base, esquerda] em pontos: área do mapa livre de barras e botões. */
export type CameraPadding = [number, number, number, number];

const DEFAULT_PADDING: CameraPadding = [176, 32, 164, 32];

export function useMapCamera(
  camera: RefObject<Camera | null>,
  target: Target,
  circle: ReturnType<typeof circleFeature>,
  fit: boolean,
  captureKey?: number,
  padding: CameraPadding = DEFAULT_PADDING,
) {
  const lastTarget = useRef(target);
  const lastFit = useRef<{ circle: typeof circle; captureKey?: number } | null>(null);
  const lastBounds = useRef<CameraBounds | undefined>(undefined);
  const paddingRef = useRef(padding);
  // O recuo muda com a altura das barras, mas sozinho não deve mover a câmera.
  useEffect(() => { paddingRef.current = padding; }, [padding]);
  const { latitude, longitude, zoom, bounds } = target;
  useEffect(() => {
    const last = lastTarget.current;
    lastTarget.current = { latitude, longitude, zoom, bounds };
    // A new area wins over its accompanying region update, then explicit zooms work normally.
    if (fit && circle && (lastFit.current?.circle !== circle || lastFit.current?.captureKey !== captureKey)) return;
    if (bounds && bounds !== lastBounds.current) {
      lastBounds.current = bounds;
      camera.current?.fitBounds(bounds.northEast, bounds.southWest, paddingRef.current, 350);
      return;
    }
    if (Math.abs(latitude - last.latitude) < 0.0001 && Math.abs(longitude - last.longitude) < 0.0001 && Math.abs(zoom - last.zoom) < 0.2) return;
    camera.current?.setCamera({ centerCoordinate: [longitude, latitude], zoomLevel: zoom, animationDuration: 350 });
  }, [camera, latitude, longitude, zoom, bounds, fit, circle, captureKey]);
  useEffect(() => {
    if (!fit || !circle) { lastFit.current = null; return; }
    const area = circleBounds(circle);
    camera.current?.fitBounds(area.northEast, area.southWest, paddingRef.current, 350);
    lastFit.current = { circle, captureKey };
  }, [camera, fit, circle, captureKey]);
}
