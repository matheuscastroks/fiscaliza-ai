import React from 'react';
import { Link } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
export default function NotFound() {
  return (
    <AppScreen scroll>
      <AppText variant="screenTitle">Página não encontrada</AppText>
      <AppText>
        O endereço não está disponível. Volte ao início para continuar.
      </AppText>
      <Link href="/(tabs)" style={{ paddingVertical: 24, color: '#176287' }}>
        Voltar ao início
      </Link>
    </AppScreen>
  );
}
