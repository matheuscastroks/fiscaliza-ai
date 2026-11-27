import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppToast } from '@/components/ui/AppToast';
import type { IconName } from '@/components/ui/IconButton';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { openExternal } from '@/services/openExternal';
import { OFFICIAL_PROTOCOL_LOOKUP, OFFICIAL_WHATSAPP_URL } from '@/features/city/OfficialChannel';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import type { ElevationTokens } from '@/theme/elevation';
import { layout, spacing } from '@/theme';

interface Shortcut {
  id: string;
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}

export default function ParticipateScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { barTop } = useTabBarInset();
  const [linkError, setLinkError] = useState<string | null>(null);

  const shortcuts: Shortcut[] = [
    {
      id: 'protocol',
      icon: 'search',
      title: 'Buscar protocolo',
      subtitle: 'Ache um chamado pelo número',
      onPress: () => router.navigate({
        pathname: '/(tabs)/TerritoryScreen',
        params: { lookup: 'protocol', lookupRequest: String(Date.now()) },
      }),
    },
    {
      id: 'map',
      icon: 'map-outline',
      title: 'Ver no mapa',
      subtitle: 'Veja o que já foi pedido perto de você',
      onPress: () => router.navigate('/(tabs)/TerritoryScreen'),
    },
    {
      id: 'portal',
      icon: 'globe-outline',
      title: 'Portal do 1746',
      subtitle: 'Consulte seus pedidos no site oficial',
      onPress: () => {
        void openExternal(OFFICIAL_PROTOCOL_LOOKUP).then((ok) => {
          if (!ok) setLinkError('Não conseguimos abrir o portal. Tente de novo.');
        });
      },
    },
    {
      id: 'channels',
      icon: 'call-outline',
      title: 'Canais do 1746',
      subtitle: 'Telefone, WhatsApp e serviços por assunto',
      onPress: () => router.push('/OfficialServicesScreen'),
    },
  ];

  return (
    <AppScreen>
      <AppHeader title="Agir no 1746" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
      >
        <View style={styles.grid}>
          {shortcuts.map((item) => (
            <Pressable
              key={item.id}
              onPress={item.onPress}
              accessibilityRole={item.id === 'portal' ? 'link' : 'button'}
              accessibilityLabel={`${item.title}. ${item.subtitle}`}
              style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
            >
              <Ionicons name={item.icon} size={layout.iconSize.md} color={colors.primary} />
              <AppText variant="label" numberOfLines={1}>{item.title}</AppText>
              <AppText variant="caption" color="muted" numberOfLines={2} style={styles.tileSubtitle}>
                {item.subtitle}
              </AppText>
            </Pressable>
          ))}
        </View>

        <AppText variant="caption" color="muted" style={styles.note}>
          O Fiscaliza aí não registra pedidos: você envia pelos canais oficiais da Prefeitura.
        </AppText>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: barTop + spacing.sm }]}>
        {/* O WhatsApp do 1746 é atendido por menu numerado: o app só abre a conversa. */}
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            void openExternal(OFFICIAL_WHATSAPP_URL).then((ok) => {
              if (!ok) setLinkError('Não conseguimos abrir o WhatsApp. Ligue para o 1746.');
            });
          }}
          accessibilityRole="link"
          accessibilityLabel="Avisar um problema no WhatsApp do 1746"
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
        >
          <View style={styles.primaryIcon}>
            <Ionicons name="logo-whatsapp" size={layout.iconSize.lg} color={colors.accent} />
          </View>
          <View style={styles.primaryText}>
            <AppText variant="sectionTitle" style={{ color: colors.onAccent }}>
              Avisar um problema
            </AppText>
            <AppText variant="meta" style={{ color: colors.onAccent, opacity: 0.85 }}>
              WhatsApp do 1746
            </AppText>
          </View>
          <Ionicons name="arrow-forward" size={layout.iconSize.md} color={colors.onAccent} />
        </Pressable>
      </View>

      <AppToast message={linkError} type="error" onDismiss={() => setLinkError(null)} />
    </AppScreen>
  );
}

const createStyles = (colors: ThemeColors, elevation?: ElevationTokens) =>
  StyleSheet.create({
    // O conteúdo fica no meio da área livre, não colado no topo.
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: spacing.contentPadding,
      gap: spacing.md,
    },
    footer: { paddingHorizontal: spacing.contentPadding, paddingTop: spacing.sm },
    primary: {
      ...elevation?.raised,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: layout.radius.card,
      backgroundColor: colors.accent,
    },
    primaryIcon: {
      width: 44,
      height: 44,
      borderRadius: layout.radius.panel,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.onAccent,
    },
    primaryText: { flex: 1, gap: spacing.xxs },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    tile: {
      ...elevation?.subtle,
      flexBasis: '47%',
      flexGrow: 1,
      gap: spacing.xs,
      padding: spacing.md,
      borderRadius: layout.radius.card,
      backgroundColor: colors.surfaceRaised,
    },
    // Duas linhas reservadas: todos os cartões com a mesma altura.
    tileSubtitle: { minHeight: 36 },
    note: { textAlign: 'center', paddingHorizontal: spacing.md },
    pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  });
