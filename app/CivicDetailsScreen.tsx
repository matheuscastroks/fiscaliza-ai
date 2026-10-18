import { goBack } from '@/utils/navigation';
import React, { useState, useEffect } from 'react';
import { Image, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { DetailSheet, DetailSection } from '@/components/ui/DetailSheet';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import {
  QueryState,
  cityStyles,
  kindLabel,
  statusLabel,
} from '@/features/city/CityUI';
import { useCityQuery } from '@/features/city/useCityQuery';
import { assetUrl, mutation } from '@/services/http';
import type { CivicItem } from '@/shared/contracts';
export default function CivicDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const path = '/civic-items/' + encodeURIComponent(id || '');
  const query = useCityQuery<CivicItem>(path);
  const item = query.data;
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
      void query.refetch();
    },
  });
  const send = (suffix: string, method: string, body?: unknown) =>
    change.mutate({ suffix, method, body });
  return (
    <DetailSheet
      title={item ? kindLabel[item.kind] : 'Participação'}
      image={
        item?.kind === 'proposal' && item.images?.[0]
          ? assetUrl(item.images[0])
          : item?.kind === 'action' && item.evidence[0]
            ? assetUrl(item.evidence[0])
            : undefined
      }
      onBack={() => goBack()}
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
          <AppText color="accent">
            {statusLabel[item.status]} · {item.neighborhood}
          </AppText>
          <AppText variant="screenTitle">{item.title}</AppText>
          <AppText>{item.body}</AppText>
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
              {item.options.map((option, index) => (
                <AppButton
                  key={index}
                  title={
                    option +
                    (item.status === 'closed'
                      ? ' — ' + (item.answerCounts[index] || 0) + ' respostas'
                      : '')
                  }
                  variant={
                    (selected ?? item.myAnswer) === index
                      ? 'primary'
                      : 'secondary'
                  }
                  accessibilityState={{
                    selected: (selected ?? item.myAnswer) === index,
                  }}
                  disabled={
                    item.status === 'closed' ||
                    new Date(item.closesAt).getTime() <= clock ||
                    change.isPending
                  }
                  onPress={() => setSelected(index)}
                />
              ))}
              {item.status === 'open' &&
                new Date(item.closesAt).getTime() > clock && (
                  <AppButton
                    title={
                      item.myAnswer === undefined
                        ? 'Registrar resposta'
                        : 'Atualizar resposta'
                    }
                    loading={change.isPending}
                    disabled={selected === undefined}
                    onPress={() => send('/answer', 'PUT', { option: selected })}
                  />
                )}
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
              <AppText variant="sectionTitle">
                Execução: {item.progress}%
              </AppText>
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
              {item.evidence.slice(1).map((url, index) => (
                <Image
                  key={url}
                  source={{ uri: assetUrl(url) }}
                  accessibilityLabel={'Evidência da ação ' + (index + 1)}
                  style={{ height: 200, width: '100%', resizeMode: 'cover' }}
                />
              ))}
            </View>
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
          <View style={cityStyles.controls}>
            {item.kind === 'proposal' && (
              <AppButton
                title={
                  item.supportedByMe
                    ? 'Retirar apoio (' + item.supports + ')'
                    : 'Apoiar (' + item.supports + ')'
                }
                variant="secondary"
                disabled={change.isPending}
                onPress={() =>
                  send('/support', item.supportedByMe ? 'DELETE' : 'PUT')
                }
              />
            )}
          </View>
          <DetailSection title="Contribuições da comunidade">
            {item.comments.map((c) => (
              <View key={c.id} style={cityStyles.row}>
                <AppText variant="label">{c.userName}</AppText>
                <AppText>{c.text}</AppText>
              </View>
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
      {change.error && change.variables?.suffix !== '/follow' && (
        <AppText color="risk" accessibilityLiveRegion="polite">
          {change.error.message}
        </AppText>
      )}
    </DetailSheet>
  );
}
