import { useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import type { CityHighlight } from '@/shared/city-highlights';
import { civicTerritory } from '@/shared/civic-territory';

import { spacing } from '@/theme/spacing';

export function HomeHighlights({ items }: { items: CityHighlight[] }) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.stack}>
      {items.map((highlight, index) => {
        const occurrence =
          'occurrence' in highlight ? highlight.occurrence : undefined;
        const civic = 'item' in highlight ? highlight.item : undefined;
        const tone =
          highlight.kind === 'evaluation' || highlight.kind === 'result'
            ? 'completed'
            : highlight.kind === 'consultation'
              ? 'attention'
              : 'accent';
        const territory = civic ? civicTerritory(civic) : undefined;
        const label =
          highlight.kind === 'evaluation'
            ? 'ATENDIMENTO CONCLUÍDO'
            : highlight.kind === 'consultation'
              ? 'PRAZO DE PARTICIPAÇÃO'
              : highlight.kind === 'result'
                ? 'ENTREGA NO TERRITÓRIO'
                : highlight.kind === 'response' && highlight.institutional
                  ? 'RESPOSTA DA GESTÃO'
                  : 'ATUALIZAÇÃO DO ATENDIMENTO';
        const action =
          highlight.kind === 'evaluation'
            ? 'Avaliar atendimento'
            : highlight.kind === 'consultation'
              ? 'Responder consulta'
              : highlight.kind === 'result'
                ? 'Ver entrega e evidências'
                : 'Acompanhar atendimento';
        return (
          <View
            key={(occurrence?.id || civic?.id) + highlight.kind}
            style={[styles.event, index === 0 && styles.lead]}
          >
            <AppText variant="caption" color={tone}>
              {label}
            </AppText>
            <AppText variant={index === 0 ? 'screenTitle' : 'sectionTitle'}>
              {occurrence?.title || civic?.title}
            </AppText>
            <AppText variant="caption" color="muted">
              {territory?.scope === 'municipality'
                ? 'Todo o município'
                : civic?.neighborhood ||
                  occurrence?.location.neighborhood ||
                  occurrence?.location.address}
            </AppText>
            {highlight.kind === 'evaluation' && (
              <AppText>
                O serviço foi concluído. Confirme como ficou no local.
              </AppText>
            )}
            {highlight.kind === 'response' && (
              <>
                <AppText>{highlight.text}</AppText>
                <AppText variant="caption" color="muted">
                  {new Date(highlight.at).toLocaleString('pt-BR')}
                </AppText>
              </>
            )}
            {highlight.kind === 'consultation' && (
              <AppText color="attention">
                Respostas até{' '}
                {new Date(highlight.at).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                .
              </AppText>
            )}
            {highlight.kind === 'result' && (
              <AppText>
                {highlight.item.updates.at(-1)?.text || highlight.item.summary}
              </AppText>
            )}
            <AppButton
              title={action}
              variant={index === 0 ? 'primary' : 'quiet'}
              onPress={() => {
                if (occurrence)
                  router.push({
                    pathname: '/ProblemDetailsScreen',
                    params: { id: occurrence.id },
                  });
                else if (civic)
                  router.push({
                    pathname: '/CivicDetailsScreen',
                    params: { id: civic.id },
                  });
              }}
            />
          </View>
        );
      })}
    </View>
  );
}
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    stack: { gap: spacing.lg },
    event: {
      backgroundColor: colors.surface,
      borderRadius: 24,

      padding: spacing.md,
      gap: spacing.xs,
    },
    lead: {
      backgroundColor: colors.surface,
      padding: spacing.lg,
    },
  });
