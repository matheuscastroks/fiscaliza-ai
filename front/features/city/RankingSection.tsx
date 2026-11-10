import { useTheme, useThemedStyles } from '@/theme/useTheme';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { layout } from '@/theme';
import { createStyles } from './resultsScreenStyles';

export interface RankingRow {
  key: string;
  label: string;
  detail?: string;
  value: string;
  /** Fração 0–1 usada apenas para a barra visual. */
  share: number;
  tone: string;
  onPress?: () => void;
}

export function RankingSection({
  icon,
  title,
  rows,
  showPosition = true,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  rows: RankingRow[];
  /** Falso quando a ordem é só de volume e não deve parecer classificação. */
  showPosition?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.dashboardBlock}>
      <View style={styles.sectionHeaderRow}>
        <Ionicons name={icon} size={layout.iconSize.sm} color={colors.muted} />
        <AppText variant="caption" style={styles.sectionHeaderText} numberOfLines={1}>
          {title}
        </AppText>
      </View>
      <View
        style={[
          styles.breakdownTable,
          { backgroundColor: colors.surface, borderColor: colors.divider },
        ]}
      >
        {rows.map((row, idx) => (
          <View key={row.key}>
            {idx > 0 && (
              <View style={[styles.tableDivider, { backgroundColor: colors.divider }]} />
            )}
            <Pressable
              disabled={!row.onPress}
              onPress={row.onPress}
              accessibilityRole={row.onPress ? 'button' : undefined}
              accessibilityLabel={showPosition ? `${idx + 1}º ${row.label}: ${row.value}` : `${row.label}: ${row.value}`}
              style={({ pressed }) => [
                styles.rankingRow,
                pressed && { backgroundColor: colors.surfaceSubdued },
              ]}
            >
              {showPosition ? (
                <AppText variant="label" style={[styles.rankPosition, { color: row.tone }]}>
                  {idx + 1}
                </AppText>
              ) : null}
              <View style={styles.rankingContent}>
                <View style={styles.breakdownLabelRow}>
                  <AppText variant="label" numberOfLines={1} style={styles.rankingLabel}>
                    {row.label}
                  </AppText>
                  <AppText variant="label" style={[styles.rankingValue, { color: row.tone }]}>
                    {row.value}
                  </AppText>
                </View>
                {row.detail ? (
                  <AppText variant="caption" color="muted" numberOfLines={1}>
                    {row.detail}
                  </AppText>
                ) : null}
                <View style={[styles.barTrack, { backgroundColor: colors.surfaceSubdued }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.max(2, Math.min(100, row.share * 100))}%`,
                        backgroundColor: row.tone,
                      },
                    ]}
                  />
                </View>
              </View>
              {row.onPress ? (
                <Ionicons name="chevron-forward" size={layout.iconSize.sm} color={colors.subtle} />
              ) : null}
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
