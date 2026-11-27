import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useState } from 'react';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { TerritoryCardContent, type Entry } from './TerritoryPreviewCard';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import type { ElevationTokens } from '@/theme/elevation';
import { layout, spacing } from '@/theme';

/** Parte do próximo cartão que fica à mostra, sobre o atual. */
const PEEK = 36;
/** No Android a lista horizontal recorta o que passa da borda: este respiro
 * abaixo dos cartões mantém a sombra inteira. */
const SHADOW_ROOM = spacing.xl;
/** Folga entre o cartão atual e o próximo enquanto ninguém arrasta. */
const GAP = spacing.xs;

interface Props {
  entries: Entry[];
  total: number;
  loading: boolean;
  error: boolean;
  offline: boolean;
  bottomOffset: number;
  onOpen: (entry: Entry) => void;
  onClose: () => void;
  onRetry: () => void;
}

/**
 * Até 20 chamados de um mesmo ponto: cartões curtos lado a lado. Arrastar
 * traz o próximo cartão por cima do atual, que recua para o fundo da pilha.
 */
export function TerritoryClusterCarousel({ entries, total, loading, error, offline, bottomOffset, onOpen, onClose, onRetry }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const cardWidth = width - spacing.md * 2 - PEEK;
  const scrollX = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });
  const facility = entries[0]?.type === 'facility';
  const noun = facility ? (total === 1 ? 'serviço' : 'serviços') : total === 1 ? 'chamado' : 'chamados';
  const shown = Math.max(entries.length, 1);

  let body: React.ReactNode;
  if (!entries.length) {
    body = (
      <View style={[styles.card, styles.placeholder, { width: width - spacing.md * 2 }]} accessibilityLiveRegion="polite">
        {error || offline ? (
          <>
            <AppText color="muted">
              {offline ? 'Sem conexão. Os chamados deste ponto aparecem quando a conexão voltar.' : 'Não foi possível carregar os chamados deste ponto.'}
            </AppText>
            {!offline && <AppButton title="Tentar novamente" variant="secondary" onPress={onRetry} />}
          </>
        ) : (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.muted} />
            <AppText color="muted">{loading ? 'Carregando chamados deste ponto…' : 'Nenhum resultado neste ponto.'}</AppText>
          </View>
        )}
      </View>
    );
  } else {
    body = (
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth}
        decelerationRate="fast"
        disableIntervalMomentum
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / cardWidth))}
        contentContainerStyle={{ paddingLeft: spacing.md, paddingRight: width - spacing.md - cardWidth, paddingTop: spacing.xs, paddingBottom: SHADOW_ROOM }}
        accessibilityRole="adjustable"
        accessibilityLabel={`${total} ${noun} neste ponto. Arraste para o lado para ver os outros.`}
      >
        {entries.map((entry, i) => (
          <StackedCard key={entry.type + ':' + entry.item.id} index={i} scrollX={scrollX} width={cardWidth}>
            <View style={styles.card}>
              <TerritoryCardContent entry={entry} onOpen={onOpen} hideClose />
            </View>
          </StackedCard>
        ))}
      </Animated.ScrollView>
    );
  }

  return (
    <View style={[styles.root, { bottom: bottomOffset - SHADOW_ROOM }]} pointerEvents="box-none">
      <View style={styles.header} pointerEvents="box-none">
        <View style={styles.counter}>
          <AppText variant="caption" style={styles.counterText}>
            {entries.length > 1 ? `${Math.min(index + 1, shown)} de ${entries.length} · ` : ''}
            {total} {noun} neste ponto
          </AppText>
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fechar cartões deste ponto"
          hitSlop={8}
          style={({ pressed }) => [styles.close, pressed && { opacity: 0.8 }]}
        >
          <Ionicons name="close" size={layout.iconSize.md} color={colors.ink} />
        </Pressable>
      </View>
      {body}
    </View>
  );
}

function StackedCard({ index, scrollX, width, children }: {
  index: number;
  scrollX: SharedValue<number>;
  width: number;
  children: React.ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    // 0 = cartão atual; -1 = próximo (à direita); 1 = já passou (à esquerda).
    const p = scrollX.value / width - index;
    // Parado, o próximo só aparece no canto, sem encostar. Ao arrastar, o atual
    // fica no lugar e recua, e o próximo desliza por cima dele.
    const translateX = interpolate(p, [-1, 0, 1, 2], [GAP, 0, width, width * 2], Extrapolation.CLAMP);
    const scale = interpolate(p, [-1, 0, 1], [0.94, 1, 0.9], Extrapolation.CLAMP);
    const opacity = interpolate(p, [-2, -1, 0, 1, 1.3], [0, 1, 1, 1, 0], Extrapolation.CLAMP);
    return { opacity, transform: [{ translateX }, { scale }] };
  });
  return <Animated.View style={[{ width, paddingRight: spacing.xs }, style]}>{children}</Animated.View>;
}

const createStyles = (colors: ThemeColors, elevation?: ElevationTokens) =>
  StyleSheet.create({
    root: { position: 'absolute', left: 0, right: 0, zIndex: 100 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
    },
    counter: {
      ...elevation?.floating,
      backgroundColor: colors.surfaceFloating,
      borderRadius: layout.radius.control,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xxs + 2,
    },
    counterText: { fontWeight: '600' },
    close: {
      ...elevation?.floating,
      backgroundColor: colors.surfaceFloating,
      width: 36,
      height: 36,
      borderRadius: layout.radius.panel,
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      ...elevation?.floating,
      flex: 1,
      backgroundColor: colors.surfaceFloating,
      borderRadius: layout.radius.card,
    },
    placeholder: { marginHorizontal: spacing.md, marginTop: spacing.xs, marginBottom: SHADOW_ROOM, padding: spacing.md, gap: spacing.sm, flex: 0 },
    loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  });
