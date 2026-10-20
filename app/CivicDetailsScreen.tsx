import { useThemedStyles } from '@/theme/useTheme';
import { ExecutionProgress } from '@/features/city/CivicCard';
import { DeleteRecord } from '@/features/city/DeleteRecord';
import { CommunityComment } from '@/features/city/CommunityComment';
import {
  BallotOption,
  ProposalStages,
} from '@/features/city/ParticipationDetails';
import { EngagementStats, SupportButton } from '@/components/ui/Engagement';
import { useRecordView } from '@/features/city/useRecordView';
import { goBack } from '@/utils/navigation';
import React, { useState, useEffect } from 'react';
import { Image, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { DetailSheet, DetailSection } from '@/components/ui/DetailSheet';
import { ItemLocationMap } from '@/components/ui/ItemLocationMap';
import { civicLocation } from '@/shared/civic-territory';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import {
  QueryState,
  createCityStyles,
  kindLabel,
  statusLabel,
} from '@/features/city/CityUI';
import { useCityQuery } from '@/features/city/useCityQuery';
import { assetUrl, mutation } from '@/services/http';
import type { CivicItem } from '@/shared/contracts';
export default function CivicDetailsScreen() {
  const cityStyles = useThemedStyles(createCityStyles);

  const { id } = useLocalSearchParams<{ id: string }>();
  const path = '/civic-items/' + encodeURIComponent(id || '');
  const query = useCityQuery<CivicItem>(path);
  const item = query.data;
  const view = useRecordView(path, Boolean(item?.kind === 'proposal'));
  const [comment, setComment] = useState('');
  const [selected, setSelected] = useState<number>();
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
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
      if (variables.suffix === '/answer') setSelected(undefined);
      void query.refetch();
    },
  });
  const send = (suffix: string, method: string, body?: unknown) =>
    change.mutate({ suffix, method, body });
  return (
    <DetailSheet
      title={item ? kindLabel[item.kind] : 'Participação'}
      onRefresh={() => query.refetch()}
      image={
        item?.kind === 'proposal' && item.images?.[0]
          ? assetUrl(item.images[0])
          : undefined
      }
      onBack={() => goBack()}
      headerAction={
        item?.kind === 'proposal' ? (
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
            {item.kind === 'consultation' &&
            item.status === 'open' &&
            new Date(item.closesAt).getTime() > clock ? (
              <AppButton
                title={
                  item.myAnswer === undefined
                    ? 'Registrar resposta'
                    : 'Atualizar resposta'
                }
                loading={change.isPending}
                disabled={selected === undefined || selected === item.myAnswer}
                onPress={() => send('/answer', 'PUT', { option: selected })}
              />
            ) : (
              <AppButton
                title={
                  item.followedByMe
                    ? 'Deixar de acompanhar'
                    : item.kind === 'proposal'
                      ? 'Acompanhar decisão'
                      : item.kind === 'action'
                        ? 'Acompanhar execução'
                        : 'Acompanhar devolutiva'
                }
                disabled={change.isPending}
                onPress={() =>
                  send('/follow', item.followedByMe ? 'DELETE' : 'PUT')
                }
              />
            )}
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
          <AppText color="accent">
            {statusLabel[item.status]} · {item.neighborhood}
          </AppText>
          <AppText variant="screenTitle">{item.title}</AppText>
          {item.kind === 'proposal' && (
            <EngagementStats views={item.views ?? 0} supports={item.supports} />
          )}
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
          {item.kind === 'proposal' && <ProposalStages status={item.status} />}
          {item.kind === 'action' && (
            <ExecutionProgress progress={item.progress} />
          )}
          <AppText>{item.body}</AppText>
          {(() => {
            const point = civicLocation(item);
            if (!point) return null;
            const address =
              item.territory?.scope === 'location'
                ? item.territory.location.address
                : undefined;
            return (
              <ItemLocationMap
                id={item.id}
                latitude={point.latitude}
                longitude={point.longitude}
                address={address}
                neighborhood={item.neighborhood}
                title={item.title}
                kind={item.kind}
              />
            );
          })()}
          {item.kind === 'proposal' &&
            item.images?.slice(1).map((url, index) => (
              <Image
                key={url}
                source={{ uri: assetUrl(url) }}
                accessibilityLabel={'Foto da proposta ' + (index + 2)}
                style={{
                  height: 220,
                  width: '100%',
                  borderRadius: 28,
                  resizeMode: 'cover',
                }}
              />
            ))}
          <AppText color="muted">
            Responsável: {item.responsible || 'Gestão municipal'}
          </AppText>
          {item.kind === 'proposal' && item.decision && (
            <DetailSection title="Resposta da gestão">
              <AppText>{item.decision}</AppText>
            </DetailSection>
          )}
          {item.kind === 'consultation' && (
            <View style={cityStyles.section}>
              <AppText variant="sectionTitle">
                {item.status === 'open'
                  ? 'Sua opinião'
                  : 'Resultado da consulta'}
              </AppText>
              <AppText color="muted">
                Encerramento:{' '}
                {new Date(item.closesAt).toLocaleDateString('pt-BR')}
              </AppText>
              {item.options.map((_, index) => (
                <BallotOption
                  key={index}
                  item={item}
                  index={index}
                  selected={selected ?? item.myAnswer}
                  closed={
                    item.status === 'closed' ||
                    new Date(item.closesAt).getTime() <= clock
                  }
                  disabled={
                    item.status === 'closed' ||
                    new Date(item.closesAt).getTime() <= clock ||
                    change.isPending
                  }
                  onSelect={() => setSelected(index)}
                />
              ))}
              {item.myAnswer !== undefined && (
                <AppText color="completed">
                  Sua resposta foi registrada: {item.options[item.myAnswer]}.
                </AppText>
              )}
              {item.result && (
                <>
                  <AppText variant="sectionTitle">Devolutiva da gestão</AppText>
                  <AppText>{item.result}</AppText>
                </>
              )}
            </View>
          )}
          {item.kind === 'action' && (
            <View style={cityStyles.section}>
              <AppText variant="sectionTitle">Etapas da execução</AppText>
              <AppText color="muted">
                Previsão: {new Date(item.dueAt).toLocaleDateString('pt-BR')}
              </AppText>
              {item.updates.map((update, index) => (
                <View key={index} style={cityStyles.row}>
                  <AppText color="muted">
                    {new Date(update.at).toLocaleDateString('pt-BR')} ·{' '}
                    {update.actor}
                  </AppText>
                  <AppText>{update.text}</AppText>
                </View>
              ))}
              {item.evidence.map((url, index) => (
                <Image
                  key={url}
                  source={{ uri: assetUrl(url) }}
                  accessibilityLabel={'Evidência da ação ' + (index + 1)}
                  style={{
                    height: 220,
                    width: '100%',
                    borderRadius: 28,
                    resizeMode: 'cover',
                  }}
                />
              ))}
            </View>
          )}
          {(item.history?.length || 0) > 0 && (
            <DetailSection title="Histórico de decisões">
              {item.history?.map((event, index) => (
                <View key={index} style={cityStyles.row}>
                  <AppText color="muted">
                    {new Date(event.at).toLocaleString('pt-BR')} · {event.actor}
                  </AppText>
                  <AppText>{event.text}</AppText>
                </View>
              ))}
            </DetailSection>
          )}
          {item.linkedIds.length > 0 && (
            <DetailSection title="Contribuições e ações relacionadas">
              {item.linkedIds.map((link) => (
                <AppButton
                  key={link}
                  title="Abrir participação relacionada"
                  variant="quiet"
                  onPress={() =>
                    router.push({
                      pathname: '/RelatedScreen',
                      params: { id: link },
                    })
                  }
                />
              ))}
            </DetailSection>
          )}

          <DeleteRecord item={item} path={path} />
          <DetailSection title="Contribuições da comunidade">
            {item.comments.map((c) => (
              <CommunityComment key={c.id} comment={c} path={path} />
            ))}
            <AppInput
              label="Adicionar informação"
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={2000}
            />
            <AppButton
              title="Publicar contribuição"
              variant="secondary"
              disabled={!comment.trim()}
              loading={change.isPending}
              onPress={() =>
                send('/comments', 'POST', { text: comment.trim() })
              }
            />
          </DetailSection>
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
