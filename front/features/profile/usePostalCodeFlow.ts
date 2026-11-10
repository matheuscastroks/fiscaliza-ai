import { useCallback, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { confirmMunicipality, lookupPostalCode, onlyDigits } from '@/services/postalCode';
import type { PostalCodeLookup } from '@/shared/contracts';

/**
 * Fluxo único de CEP → município, usado pela tela de município e pela sheet do perfil.
 * Respostas antigas são descartadas por versão; a API continua sendo a autoridade.
 */
export function usePostalCodeFlow(initial = '') {
  const acceptProfile = useAuthStore((state) => state.acceptProfile);
  const [postalCode, setPostalCode] = useState(initial);
  const [lookup, setLookup] = useState<PostalCodeLookup | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const version = useRef(0);
  const digits = onlyDigits(postalCode);

  const reset = useCallback((nextPostalCode?: string) => {
    version.current += 1;
    if (nextPostalCode !== undefined) setPostalCode(nextPostalCode);
    setLookup(null);
    setError('');
    setBusy(false);
  }, []);

  const search = useCallback(async () => {
    if (digits.length !== 8 || busy || saving) return;
    const current = ++version.current;
    setBusy(true);
    setError('');
    setLookup(null);
    try {
      const result = await lookupPostalCode(digits);
      if (current === version.current) setLookup(result);
    } catch (caught) {
      if (current === version.current)
        setError(
          caught instanceof Error
            ? caught.message
            : 'Não foi possível consultar o CEP. Verifique os dígitos e tente novamente.',
        );
    } finally {
      if (current === version.current) setBusy(false);
    }
  }, [digits, busy, saving]);

  /** Devolve true quando o perfil foi atualizado; falhas ficam em `error`. */
  const confirm = useCallback(async () => {
    if (!lookup || saving) return false;
    setSaving(true);
    setError('');
    const sessionVersion = useAuthStore.getState().sessionVersion;
    try {
      const profile = await confirmMunicipality(lookup);
      return await acceptProfile(profile, sessionVersion);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível confirmar. Seu município não foi alterado.',
      );
      return false;
    } finally {
      setSaving(false);
    }
  }, [lookup, saving, acceptProfile]);

  return { postalCode, setPostalCode, digits, lookup, busy, saving, error, search, confirm, reset };
}
