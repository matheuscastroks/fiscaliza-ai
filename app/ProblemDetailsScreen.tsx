import React, { useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { StatusText } from '@/components/occurrences/StatusText';
import { QueryState, cityStyles } from '@/features/city/CityUI';
import { useCityQuery } from '@/features/city/useCityQuery';
import { assetUrl, mutation } from '@/services/http';
import { useAuthStore } from '@/stores/authStore';
import { useProblemsStore } from '@/stores/problemsStore';
import type { Occurrence } from '@/shared/contracts';
export default function ProblemDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const path = '/occurrences/' + encodeURIComponent(id || '');
  const user = useAuthStore((s) => s.user);
  const query = useCityQuery<Occurrence>(path);
  const item = query.data;
  const [comment, setComment] = useState('');
  const [reason, setReason] = useState('');
  const change = useMutation({
    mutationFn: ({
      suffix,
      method,
      body,
    }: {
      suffix: string;
      method: string;
      body?: unknown;
    }) => mutation(path + suffix, method, body),
    onSuccess: (_result, variables) => {
      if (variables.suffix === '/comments') setComment('');
      void query.refetch();
      void useProblemsStore.getState().loadProblems();
    },
  });
  const send = (suffix: string, method: string, body?: unknown) =>
    change.mutate({ suffix, method, body });
  return (
    <AppScreen keyboardAvoiding>
      <AppHeader title="Ocorrência" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={cityStyles.content}
        keyboardShouldPersistTaps="handled"
      >
        <QueryState
          loading={query.isPending}
          error={query.error}
          retry={query.refetch}
        />
        {item && (
          <>
            <StatusText status={item.status} />
            <AppText variant="screenTitle">{item.title}</AppText>
            <AppText color="muted">{item.location.address}</AppText>
            <AppText variant="caption" color="muted">
              Protocolo {item.id} ·{' '}
              {new Date(item.reportedAt).toLocaleDateString('pt-BR')}
            </AppText>
            <AppText>{item.description}</AppText>
            {item.images.map((url, index) => (
              <Image
                key={url}
                source={{ uri: assetUrl(url) }}
                accessibilityLabel={'Foto da ocorrência ' + (index + 1)}
                style={{ height: 220, width: '100%', resizeMode: 'cover' }}
              />
            ))}
            <View style={cityStyles.section}>
              <AppText variant="sectionTitle">Respostas e atendimento</AppText>
              {item.sector && (
                <AppText color="muted">
                  Setor responsável: {item.sector}
                </AppText>
              )}
              {item.statusHistory.map((event, index) => (
                <View key={event.id || index} style={cityStyles.row}>
                  <AppText variant="caption" color="muted">
                    {new Date(event.at).toLocaleString('pt-BR')}
                    {event.actor ? ' · ' + event.actor : ''}
                  </AppText>
                  <StatusText status={event.status} />
                  <AppText>{event.justification}</AppText>
                </View>
              ))}
            </View>
            {(item.relatedIds?.length || 0) > 0 && (
              <View style={cityStyles.section}>
                <AppText variant="sectionTitle">
                  Ações e participações relacionadas
                </AppText>
                {item.relatedIds?.map((link) => (
                  <AppButton
                    key={link}
                    title="Conhecer participação relacionada"
                    variant="quiet"
                    onPress={() =>
                      router.push({
                        pathname: '/CivicDetailsScreen',
                        params: { id: link },
                      })
                    }
                  />
                ))}
              </View>
            )}
            <View style={cityStyles.controls}>
              <AppButton
                title={
                  item.supportedByMe
                    ? 'Retirar meu apoio (' + item.votes + ')'
                    : 'Apoiar (' + item.votes + ')'
                }
                variant="secondary"
                disabled={change.isPending}
                onPress={() =>
                  send('/support', item.supportedByMe ? 'DELETE' : 'PUT')
                }
              />
              <AppButton
                title={
                  item.followedByMe
                    ? 'Deixar de acompanhar'
                    : 'Acompanhar atualizações'
                }
                variant="secondary"
                disabled={change.isPending}
                onPress={() =>
                  send('/follow', item.followedByMe ? 'DELETE' : 'PUT')
                }
              />
            </View>
            {item.status === 'resolved' && item.reportedBy === user?.id && (
              <View style={cityStyles.section}>
                <AppText variant="sectionTitle">
                  O problema foi resolvido?
                </AppText>
                {item.evaluation && (
                  <AppText color="muted">
                    {item.evaluation.satisfied
                      ? 'Você confirmou a solução.'
                      : 'Revisão solicitada: ' + item.evaluation.reason}
                  </AppText>
                )}
                <AppInput
                  label="Conte o que encontrou no local"
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  maxLength={2000}
                />
                <AppButton
                  title="Confirmar solução"
                  disabled={change.isPending}
                  onPress={() =>
                    send('/evaluation', 'POST', {
                      satisfied: true,
                      reason: reason.trim() || 'Solução confirmada no local.',
                    })
                  }
                />
                <AppButton
                  title="Solicitar revisão do atendimento"
                  variant="secondary"
                  disabled={change.isPending || reason.trim().length < 5}
                  onPress={() =>
                    send('/evaluation', 'POST', {
                      satisfied: false,
                      reason: reason.trim(),
                    })
                  }
                />
              </View>
            )}
            <View style={cityStyles.section}>
              <AppText variant="sectionTitle">
                Informações da comunidade
              </AppText>
              {item.comments.map((c) => (
                <View key={c.id} style={cityStyles.row}>
                  <AppText variant="label">{c.userName}</AppText>
                  <AppText>{c.text}</AppText>
                </View>
              ))}
              <AppInput
                label="Complementar o registro"
                value={comment}
                onChangeText={setComment}
                multiline
                maxLength={2000}
              />
              <AppButton
                title="Enviar informação"
                variant="secondary"
                disabled={!comment.trim()}
                loading={change.isPending}
                onPress={() =>
                  send('/comments', 'POST', { text: comment.trim() })
                }
              />
            </View>
          </>
        )}
        {change.error && (
          <AppText color="risk" accessibilityLiveRegion="polite">
            {change.error.message}
          </AppText>
        )}
      </ScrollView>
    </AppScreen>
  );
}
