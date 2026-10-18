import { useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Problem } from '@/data/mockData';

import { spacing } from '@/theme/spacing';
import { layout } from '@/theme/layout';
import { AppText } from '@/components/ui/AppText';
import { StatusText } from './StatusText';
import { formatDate } from '@/utils/occurrenceLabels';

export interface OccurrenceTimelineProps {
  history?: Problem['statusHistory'];
  currentStatus: Problem['status'];
  reportedAt: string;
}

export const OccurrenceTimeline: React.FC<OccurrenceTimelineProps> = ({
  history,
  currentStatus,
  reportedAt,
}) => {
  const styles = useThemedStyles(createStyles);

  // Se não houver histórico gravado, monta ao menos o registro inicial
  const events =
    history && history.length > 0
      ? history
      : [
          {
            status: currentStatus,
            at: reportedAt,
            justification: 'Relato registrado no sistema de atendimento.',
          },
        ];

  // Ordena os eventos do mais recente para o mais antigo para leitura de tramitação
  const sortedEvents = [...events].reverse();

  return (
    <View style={styles.container}>
      <AppText variant="sectionTitle" color="ink" style={styles.heading}>
        Acompanhamento da Tramitação
      </AppText>

      <View style={styles.timelineList}>
        {sortedEvents.map((event, index) => {
          const isLatest = index === 0;
          const formattedDate = formatDate(event.at);

          return (
            <View key={`${event.status}-${index}`} style={styles.timelineItem}>
              {/* Linha vertical conectora e bullet */}
              <View style={styles.bulletCol}>
                <View
                  style={[styles.bullet, isLatest && styles.bulletLatest]}
                />
                {index < sortedEvents.length - 1 ? (
                  <View style={styles.connectingLine} />
                ) : null}
              </View>

              {/* Conteúdo do evento de status */}
              <View style={styles.eventContent}>
                <View style={styles.eventHeader}>
                  <StatusText status={event.status} />
                  <AppText variant="caption" color="muted">
                    {formattedDate}
                  </AppText>
                </View>

                {event.justification ? (
                  <AppText
                    variant="body"
                    color="ink"
                    style={styles.justification}
                  >
                    {event.justification}
                  </AppText>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginVertical: spacing.md,
    },
    heading: {
      marginBottom: spacing.md,
    },
    timelineList: {
      paddingLeft: spacing.xs,
    },
    timelineItem: {
      flexDirection: 'row',
      marginBottom: spacing.md,
    },
    bulletCol: {
      alignItems: 'center',
      width: 20,
      marginRight: spacing.sm,
    },
    bullet: {
      width: 10,
      height: 10,
      borderRadius: layout.radius.pill,
      backgroundColor: colors.divider,
      marginTop: 4,
    },
    bulletLatest: {
      backgroundColor: colors.accent,
      width: 12,
      height: 12,
      borderWidth: 2,
      borderColor: colors.accentSoft,
    },
    connectingLine: {
      flex: 1,
      width: layout.borderWidth.hairline,
      backgroundColor: colors.divider,
      marginVertical: 4,
    },
    eventContent: {
      flex: 1,
      paddingBottom: spacing.xs,
    },
    eventHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xxs,
    },
    justification: {
      marginTop: spacing.xxs,
      lineHeight: 20,
    },
  });
