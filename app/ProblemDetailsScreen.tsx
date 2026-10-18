import { CityCarousel } from '@/features/city/CityCarousel';
import { nearbyOccurrences } from '@/shared/nearby-occurrences';
import { OccurrenceRow } from '@/components/occurrences/OccurrenceRow';
import { EngagementStats, SupportButton } from '@/components/ui/Engagement';
import { useRecordView } from '@/features/city/useRecordView';
import { goBack } from '@/utils/navigation';
import React, { useState } from 'react';
import { Image, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { DetailSheet, DetailSection } from '@/components/ui/DetailSheet';
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
  const nearby = useCityQuery<Occurrence[]>('/occurrences');
  const item = query.data;
  const related = item ? nearbyOccurrences(item, nearby.data || []) : [];
  const view = useRecordView(path, Boolean(item));
  const [comment, setComment] = useState('');
  const [reason, setReason] = useState('');
  const [rating, setRating] = useState(0);
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
    <DetailSheet
      title={'Ocorrência'}
      image={item?.images[0] ? assetUrl(item.images[0]) : undefined}
      onBack={() => goBack()}
      headerAction={
        item ? (
          <SupportButton
            supported={Boolean(item.supportedByMe)}
            disabled={change.isPending}
            onPress={() =>
              send('/support', item.supportedByMe ? 'DELETE' : 'PUT')
            }
          />
        ) : undefined
      }
      footer={
        item ? (
          <View style={{ gap: 8 }}>
            {change.error && change.variables?.suffix === '/follow' && (
              <AppText color="risk" accessibilityRole="alert">
                {change.error.message}
              </AppText>
            )}
            <AppButton
              title={
                item.followedByMe
                  ? 'Deixar de acompanhar'
                  : 'Acompanhar atualizações'
              }
              variant="primary"
              disabled={change.isPending}
              onPress={() =>
                send('/follow', item.followedByMe ? 'DELETE' : 'PUT')
              }
            />
          </View>
        ) : undefined
      }
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
          <EngagementStats views={item.views ?? 0} supports={item.votes} />
          {change.error && change.variables?.suffix === '/support' && (
            <AppText color="risk" accessibilityRole="alert">
              {change.error.message}
            </AppText>
          )}
          {view.error && (
            <View style={{ gap: 8 }}>
              <AppText variant="meta" color="muted">
                {view.error}
              </AppText>
              <AppButton
                title="Registrar visualização novamente"
                variant="quiet"
                onPress={view.retry}
              />
            </View>
          )}
          <AppText color="muted">{item.location.address}</AppText>
          <AppText variant="caption" color="muted">
            Protocolo {item.id} ·{' '}
            {new Date(item.reportedAt).toLocaleDateString('pt-BR')}
          </AppText>
          <AppText>{item.description}</AppText>
          {item.images.slice(1).map((url, index) => (
            <Image
              key={url}
              source={{ uri: assetUrl(url) }}
              accessibilityLabel={'Foto da ocorrência ' + (index + 1)}
              style={{
                height: 220,
                width: '100%',
                resizeMode: 'cover',
                borderRadius: 28,
              }}
            />
          ))}
          <DetailSection title="Respostas e atendimento">
            {item.sector && (
              <AppText color="muted">Setor responsável: {item.sector}</AppText>
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
          </DetailSection>
          {(item.relatedIds?.length || 0) > 0 && (
            <DetailSection title="Ações e participações relacionadas">
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
            </DetailSection>
          )}

          {item.status === 'resolved' && item.reportedBy === user?.id && (
            <DetailSection title="Avaliação do atendimento">
              {item.evaluation ? (
                <AppText color="muted">
                  {item.evaluation.rating
                    ? 'Atendimento avaliado: ' +
                      item.evaluation.rating +
                      ' de 5 estrelas.'
                    : 'Sua avaliação foi registrada.'}{' '}
                  Você encontra este registro no histórico do perfil.
                </AppText>
              ) : (
                <>
                  <AppText color="muted">
                    Como foi o atendimento desta ocorrência?
                  </AppText>
                  <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Pressable
                        key={star}
                        accessibilityRole="radio"
                        accessibilityLabel={
                          star + (star === 1 ? ' estrela' : ' estrelas')
                        }
                        accessibilityState={{ checked: rating === star }}
                        onPress={() => setRating(star)}
                        style={{
                          width: 48,
                          height: 48,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons
                          name={star <= rating ? 'star' : 'star-outline'}
                          size={30}
                          color={colors.ink}
                        />
                      </Pressable>
                    ))}
                  </View>
                  <AppInput
                    label="Comentário (opcional)"
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    maxLength={2000}
                  />
                  <AppButton
                    title="Concluir avaliação"
                    disabled={change.isPending || rating === 0}
                    onPress={() =>
                      send('/evaluation', 'POST', {
                        rating,
                        satisfied: rating >= 3,
                        reason: reason.trim(),
                      })
                    }
                  />
                </>
              )}
            </DetailSection>
          )}
          <DetailSection title="Informações da comunidade">
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
          </DetailSection>
          <View style={cityStyles.section}>
            <AppText variant="sectionTitle">Perto deste local</AppText>
            <QueryState
              loading={nearby.isLoading}
              error={nearby.error}
              retry={nearby.refetch}
            />
            {related.length > 0 && (
              <CityCarousel
                key={item.id}
                label="Ocorrências próximas"
                items={related.map((result) => ({
                  ...result,
                  id: result.item.id,
                }))}
                renderItem={({ item: other, distance }) => (
                  <View style={{ gap: 8 }}>
                    <AppText variant="meta" color="muted">
                      {distance < 1000
                        ? Math.round(distance) + ' m'
                        : (distance / 1000).toFixed(1).replace('.', ',') +
                          ' km'}{' '}
                      deste registro
                    </AppText>
                    <OccurrenceRow
                      problem={other}
                      onPress={() =>
                        router.push({
                          pathname: '/ProblemDetailsScreen',
                          params: { id: other.id },
                        })
                      }
                    />
                  </View>
                )}
              />
            )}
            {nearby.data && related.length === 0 && (
              <AppText color="muted">
                Nenhuma outra ocorrência a até 1,5 km deste local.
              </AppText>
            )}
          </View>
        </>
      )}
      {change.error &&
        change.variables?.suffix !== '/follow' &&
        change.variables?.suffix !== '/support' && (
          <AppText color="risk" accessibilityLiveRegion="polite">
            {change.error.message}
          </AppText>
        )}
    </DetailSheet>
  );
}
