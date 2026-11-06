import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { captureDeviceLocation } from './deviceLocation';
import { fetchTerritoryLocation } from '@/services/publicData';
import { usePlacesStore } from '@/stores/placesStore';

export function useDeviceLocation() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestScope, setRequestScope] = useState('');
  const controller = useRef<AbortController | null>(null);
  const scope = usePlacesStore((s) => `${s.userId}:${s.municipalityId}`);
  useEffect(() => () => { controller.current?.abort(); controller.current = null; }, [scope]);
  const captureLocation = async (adopt = true) => {
    if (controller.current) return null;
    const abort = new AbortController(); controller.current = abort;
    const initial = usePlacesStore.getState();
    setRequestScope(scope); setBusy(true); setError(null);
    try {
      const point = await captureDeviceLocation({
        hasServicesEnabledAsync: Location.hasServicesEnabledAsync,
        requestForegroundPermissionsAsync: Location.requestForegroundPermissionsAsync,
        getCurrentPositionAsync: () => Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      }, abort.signal);
      const capturedScope = usePlacesStore.getState();
      if (abort.signal.aborted || capturedScope.userId !== initial.userId || capturedScope.municipalityId !== initial.municipalityId) return null;
      capturedScope.recordDeviceLocation(point);
      if (adopt && capturedScope.selection !== initial.selection) return null;
      const territory = await fetchTerritoryLocation(point, abort.signal);
      const current = usePlacesStore.getState();
      if (abort.signal.aborted || current.userId !== initial.userId || current.municipalityId !== initial.municipalityId || (adopt && current.selection !== initial.selection)) return null;
      if (!territory.insideMunicipality) throw Error('Sua posição está fora do Rio de Janeiro. Escolha um bairro ou outro lugar.');
      if (adopt) current.setCurrentLocation(point, territory.neighborhood);
      return { ...point, neighborhood: territory.neighborhood };
    } catch (e) {
      if (!abort.signal.aborted) setError(e instanceof Error ? e.message : 'Não foi possível obter sua localização.');
      return null;
    } finally {
      if (controller.current === abort) { controller.current = null; setBusy(false); }
    }
  };
  return { captureLocation, busy: requestScope === scope && busy, error: requestScope === scope ? error : null };
}
