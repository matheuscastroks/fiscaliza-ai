import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useTheme } from '@/theme/useTheme';
export function NeighborhoodEntry({
  neighborhoodId,
  neighborhood,
}: {
  neighborhoodId?: string;
  neighborhood: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        gap: 12,
        padding: 20,
        backgroundColor: colors.surface,
        borderRadius: 24,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Ionicons name="map-outline" size={28} color={colors.ink} />
        <View style={{ flex: 1, gap: 4 }}>
          <AppText variant="sectionTitle">
            {neighborhoodId ? neighborhood : 'Conheça seu bairro'}
          </AppText>
          <AppText variant="caption" color="muted">
            Escolas, saúde, espaços públicos e demandas em um só território.
          </AppText>
        </View>
      </View>
      <AppButton
        title={neighborhoodId ? 'Ver panorama do bairro' : 'Escolher um bairro'}
        variant="secondary"
        onPress={() =>
          router.push({
            pathname: '/NeighborhoodScreen',
            params: neighborhoodId ? { neighborhoodId } : {},
          })
        }
      />
    </View>
  );
}
