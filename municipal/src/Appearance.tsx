import { useEffect, useState } from 'react';
import { darkColors, lightColors } from '../../theme/colors';

type Preference = 'system' | 'light' | 'dark';
const key = 'fiscaliza-ai:appearance:v1';
const isPreference = (value: unknown): value is Preference =>
  value === 'system' || value === 'light' || value === 'dark';
function saved(): Preference {
  try {
    const value = localStorage.getItem(key);
    return isPreference(value) ? value : 'system';
  } catch {
    return 'system';
  }
}
function apply(preference: Preference) {
  const dark =
    preference === 'dark' ||
    (preference === 'system' &&
      matchMedia('(prefers-color-scheme: dark)').matches);
  const palette = dark ? darkColors : lightColors;
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  for (const [name, value] of Object.entries(palette)) {
    document.documentElement.style.setProperty(
      `--${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
      value,
    );
  }
}
// Set colors before the first React render, including the login screen.
apply(saved());

export function Appearance() {
  const [preference, setPreference] = useState<Preference>(saved);
  const [error, setError] = useState(false);
  useEffect(() => {
    apply(preference);
    const media = matchMedia('(prefers-color-scheme: dark)');
    const update = () => apply(preference);
    media.addEventListener('change', update);
    const sync = (event: StorageEvent) => {
      if (event.key === key)
        setPreference(isPreference(event.newValue) ? event.newValue : 'system');
    };
    window.addEventListener('storage', sync);
    return () => {
      media.removeEventListener('change', update);
      window.removeEventListener('storage', sync);
    };
  }, [preference]);
  return (
    <div className="appearance">
      <label htmlFor="appearance">Aparência</label>
      <select
        id="appearance"
        value={preference}
        onChange={(event) => {
          const next = event.target.value;
          if (!isPreference(next)) return;
          setPreference(next);
          try {
            localStorage.setItem(key, next);
            setError(false);
          } catch {
            setError(true);
          }
        }}
      >
        <option value="system">Sistema</option>
        <option value="light">Claro</option>
        <option value="dark">Escuro</option>
      </select>
      {error && (
        <small role="alert">A aparência mudou, mas não pôde ser salva.</small>
      )}
    </div>
  );
}
