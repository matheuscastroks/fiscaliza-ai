import React, { useState, useEffect } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
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
    <AppScreen>
      <AppHeader
        title={item ? kindLabel[item.kind] : 'Participação'}
        onBack={() => router.back()}
      />
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
            <AppText color="accent">
              {statusLabel[item.status]} · {item.neighborhood}
            </AppText>
            <AppText variant="screenTitle">{item.title}</AppText>
            <AppText>{item.body}</AppText>
            <AppText color="muted">
              Responsável: {item.responsible || 'Gestão municipal'}
            </AppText>
            {(item.history?.length || 0) > 0 && (
              <View style={cityStyles.section}>
                <AppText variant="sectionTitle">Histórico de decisões</AppText>
                {item.history?.map((event, index) => (
                  <View key={index} style={cityStyles.row}>
                    <AppText color="muted">
                      {new Date(event.at).toLocaleString('pt-BR')} ·{' '}
                      {event.actor}
                    </AppText>
                    <AppText>{event.text}</AppText>
                  </View>
                ))}
              </View>
            )}
            {item.kind === 'proposal' && item.decision && (
              <View style={cityStyles.section}>
                <AppText variant="sectionTitle">Resposta da gestão</AppText>
                <AppText>{item.decision}</AppText>
              </View>
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
                      onPress={() =>
                        send('/answer', 'PUT', { option: selected })
                      }
                    />
                  )}
                {item.myAnswer !== undefined && (
                  <AppText color="completed">
                    Sua resposta foi registrada: {item.options[item.myAnswer]}.
                  </AppText>
                )}
                {item.result && (
                  <>
                    <AppText variant="sectionTitle">
                      Devolutiva da gestão
                    </AppText>
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
                {item.evidence.map((url, index) => (
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
              <View style={cityStyles.section}>
                <AppText variant="sectionTitle">
                  Contribuições e ações relacionadas
                </AppText>
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
              </View>
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
            <View style={cityStyles.section}>
              <AppText variant="sectionTitle">
                Contribuições da comunidade
              </AppText>
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
