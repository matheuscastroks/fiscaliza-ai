import { openExternal } from '@/services/openExternal';
import { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { spacing, useTheme } from '@/theme';

export const OFFICIAL_PORTAL = 'https://www.1746.rio/hc/pt-br';
export const OFFICIAL_SIGNIN_URL = 'https://www.1746.rio/hc/pt-br/signin';
export const OFFICIAL_REQUESTS_URL = 'https://www.1746.rio/hc/pt-br/requests';
export const OFFICIAL_WHATSAPP_URL = 'https://wa.me/552134601746';
export const OFFICIAL_PHONE_URL = 'tel:1746';

export const OFFICIAL_SERVICES: {
  title: string;
  agency: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  url: string;
}[] = [
  {
    title: 'Iluminação pública',
    agency: 'Rioluz',
    description: 'Reparo de luminária apagada, piscando, acesa de dia ou danificada',
    icon: 'bulb-outline',
    url: 'https://www.1746.rio/hc/pt-br/articles/14187518715931-Reparo-de-lumin%C3%A1ria',
  },
  {
    title: 'Buracos e conservação da pista',
    agency: 'Conservação',
    description: 'Reparo de buraco, deformação ou afundamento no asfalto e calçadas',
    icon: 'construct-outline',
    url: 'https://www.1746.rio/hc/pt-br/articles/10221381930523-Reparo-de-buraco-deforma%C3%A7%C3%A3o-ou-afundamento-na-pista',
  },
  {
    title: 'Resíduos e limpeza urbana',
    agency: 'Comlurb',
    description: 'Remoção de lixo acumulado, entulho ou bens inservíveis em via pública',
    icon: 'trash-outline',
    url: 'https://www.1746.rio/hc/pt-br/articles/10220688258203-Remo%C3%A7%C3%A3o-de-res%C3%ADduos-em-vias-p%C3%BAblicas',
  },
  {
    title: 'Poda de árvore em via pública',
    agency: 'Comlurb / Parques e Jardins',
    description: 'Avaliação e poda de árvores em logradouros ou conflito com rede/iluminação',
    icon: 'leaf-outline',
    url: 'https://www.1746.rio/hc/pt-br/search?utf8=%E2%9C%93&query=poda+de+%C3%A1rvore',
  },
  {
    title: 'Bueiros, ralos e alagamentos',
    agency: 'Conservação / Rio-Águas',
    description: 'Limpeza, desobstrução de ralos, galerias pluviais e reposição de grelhas',
    icon: 'water-outline',
    url: 'https://www.1746.rio/hc/pt-br/search?utf8=%E2%9C%93&query=desobstru%C3%A7%C3%A3o+ralo+bueiro',
  },
  {
    title: 'Estacionamento irregular e trânsito',
    agency: 'Guarda Municipal / CET-Rio',
    description: 'Veículos sobre calçadas, bloqueio de garagem ou semáforo com defeito',
    icon: 'car-outline',
    url: 'https://www.1746.rio/hc/pt-br/search?utf8=%E2%9C%93&query=estacionamento+irregular',
  },
];

export function OfficialChannel({
  url = OFFICIAL_PORTAL,
  title = 'Acessar atendimento oficial',
  variant = 'secondary',
  icon,
}: {
  url?: string;
  title?: string;
  variant?: 'primary' | 'secondary' | 'quiet';
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <View style={{ gap: spacing.xs }}>
      <AppButton
        title={title}
        variant={variant}
        loading={busy}
        icon={
          icon ? (
            <Ionicons
              name={icon}
              size={18}
              color={variant === 'primary' ? colors.onAccent : colors.ink}
            />
          ) : undefined
        }
        onPress={() => {
          setFailed(false);
          setBusy(true);
          void openExternal(url).then((ok) => {
            setFailed(!ok);
            setBusy(false);
          });
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
