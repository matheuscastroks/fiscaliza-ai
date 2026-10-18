import { useThemedStyles, useTheme } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { useState, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { EngagementStats } from '@/components/ui/Engagement';
import { assetUrl } from '@/services/http';
import type { CivicItem } from '@/shared/contracts';
import { layout, spacing } from '@/theme';

export function ExecutionProgress({ progress }: { progress: number }) {
  const styles = useThemedStyles(createStyles);

  const value = Math.max(0, Math.min(100, progress));
  return (
    <View style={styles.progressGroup}>
      <AppText variant="screenTitle">{value}%</AppText>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Execução da ação pública"
        accessibilityValue={{ min: 0, max: 100, now: value }}
        style={styles.track}
      >
        <View style={[styles.fill, { width: `${value}%` }]} />
      </View>
    </View>
  );
}

/** Each composition presents its own civic task, instead of changing only a badge. */
export function CivicCard({
  item,
  status,
  territory,
  onPress,
}: {
  item: CivicItem;
  status: string;
  territory: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [failedPhoto, setFailedPhoto] = useState<string>();
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    if (item.kind !== 'consultation' || item.status !== 'open') return;
    const timer = setInterval(() => setClock(Date.now()), 60000);
    return () => clearInterval(timer);
  }, [item.kind, item.status]);
  const photo =
    item.kind === 'proposal'
      ? item.images?.[0]
      : item.kind === 'action'
        ? item.evidence[0]
        : undefined;
  const showPhoto = photo && failedPhoto !== photo;
  const open =
    item.kind === 'consultation' &&
    item.status === 'open' &&
    new Date(item.closesAt).getTime() > clock;
  const action =
    item.kind === 'proposal'
      ? 'Conhecer a ideia'
      : item.kind === 'consultation'
        ? open
          ? item.myAnswer === undefined
            ? 'Escolher uma opção'
            : 'Rever minha resposta'
          : 'Ver resultado'
        : item.status === 'completed'
          ? 'Ver entrega'
          : 'Ver andamento';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${status}, ${territory}, ${action}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.82 }]}
    >
      {item.kind === 'proposal' && showPhoto && (
        <Image
          source={{ uri: assetUrl(photo) }}
          contentFit="cover"
          accessibilityLabel={'Local da melhoria: ' + item.title}
          style={styles.proposalPhoto}
          onError={() => setFailedPhoto(photo)}
        />
      )}
      <View style={styles.content}>
        {item.kind === 'consultation' ? (
          <View style={styles.row}>
            <Ionicons name="checkbox-outline" size={28} color={colors.ink} />
            <AppText variant="meta" color="muted">
              {open ? 'Até ' : 'Encerrada em '}
              {new Date(item.closesAt).toLocaleDateString('pt-BR')}
            </AppText>
          </View>
        ) : (
          <AppText variant="meta" color="muted">
            {status}
          </AppText>
        )}
        <AppText variant="sectionTitle" numberOfLines={3}>
          {item.title}
        </AppText>
        <AppText variant="meta" color="muted">
          {territory}
        </AppText>
        {item.kind === 'proposal' && (
          <>
            <AppText color="muted" numberOfLines={3}>
              {item.summary}
            </AppText>
            <EngagementStats views={item.views ?? 0} supports={item.supports} />
          </>
        )}
        {item.kind === 'consultation' && (
          <View
            style={styles.ballot}
            pointerEvents="none"
            importantForAccessibility="no-hide-descendants"
            aria-hidden
          >
            {item.options.slice(0, 2).map((option, index) => (
              <View key={index} style={styles.option}>
                <Ionicons
                  name={
                    item.myAnswer === index
                      ? 'radio-button-on'
                      : 'radio-button-off'
                  }
                  size={22}
                  color={colors.ink}
                />
                <AppText style={{ flex: 1 }} numberOfLines={2}>
                  {option}
                </AppText>
              </View>
            ))}
            {item.options.length > 2 && (
              <AppText variant="meta" color="muted">
                +{item.options.length - 2}{' '}
                {item.options.length === 3 ? 'alternativa' : 'alternativas'}
              </AppText>
            )}
          </View>
        )}
        {item.kind === 'action' && (
          <>
            <ExecutionProgress progress={item.progress} />
            <View style={[styles.row, { alignItems: 'flex-start' }]}>
              {showPhoto && (
                <Image
                  source={{ uri: assetUrl(photo) }}
                  contentFit="cover"
                  accessibilityLabel={'Execução: ' + item.title}
                  style={styles.evidence}
                  onError={() => setFailedPhoto(photo)}
                />
              )}
              <View style={{ flex: 1, gap: spacing.xs }}>
                <AppText variant="meta" color="muted">
                  Previsão: {new Date(item.dueAt).toLocaleDateString('pt-BR')}
                </AppText>
                <AppText numberOfLines={3}>
                  {item.updates.at(-1)?.text || item.summary}
                </AppText>
              </View>
            </View>
          </>
        )}
        <View style={styles.action}>
          <AppText variant="label" style={{ flex: 1 }}>
            {action}
          </AppText>
          <View style={styles.arrow}>
            <Ionicons name="arrow-forward" size={22} color={colors.onAccent} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: layout.radius.card,
      overflow: 'hidden',
    },
    content: { padding: spacing.lg, gap: spacing.sm },
    proposalPhoto: { width: '100%', height: 170 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    ballot: { gap: spacing.xs, marginTop: spacing.xs },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
    progressGroup: { gap: spacing.sm, paddingVertical: spacing.sm },
    track: {
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
      backgroundColor: colors.divider,
    },
    fill: { height: '100%', borderRadius: 3, backgroundColor: colors.ink },
    evidence: { width: 84, height: 84, borderRadius: layout.radius.panel },
    action: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      minHeight: 48,
    },
    arrow: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.ink,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
