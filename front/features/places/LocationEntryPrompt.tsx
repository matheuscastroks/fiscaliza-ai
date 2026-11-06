import { View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { usePlacesStore } from '@/stores/placesStore';
import { spacing } from '@/theme';
export function LocationEntryPrompt({ onLocate, onChoose, busy }: { onLocate: () => void; onChoose: () => void; busy: boolean }) {
  const { hydrated, promptSeen, dismissPrompt } = usePlacesStore();
  if (!hydrated || promptSeen) return null;
  return <View style={{ gap: spacing.sm }}>
    <AppText variant="sectionTitle">Veja os chamados próximos de você</AppText>
    <AppText color="muted">Use sua posição para consultar o entorno. Você também pode escolher um bairro abaixo, sem liberar a localização.</AppText>
    <AppButton title="Usar minha localização" loading={busy} onPress={() => { void dismissPrompt(); onLocate(); }} />
    <AppButton title="Escolher bairro" variant="secondary" onPress={() => { void dismissPrompt(); onChoose(); }} />
    <AppButton title="Agora não" variant="secondary" onPress={() => { void dismissPrompt(); }} />
  </View>;
}
