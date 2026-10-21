import { useState } from 'react';
import { Linking, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { spacing } from '@/theme';
export const OFFICIAL_PORTAL = 'https://www.1746.rio/hc/pt-br';
export const OFFICIAL_SERVICES = [
  {
    title: 'Iluminação pública',
    description: 'Luminária apagada, piscando ou danificada',
    icon: 'bulb-outline' as const,
    url: 'https://www.1746.rio/hc/pt-br/articles/14187518715931-Reparo-de-lumin%C3%A1ria',
  },
  {
    title: 'Buracos na pista',
    description: 'Reparo de buraco, deformação ou afundamento',
    icon: 'construct-outline' as const,
    url: 'https://www.1746.rio/hc/pt-br/articles/10221381930523-Reparo-de-buraco-deforma%C3%A7%C3%A3o-ou-afundamento-na-pista',
  },
  {
    title: 'Resíduos em vias públicas',
    description: 'Consultar o serviço de remoção de resíduos',
    icon: 'trash-outline' as const,
    url: 'https://www.1746.rio/hc/pt-br/articles/10220688258203-Remo%C3%A7%C3%A3o-de-res%C3%ADduos-em-vias-p%C3%BAblicas',
  },
];
export function OfficialChannel({
  url = OFFICIAL_PORTAL,
  title = 'Acessar atendimento oficial',
}: {
  url?: string;
  title?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <View style={{ gap: spacing.sm }}>
      <AppButton
        title={title}
        variant="secondary"
        loading={busy}
        onPress={() => {
          setFailed(false);
          setBusy(true);
          void Linking.openURL(url)
            .catch(() => setFailed(true))
            .finally(() => setBusy(false));
        }}
      />
      {failed && (
        <>
          <AppText color="risk" accessibilityRole="alert">
            Não foi possível abrir o atendimento. Tente novamente ou copie o
            endereço abaixo.
          </AppText>
          <AppText selectable variant="caption">
            {url}
          </AppText>
        </>
      )}
    </View>
  );
}
