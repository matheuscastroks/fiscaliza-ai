import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { create } from 'zustand';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ThemeMode = 'light' | 'dark';
export const THEME_STORAGE_KEY = 'fiscaliza-ai:appearance:v1';

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function resolveThemeMode(
  preference: ThemePreference,
  system: ThemeMode,
): ThemeMode {
  return preference === 'system' ? system : preference;
}

interface ThemeState {
  preference: ThemePreference;
  systemMode: ThemeMode;
  hydrated: boolean;
  persistenceError: string | null;
  initialize: () => Promise<void>;
  setPreference: (preference: ThemePreference) => Promise<void>;
}

let initialization: Promise<void> | undefined;
let revision = 0;
let writes: Promise<void> = Promise.resolve();

export const useThemeStore = create<ThemeState>((set) => ({
  preference: 'system',
  systemMode: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
  hydrated: false,
  persistenceError: null,
  initialize: () => {
    if (initialization) return initialization;
    const startedRevision = revision;
    // Keep the OS preference intact: forcing Appearance would hide system changes.
    Appearance.addChangeListener(({ colorScheme }) => {
      set({ systemMode: colorScheme === 'dark' ? 'dark' : 'light' });
    });
    set({
      systemMode: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
    });
    initialization = (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        // A user action during hydration always wins over the previously saved value.
        if (revision === startedRevision && isThemePreference(saved)) {
          set({ preference: saved });
        }
      } catch {
        set({
          persistenceError: 'Não foi possível carregar a aparência salva.',
        });
      } finally {
        set({ hydrated: true });
      }
    })();
    return initialization;
  },
  setPreference: async (preference) => {
    if (!isThemePreference(preference)) return;
    const currentRevision = ++revision;
    set({ preference, persistenceError: null });
    // Serialize writes so rapid selections cannot restore an older value on restart.
    writes = writes
      .catch(() => undefined)
      .then(async () => {
        try {
          await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
          if (revision === currentRevision) set({ persistenceError: null });
        } catch {
          if (revision === currentRevision) {
            set({
              persistenceError:
                'A aparência mudou nesta sessão, mas não pôde ser salva. Toque na opção para tentar novamente.',
            });
          }
        }
      });
    await writes;
  },
}));
