import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { Problem } from '@/data/mockData';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// Referência legada das fixtures. As telas ativas usam o município da sessão.
export const DEFAULT_VILA_ESPERANCA_REGION: MapRegion = {
  latitude: -22.903,
  longitude: -43.185,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

export function useMapRegion(problems: Problem[] = []) {
  const [region, setRegion] = useState<MapRegion>(() => {
    if (problems.length > 0 && problems[0].location) {
      return {
        latitude: problems[0].location.latitude,
        longitude: problems[0].location.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      };
    }
    return DEFAULT_VILA_ESPERANCA_REGION;
  });

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<
    'undetermined' | 'granted' | 'denied'
  >('undetermined');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const requestPermissionAndLocate = useCallback(async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setPermissionStatus('granted');
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setUserLocation(coords);
        return coords;
      } else {
        setPermissionStatus('denied');
        return null;
      }
    } catch {
      setPermissionStatus('denied');
      return null;
    } finally {
      setIsLoadingLocation(false);
    }
  }, []);

  const centerOnUser = useCallback(async () => {
    if (userLocation) {
      setRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      return;
    }

    const coords = await requestPermissionAndLocate();
    if (coords) {
      setRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [userLocation, requestPermissionAndLocate]);

  const centerOnTerritory = useCallback(() => {
    setRegion(DEFAULT_VILA_ESPERANCA_REGION);
  }, []);

  return {
    region,
    setRegion,
    userLocation,
    permissionStatus,
    isLoadingLocation,
    centerOnUser,
    centerOnTerritory,
    requestPermissionAndLocate,
  };
}
