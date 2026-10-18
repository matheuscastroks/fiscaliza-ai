import { goBack } from '@/utils/navigation';
import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { QueryState } from '@/features/city/CityUI';
import { request } from '@/services/http';
export default function RelatedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    let active = true;
    const find = async () => {
      try {
        try {
          await request('/civic-items/' + encodeURIComponent(id));
          if (active)
            router.replace({ pathname: '/CivicDetailsScreen', params: { id } });
        } catch (first) {
          if (first instanceof Error && /conexão/.test(first.message))
            throw first;
          await request('/occurrences/' + encodeURIComponent(id));
          if (active)
            router.replace({
              pathname: '/ProblemDetailsScreen',
              params: { id },
            });
        }
      } catch (e) {
        if (active)
          setError(
            e instanceof Error ? e : new Error('Registro indisponível.'),
          );
      }
    };
    void find();
    return () => {
      active = false;
    };
  }, [id]);
  return (
    <AppScreen>
      <AppHeader title="Registro relacionado" onBack={() => goBack()} />
      <QueryState loading={!error} error={error} />
    </AppScreen>
  );
}
