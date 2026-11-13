import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { useThemedStyles } from '@/theme/useTheme';
import { formatCallDateTime } from '@/features/city/formatDates';
import { resolveOfficialCallDeadline } from '@/features/city/officialCallStatus';
import type { OfficialCall } from '@/shared/contracts';
import { createStyles } from './styles';

type Props = { item: OfficialCall; slaLabel: string | null; deadlineInfo: ReturnType<typeof resolveOfficialCallDeadline> };
export function OfficialCallDates({ item, slaLabel, deadlineInfo }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
        <View style={styles.sectionCard}>
          <AppText variant="sectionTitle" style={styles.sectionHeading}>
            Prazos e datas
          </AppText>

          <View style={styles.infoGrid}>
            <View style={styles.gridItem}>
              <AppText variant="caption" color="muted">
                Data de abertura
              </AppText>
              <AppText variant="label" color="ink">
                {formatCallDateTime(item.openedAt)}
              </AppText>
            </View>

            <View style={styles.gridItem}>
              <AppText variant="caption" color="muted">
                Prazo estimado
              </AppText>
              <AppText variant="label" color="ink">
                {formatCallDateTime(item.targetDate)}
              </AppText>
            </View>

            {slaLabel ? (
              <View style={styles.gridItem}>
                <AppText variant="caption" color="muted">
                  Prazo da Carta de Serviços
                </AppText>
                <AppText variant="label" color="ink">
                  {slaLabel}
                </AppText>
              </View>
            ) : null}

            {item.diagnosisTargetDate ? (
              <View style={styles.gridItem}>
                <AppText variant="caption" color="muted">
                  Previsão de diagnóstico
                </AppText>
                <AppText variant="label" color="ink">
                  {formatCallDateTime(item.diagnosisTargetDate)}
                </AppText>
              </View>
            ) : null}

            {item.closedAt ? (
              <View style={styles.gridItem}>
                <AppText variant="caption" color="muted">
                  Data de encerramento
                </AppText>
                <AppText variant="label" color="ink">
                  {formatCallDateTime(item.closedAt)}
                </AppText>
              </View>
            ) : null}

            {deadlineInfo ? (
              <View style={styles.gridItem}>
                <AppText variant="caption" color="muted">
                  Conformidade de prazo
                </AppText>
                <AppText
                  variant="label"
                  color={deadlineInfo.isOverdue ? 'risk' : 'ink'}
                >
                  {deadlineInfo.label}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>


  );
}
