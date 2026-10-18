import React from 'react';
import { Image, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { StatusText } from '@/components/occurrences/StatusText';
import {
  QueryState,
  cityStyles,
  kindLabel,
  statusLabel,
} from '@/features/city/CityUI';
import { useCityQuery } from '@/features/city/useCityQuery';
import { assetUrl } from '@/services/http';
import type { CivicItem, Occurrence } from '@/shared/contracts';

/** Historical reads have their own identity-authorized API; no mutation controls. */
export default function HistoricalDetailsScreen() {
  const { id, kind } = useLocalSearchParams<{ id?: string; kind?: string }>();
  const valid = Boolean(
    id && (kind === 'occurrences' || kind === 'civic-items'),
  );
  const query = useCityQuery<Occurrence | CivicItem>(
    '/activity/' +
      (kind === 'civic-items' ? 'civic-items' : 'occurrences') +
      '/' +
      encodeURIComponent(id || ''),
    valid,
  );
  const item = query.data;
  const civic = item && 'kind' in item ? item : undefined;
  const occurrence = item && !('kind' in item) ? item : undefined;
  const images =
    occurrence?.images || (civic?.kind === 'action' ? civic.evidence : []);
  return (
    <AppScreen>
      <AppHeader
        title="Histórico de participação"
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={cityStyles.content}>
        <AppText variant="label" color="muted">
          Somente leitura
        </AppText>
        <AppText color="muted">
          Sua participação foi preservada. Novos registros e interações ficam no
          município atual.
        </AppText>
        {!valid && (
          <AppText color="risk">
            O link deste histórico está incompleto. Volte aos seus
            acompanhamentos.
          </AppText>
        )}
        <QueryState
          loading={valid && query.isPending}
          error={query.error}
          retry={query.refetch}
        />
        {item && (
          <>
            {occurrence && <StatusText status={occurrence.status} />}
            {civic && (
              <AppText color="accent">
                {kindLabel[civic.kind]} · {statusLabel[civic.status]}
              </AppText>
            )}
            <AppText variant="screenTitle">{item.title}</AppText>
            <AppText color="muted">
              {occurrence ? occurrence.location.address : civic?.neighborhood}
            </AppText>
            <AppText>
              {occurrence ? occurrence.description : civic?.body}
            </AppText>
            {images.map((url, index) => (
              <Image
                key={url}
                source={{ uri: assetUrl(url) }}
                accessibilityLabel={'Evidência preservada ' + (index + 1)}
                style={{ width: '100%', height: 220, resizeMode: 'cover' }}
              />
            ))}
            {occurrence && (
              <View style={cityStyles.section}>
                <AppText variant="sectionTitle">
                  Respostas e atendimento
                </AppText>
                {occurrence.statusHistory.map((event, index) => (
                  <View key={event.id || index} style={cityStyles.row}>
                    <AppText variant="caption" color="muted">
                      {new Date(event.at).toLocaleString('pt-BR')}
                      {event.actor ? ' · ' + event.actor : ''}
                    </AppText>
                    <StatusText status={event.status} />
                    <AppText>{event.justification}</AppText>
                  </View>
                ))}
                {occurrence.evaluation && (
                  <AppText>
                    {occurrence.evaluation.satisfied
                      ? 'Solução confirmada pelo cidadão.'
                      : 'Revisão solicitada: ' + occurrence.evaluation.reason}
                  </AppText>
                )}
              </View>
            )}
            {civic && (
              <View style={cityStyles.section}>
                <AppText variant="sectionTitle">Decisões e devolutivas</AppText>
                <AppText color="muted">
                  Responsável: {civic.responsible || 'Gestão municipal'}
                </AppText>
                {civic.history?.map((event, index) => (
                  <View key={index} style={cityStyles.row}>
                    <AppText variant="caption" color="muted">
                      {new Date(event.at).toLocaleString('pt-BR')} ·{' '}
                      {event.actor}
                    </AppText>
                    <AppText>{event.text}</AppText>
                  </View>
                ))}
                {civic.kind === 'proposal' && civic.decision && (
                  <AppText>{civic.decision}</AppText>
                )}
                {civic.kind === 'consultation' && (
                  <>
                    <AppText>
                      Prazo: {new Date(civic.closesAt).toLocaleString('pt-BR')}
                    </AppText>
                    {civic.myAnswer !== undefined && (
                      <AppText>
                        Sua resposta: {civic.options[civic.myAnswer]}
                      </AppText>
                    )}
                    {civic.status === 'closed' &&
                      civic.options.map((option, index) => (
                        <AppText key={index}>
                          {option}: {civic.answerCounts[index] || 0} respostas
                        </AppText>
                      ))}
                    {civic.result && <AppText>{civic.result}</AppText>}
                  </>
                )}
                {civic.kind === 'action' && (
                  <>
                    <AppText>Execução: {civic.progress}%</AppText>
                    {civic.updates.map((update, index) => (
                      <View key={index} style={cityStyles.row}>
                        <AppText variant="caption" color="muted">
                          {new Date(update.at).toLocaleString('pt-BR')} ·{' '}
                          {update.actor}
                        </AppText>
                        <AppText>{update.text}</AppText>
                      </View>
                    ))}
                  </>
                )}
              </View>
            )}
            <View style={cityStyles.section}>
              <AppText variant="sectionTitle">
                Contribuições registradas
              </AppText>
              {item.comments.map((comment) => (
                <View key={comment.id} style={cityStyles.row}>
                  <AppText variant="label">{comment.userName}</AppText>
                  <AppText>{comment.text}</AppText>
                </View>
              ))}
              {!item.comments.length && (
                <AppText color="muted">
                  Nenhuma contribuição adicional neste registro.
                </AppText>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </AppScreen>
  );
}
