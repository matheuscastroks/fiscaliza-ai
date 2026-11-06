import { View } from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { OfficialCallRow } from '@/components/official/OfficialCallRow';
import type { OfficialCall } from '@/shared/contracts';
import type { TerritorySelection } from '@/features/places/types';
import { distanceMeters } from '@/features/places/selection';
import { spacing } from '@/theme';
export function NearbyCalls({ calls, selection }: { calls: OfficialCall[]; selection: TerritorySelection }) {
  return <View style={{ gap: spacing.md }}>{calls.map((call) => <View key={call.id} style={{ gap: spacing.xxs }}>
    {selection.kind === 'radius' && call.latitude != null && call.longitude != null && <AppText variant="caption" color="muted">
      A aproximadamente {(distanceMeters(selection, { latitude: call.latitude, longitude: call.longitude }) / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km do ponto · em linha reta
    </AppText>}
    <OfficialCallRow call={call} onPress={() => router.push({ pathname: '/OfficialCallDetailsScreen', params: { id: call.id } })} />
  </View>)}</View>;
}
