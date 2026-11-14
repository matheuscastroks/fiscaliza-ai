import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { fontSizes } from '@/theme/typography';
import type { OfficialCall } from '@/shared/contracts';
import { isOfficialCallClosed } from '@/shared/official-call-state';
import { resolveServiceCategoryTheme } from '@/features/city/officialCategoryThemes';
import {
  officialCallStatus,
  resolveOfficialCallDeadline,
} from '@/features/city/officialCallStatus';
import {
  formatCallDate,
  formatRelativeAge,
  formatTimeRemainingShort,
} from '@/features/city/formatDates';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Dados derivados de um chamado, compartilhados pela lista, pelo sheet e pelos rótulos de acessibilidade. */
export function describeCall(call: OfficialCall, colors: ThemeColors) {
  const theme = resolveServiceCategoryTheme(call.serviceType, call.serviceSubtype);
  const status = officialCallStatus(call, colors);
  const isClosed = isOfficialCallClosed(call);
  const isOverdue = !isClosed && resolveOfficialCallDeadline(call, isClosed)?.isOverdue === true;
  const remaining = formatTimeRemainingShort(call.timeRemaining, call.timeUnit);
  const openedDate = formatCallDate(call.openedAt);
  return {
    theme,
    status,
    isOverdue,
    title: call.serviceSubtype || call.serviceType,
    locationText:
      [call.streetName, call.neighborhoodName].filter(Boolean).join(' · ') || 'Bairro não informado',
    agencyName: call.organizationName?.trim() || null,
    relativeAge: formatRelativeAge(call.openedAt),
    openedLabel: openedDate ? `Aberto em ${openedDate}` : 'Data de abertura não informada',
    slaText: isClosed ? null : isOverdue ? 'Prazo vencido' : remaining ? `Restam ${remaining}` : null,
  };
}

export interface CallSummaryProps {
  call: OfficialCall;
  /** Ação independente à direita do título (ex.: botão Salvar). */
  headerAccessory?: React.ReactNode;
  /** À direita dos metadados, separado por uma linha (ex.: "No mapa"). */
  metaTrailing?: React.ReactNode;
  /** Reserva espaço à direita do cabeçalho (ex.: botão de fechar sobreposto). */
  headerInset?: number;
}

/** Miolo único do chamado: categoria, situação, título, local, prazo e protocolo. */
export function CallSummary({ call, headerAccessory, metaTrailing, headerInset = 0 }: CallSummaryProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const d = describeCall(call, colors);
  const iconName = d.theme.icon as IconName;

  const meta = (
    <View style={metaTrailing ? styles.metaLeft : styles.metaRow}>
      {d.relativeAge ? (
        <View style={styles.metaChip}>
          <AppText variant="caption" color="muted" style={styles.shrink}>{d.relativeAge}</AppText>
        </View>
      ) : null}
      {d.slaText ? (
        <View
          style={[
            styles.slaBadge,
            d.isOverdue
              ? { backgroundColor: colors.riskSurface, borderColor: colors.risk }
              : { backgroundColor: colors.surfaceSubdued, borderColor: colors.border },
          ]}
        >
          <Ionicons
            name={d.isOverdue ? 'alert-circle' : 'hourglass-outline'}
            size={layout.iconSize.sm}
            color={d.isOverdue ? colors.risk : colors.onSurfaceBrand}
          />
          <AppText variant="caption" color={d.isOverdue ? 'risk' : 'ink'} style={styles.shrink}>{d.slaText}</AppText>
        </View>
      ) : null}
      <View style={styles.protocolChip}>
        <AppText variant="protocol" color="muted" style={styles.shrink}>#{call.externalId}</AppText>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, headerInset > 0 && { paddingRight: headerInset }]}>
        <View style={styles.heading}>
          <View style={styles.categoryBadge}>
            <Ionicons name={iconName} size={layout.iconSize.sm} color={colors.muted} />
            <AppText variant="caption" color="muted" numberOfLines={1} style={styles.shrink}>
              {d.theme.label}
            </AppText>
          </View>
          <AppText variant="sectionTitle" numberOfLines={2} accessibilityLabel={d.title} style={styles.title}>
            {d.title}
          </AppText>
        </View>
        {headerAccessory ? <View style={styles.headerAction}>{headerAccessory}</View> : null}
      </View>

      <View style={styles.contextRow}>
        <View style={[styles.statusBadge, { backgroundColor: d.status.color + '1F' }]}>
          <View style={[styles.statusDot, { backgroundColor: d.status.color }]} />
          <AppText variant="caption" color={d.status.color} style={styles.shrink}>{d.status.label}</AppText>
        </View>
        {d.agencyName ? (
          <AppText variant="caption" color="muted" numberOfLines={2} accessibilityLabel={d.agencyName} style={styles.agency}>
            {d.agencyName}
          </AppText>
        ) : null}
      </View>

      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={layout.iconSize.sm} color={colors.muted} />
        <AppText variant="caption" color="muted" numberOfLines={1} style={styles.shrink}>
          {d.locationText}
        </AppText>
      </View>

      {metaTrailing ? (
        <View style={styles.footerRow}>
          {meta}
          <View style={styles.trailing}>{metaTrailing}</View>
        </View>
      ) : (
        meta
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { gap: spacing.xs },
    shrink: { flexShrink: 1 },
    header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
    heading: { flex: 1, minWidth: 0, gap: spacing.xxs },
    categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, minWidth: 0 },
    headerAction: { flexShrink: 0 },
    contextRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
    agency: { flexGrow: 1, flexShrink: 1, flexBasis: 120, minWidth: 0 },
    statusBadge: {
      maxWidth: '100%',
      flexShrink: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xxs,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xxs / 2,
      borderRadius: layout.radius.compact,
    },
    statusDot: { width: spacing.xs - 2, height: spacing.xs - 2, borderRadius: layout.radius.xs, flexShrink: 0 },
    title: { fontSize: fontSizes.body, lineHeight: 22 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
    metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
    metaLeft: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs, flexGrow: 1, flexBasis: 200, minWidth: 0 },
    metaChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, maxWidth: '100%', flexShrink: 1 },
    slaBadge: {
      maxWidth: '100%',
      flexShrink: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xxs,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xxs / 2,
      borderRadius: layout.radius.compact,
      borderWidth: StyleSheet.hairlineWidth,
    },
    protocolChip: { maxWidth: '100%' },
    footerRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
    trailing: { flexDirection: 'row', alignItems: 'center', flexShrink: 0, maxWidth: '100%' },
  });
