import { useEffect, useRef, type RefObject } from 'react';
import { circleBounds, type circleFeature } from './mapArea';

type Camera = {
  setCamera(config: { centerCoordinate: number[]; zoomLevel: number; animationDuration: number }): void;
  fitBounds(ne: number[], sw: number[], padding: number[], duration: number): void;
};
type Target = { latitude: number; longitude: number; zoom: number };

export function useMapCamera(camera: RefObject<Camera | null>, target: Target, circle: ReturnType<typeof circleFeature>, fit: boolean, captureKey?: number) {
  const lastTarget = useRef(target);
  const lastFit = useRef<{ circle: typeof circle; captureKey?: number } | null>(null);
  const { latitude, longitude, zoom } = target;
  useEffect(() => {
    const last = lastTarget.current;
    lastTarget.current = { latitude, longitude, zoom };
    // A new area wins over its accompanying region update, then explicit zooms work normally.
    if (fit && circle && (lastFit.current?.circle !== circle || lastFit.current?.captureKey !== captureKey)) return;
    if (Math.abs(latitude - last.latitude) < 0.0001 && Math.abs(longitude - last.longitude) < 0.0001 && Math.abs(zoom - last.zoom) < 0.2) return;
    camera.current?.setCamera({ centerCoordinate: [longitude, latitude], zoomLevel: zoom, animationDuration: 350 });
  }, [camera, latitude, longitude, zoom, fit, circle, captureKey]);
  useEffect(() => {
    if (!fit || !circle) { lastFit.current = null; return; }
    const bounds = circleBounds(circle);
    camera.current?.fitBounds(bounds.northEast, bounds.southWest, [176, 32, 164, 32], 350);
    lastFit.current = { circle, captureKey };
  }, [camera, fit, circle, captureKey]);
}
