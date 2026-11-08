import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { AppText } from '@/components/ui/AppText';
import { spacing, layout } from '@/theme';
import type { OfficialCall } from '@/shared/contracts';
import { isOfficialCallClosed } from '@/shared/official-call-state';

export interface OfficialCallTimelineProps {
  call: OfficialCall;
}

interface TimelineStep {
  id: string;
  title: string;
  subtitle?: string | null;
  date?: string | null;
  state: 'done' | 'active' | 'pending';
  icon: keyof typeof Ionicons.glyphMap;
}

function formatDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

function buildTimelineSteps(call: OfficialCall, isClosed: boolean): TimelineStep[] {
  const openedDate = formatDate(call.openedAt);
  const targetDate = formatDate(call.targetDate);
  const closedDate = formatDate(call.closedAt);
  const diagnosisDate = formatDate(call.diagnosisTargetDate);

  const steps: TimelineStep[] = [];

  // 1. Abertura do chamado
  steps.push({
    id: 'opened',
    title: 'Chamado registrado',
    subtitle: 'Protocolo aberto na Central 1746',
    date: openedDate,
    state: 'done',
    icon: 'document-text-outline',
  });

  // 2. Vistoria / Encaminhamento para órgão
  const orgName = call.organizationName || call.serviceCategory;
  steps.push({
    id: 'routing',
    title: 'Encaminhamento e análise técnica',
    subtitle: orgName ? `Órgão responsável: ${orgName}` : 'Em análise pela secretaria competente',
    date: diagnosisDate || openedDate,
    state: isClosed ? 'done' : 'active',
    icon: 'search-outline',
  });

  // 3. Programação e execução
  steps.push({
    id: 'execution',
    title: 'Execução do serviço',
    subtitle: targetDate
      ? `Prazo estimado pela Prefeitura: ${targetDate}`
      : 'Programação da equipe em campo',
    date: targetDate,
    state: isClosed ? 'done' : 'pending',
    icon: 'construct-outline',
  });

  // 4. Encerramento oficial
  steps.push({
    id: 'closed',
    title: isClosed ? 'Encerramento no 1746' : 'Conclusão oficial',
    subtitle: isClosed
      ? call.statusJustification || 'Processamento administrativo concluído pelo órgão'
      : 'Aguardando confirmação de término pela Prefeitura',
    date: closedDate,
    state: isClosed ? 'done' : 'pending',
    icon: isClosed ? 'checkmark-circle' : 'flag-outline',
  });

  return steps;
}

function OfficialCallTimelineComponent({ call }: OfficialCallTimelineProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isClosed = isOfficialCallClosed(call);
  const steps = buildTimelineSteps(call, isClosed);

  return (
    <View style={styles.container} accessibilityRole="list" accessibilityLabel="Linha do tempo de atendimento do chamado">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isDone = step.state === 'done';
        const isActive = step.state === 'active';

        return (
          <View key={step.id} style={styles.stepRow} accessibilityRole="listitem">
            {/* Coluna do Indicador e Linha Conectora */}
            <View style={styles.indicatorCol}>
              <View
                style={[
                  styles.nodeCircle,
                  isDone && styles.nodeCircleDone,
                  isActive && styles.nodeCircleActive,
                  step.state === 'pending' && styles.nodeCirclePending,
                ]}
              >
                <Ionicons
                  name={isDone ? 'checkmark' : step.icon}
                  size={14}
                  color={
                    isDone
                      ? colors.onAccent
                      : isActive
                      ? colors.accent
                      : colors.muted
                  }
                />
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.connectorLine,
                    isDone && styles.connectorLineDone,
                  ]}
                />
              )}
            </View>

            {/* Conteúdo do Passo */}
            <View style={[styles.contentCol, isLast && { paddingBottom: 0 }]}>
              <View style={styles.stepHeader}>
                <AppText
                  variant="label"
                  style={[
                    styles.stepTitle,
                    isActive && { color: colors.accent, fontWeight: '700' },
                  ]}
                >
                  {step.title}
                </AppText>
                {Boolean(step.date) && (
                  <AppText variant="caption" color="muted" style={styles.stepDate}>
                    {step.date}
                  </AppText>
                )}
              </View>

              {Boolean(step.subtitle) && (
                <AppText variant="caption" color="muted" style={styles.stepSubtitle}>
                  {step.subtitle}
                </AppText>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export const OfficialCallTimeline = memo(OfficialCallTimelineComponent);

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingVertical: spacing.xs,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    indicatorCol: {
      alignItems: 'center',
      width: 28,
      marginRight: spacing.sm,
    },
    nodeCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    nodeCircleDone: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    nodeCircleActive: {
      backgroundColor: colors.surfaceSubdued,
      borderColor: colors.accent,
    },
    nodeCirclePending: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    connectorLine: {
      width: 2,
      minHeight: 28,
      flex: 1,
      backgroundColor: colors.border,
      marginVertical: 4,
    },
    connectorLineDone: {
      backgroundColor: colors.accent,
    },
    contentCol: {
      flex: 1,
      paddingBottom: spacing.lg,
    },
    stepHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
      flexWrap: 'wrap',
    },
    stepTitle: {
      fontWeight: '600',
      color: colors.ink,
      fontSize: 14,
    },
    stepDate: {
      fontSize: 12,
    },
    stepSubtitle: {
      marginTop: 2,
      fontSize: 12,
      lineHeight: 17,
    },
  });
