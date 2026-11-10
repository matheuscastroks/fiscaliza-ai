import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { restoreSelection, validatePlace } from '../features/places/selection';
import type { CapturedDeviceLocation, Neighborhood, RadiusMeters, SavedPlace, TerritorySelection } from '../features/places/types';
import { DEFAULT_MUNICIPALITY_ID } from '@/features/city/municipalityId';
import { createWriteQueue } from './scopedPersistence';

export const placesStorageKey = (userId: string | null, municipalityId: string) =>
  `fiscaliza-ai:places:${userId || 'anonymous'}:${municipalityId}:v1`;
type DraftPlace = Omit<SavedPlace, 'id'>;
type Snapshot = { places: SavedPlace[]; selection: TerritorySelection; currentRadius: RadiusMeters; promptSeen: boolean };
interface PlacesState extends Snapshot {
  deviceLocation: CapturedDeviceLocation | null;
  recordDeviceLocation: (point: CapturedDeviceLocation) => void;
  userId: string | null; municipalityId: string; hydrated: boolean; busy: boolean; error: string | null; notice: string | null;
  setScope: (userId: string | null, municipalityId: string, defaultNeighborhood?: string) => Promise<void>;
  createPlace: (place: DraftPlace) => Promise<boolean>;
  updatePlace: (id: string, place: DraftPlace) => Promise<boolean>;
  deletePlace: (id: string) => Promise<boolean>;
  selectPlace: (id: string) => Promise<boolean>;
  selectNeighborhood: (name: string, id?: string) => Promise<boolean>;
  setRadius: (radius: RadiusMeters) => Promise<boolean>;
  setCurrentLocation: (point: CapturedDeviceLocation, neighborhood: Neighborhood | null) => void;
  dismissPrompt: () => Promise<boolean>;
}
const empty = (): Snapshot => ({ places: [], selection: { kind: 'municipality' }, currentRadius: 1000, promptSeen: false });
let generation = 0;
let initialization: Promise<void> | undefined;
const enqueueWrite = createWriteQueue();
const normalizeCapture = (point: CapturedDeviceLocation): CapturedDeviceLocation => ({ ...point,
  accuracyMeters: point.accuracyMeters != null && Number.isFinite(point.accuracyMeters) && point.accuracyMeters >= 0 ? point.accuracyMeters : null,
});
function persisted(snapshot: Snapshot) {
  return { version: 1, places: snapshot.places, currentRadius: snapshot.currentRadius, promptSeen: snapshot.promptSeen,
    selection: snapshot.selection.kind === 'radius' && snapshot.selection.source === 'current' ? { kind: 'pending-current', radiusMeters: snapshot.selection.radiusMeters } : snapshot.selection };
}
export const usePlacesStore = create<PlacesState>((set, get) => {
  const save = (change: (state: PlacesState) => Snapshot): Promise<boolean> => {
    const scope = generation;
    const key = placesStorageKey(get().userId, get().municipalityId);
    return enqueueWrite(async () => {
      if (scope !== generation) return false;
      // Nunca grava antes de ler o armazenamento: evita apagar lugares salvos.
      if (initialization) await initialization;
      if (scope !== generation) return false;
      set({ busy: true, error: null });
      try {
        const previous = get();
        const next = change(previous);
        try { await AsyncStorage.setItem(key, JSON.stringify(persisted(next))); }
        catch { throw Error('Não conseguimos salvar neste celular. Tente de novo.'); }
        if (scope !== generation) return false;
        let selection = get().selection !== previous.selection ? get().selection : next.selection;
        if (selection.kind === 'radius' && selection.source === 'current' && next.currentRadius !== previous.currentRadius) {
          selection = { ...selection, radiusMeters: next.currentRadius };
        }
        set({ ...next, selection, deviceLocation: get().deviceLocation, busy: false });
        return true;
      } catch (error) {
        if (scope === generation) set({ busy: false, error: error instanceof Error ? error.message : 'Não conseguimos salvar. Tente de novo.' });
        return false;
      }
    });
  };
  const edit = (id: string | undefined, draft: DraftPlace) => save((state) => {
    const error = validatePlace(draft);
    if (error) throw Error(error);
    const place = { ...draft, id: id || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`, name: draft.name.trim(), addressLabel: draft.addressLabel.trim() };
    if (id && !state.places.some((p) => p.id === id)) throw Error('Lugar não encontrado. Volte à lista.');
    const places = id ? state.places.map((p) => p.id === id ? place : p) : [...state.places, place];
    const selection = state.selection.kind === 'radius' && state.selection.placeId === id && id
      ? { ...state.selection, ...place } : state.selection;
    return { ...state, places, selection };
  });
  return {
    ...empty(), deviceLocation: null, userId: null, municipalityId: DEFAULT_MUNICIPALITY_ID, hydrated: false, busy: false, error: null, notice: null,
    recordDeviceLocation: (point) => set({ deviceLocation: normalizeCapture(point) }),
    setScope(userId, municipalityId, defaultNeighborhood = '') {
      if (get().userId === userId && get().municipalityId === municipalityId && initialization) return initialization;
      const scope = ++generation;
      set({ ...empty(), deviceLocation: null, userId, municipalityId, hydrated: false, busy: false, error: null, notice: null });
      initialization = (async () => {
        try {
          const raw = await AsyncStorage.getItem(placesStorageKey(userId, municipalityId));
          let snapshot = empty();
          if (raw) {
            const value = JSON.parse(raw);
            if (value.version !== 1 || !Array.isArray(value.places)) throw Error('Formato de lugares inválido.');
            const places = value.places.filter((p: SavedPlace) => p && typeof p.id === 'string' && typeof p.name === 'string' && typeof p.addressLabel === 'string' && !validatePlace(p) && (p.neighborhood === null || (typeof p.neighborhood?.id === 'string' && typeof p.neighborhood?.name === 'string')));
            snapshot = { places, selection: restoreSelection(value.selection, places), currentRadius: [500, 1000, 2000, 5000].includes(value.currentRadius) ? value.currentRadius : 1000, promptSeen: value.promptSeen === true };
          } else {
            const legacyKey = userId ? `fiscaliza-ai:region:${userId}:${municipalityId}:v1` : municipalityId === DEFAULT_MUNICIPALITY_ID ? `fiscaliza-ai:region:${DEFAULT_MUNICIPALITY_ID}:v1` : '';
            const legacyRaw = legacyKey ? await AsyncStorage.getItem(legacyKey) : null;
            const legacy = legacyRaw ? JSON.parse(legacyRaw) : null;
            const name = typeof legacy?.neighborhood === 'string' ? legacy.neighborhood : defaultNeighborhood;
            if (name) snapshot.selection = { kind: 'neighborhood', name };
          }
          if (scope === generation) set(snapshot);
        } catch {
          if (scope === generation) set({ error: 'Não conseguimos ler seus lugares neste celular. Tente de novo.' });
        } finally { if (scope === generation) set({ hydrated: true }); }
      })();
      return initialization;
    },
    createPlace: (draft) => edit(undefined, draft),
    updatePlace: (id, draft) => edit(id, draft),
    deletePlace: (id) => save((state) => {
      const active = state.selection.kind === 'radius' && state.selection.placeId === id;
      const neighborhood = state.selection.kind === 'radius' ? state.selection.neighborhood : null;
      return { ...state, places: state.places.filter((p) => p.id !== id), selection: active ? neighborhood ? { kind: 'neighborhood', ...neighborhood } : { kind: 'municipality' } : state.selection };
    }).then((ok) => { if (ok) set({ notice: 'Lugar apagado. Confira a área que está em uso.' }); return ok; }),
    selectPlace: (id) => save((state) => {
      const place = state.places.find((p) => p.id === id);
      if (!place) throw Error('Lugar não encontrado.');
      return { ...state, selection: { kind: 'radius', source: 'place', placeId: id, ...place } };
    }),
    selectNeighborhood: (name, id) => save((state) => ({ ...state, selection: name ? { kind: 'neighborhood', name, id } : { kind: 'municipality' } })),
    setRadius: (radiusMeters) => save((state) => {
      if (![500, 1000, 2000, 5000].includes(radiusMeters)) throw Error('Escolha uma distância da lista.');
      const selection = state.selection.kind === 'radius' || state.selection.kind === 'pending-current' ? { ...state.selection, radiusMeters } : state.selection;
      return { ...state, selection, currentRadius: selection.kind === 'pending-current' || (selection.kind === 'radius' && selection.source === 'current') ? radiusMeters : state.currentRadius,
        places: state.places.map((p) => selection.kind === 'radius' && selection.placeId === p.id ? { ...p, radiusMeters } : p) };
    }),
    setCurrentLocation: (point, neighborhood) => {
      const captured = normalizeCapture(point);
      set((state) => ({ deviceLocation: captured, selection: { kind: 'radius', source: 'current', ...captured, radiusMeters: state.currentRadius, neighborhood } }));
      void save((state) => state);
    },
    dismissPrompt: () => save((state) => ({ ...state, promptSeen: true })),
  };
});
