import React, { useState } from 'react';
import { View, Linking, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { DetailSheet, DetailSection } from '@/components/ui/DetailSheet';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppToast } from '@/components/ui/AppToast';
import { openExternal } from '@/services/openExternal';
import { MapboxMapView } from '@/components/ui/MapboxMapView';
import { QueryState } from '@/features/city/CityUI';
import { usePublicFacility } from '@/features/territory/usePublicData';
import {
  facilityLabels,
  facilityIcons,
  facilityColors,
  facilityNeighborhoodLabel,
} from '@/features/territory/selectors';
import { facilityTitle } from './FacilityRow';
import { useTheme } from '@/theme/useTheme';
import { layout } from '@/theme/layout';
export function FacilityDetails({
  id,
  onBack,
}: {
  id?: string;
  onBack: () => void;
}) {
  const query = usePublicFacility(id);
  const { colors, isDark } = useTheme();
  const item = query.data;
  const [linkError, setLinkError] = useState<string | null>(null);

  const handleOpenDirections = async () => {
    if (!item?.location) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { latitude, longitude } = item.location;
    const label = encodeURIComponent(facilityTitle(item));
    const url =
      Platform.OS === 'ios'
        ? `maps:0,0?q=${label}@${latitude},${longitude}`
        : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;
    const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    const supported = await Linking.canOpenURL(url).catch(() => false);
    if (!(await openExternal(supported ? url : fallbackUrl, fallbackUrl)))
      setLinkError('Não foi possível abrir o mapa. Tente novamente.');
  };

  const handleCall = async () => {
    if (!item?.phone) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const cleaned = item.phone.replace(/[^0-9+]/g, '');
    const url = `tel:${cleaned}`;
    if (!(await openExternal(url)))
      setLinkError('Não foi possível abrir o discador neste aparelho.');
  };

  return (
    <>
    <DetailSheet
      title={item ? facilityLabels[item.category] : 'Equipamento público'}
      onBack={onBack}
      onRefresh={query.refetch}
    >
      <QueryState
        loading={query.isLoading}
        error={query.error}
        retry={query.refetch}
      />
      {item ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons
              name={facilityIcons[item.category]}
              size={layout.iconSize.lg}
              color={colors.ink}
            />
            <AppText variant="title" style={{ flex: 1 }}>
              {facilityTitle(item)}
            </AppText>
          </View>
          <AppText color="muted">
            {[item.facilityType, item.activity].filter(Boolean).join(' · ') ||
              'Situação cadastral não informada'}
          </AppText>
          <DetailSection title="Onde fica">
            <AppText selectable>
              {item.address || 'Endereço não informado'}
            </AppText>
            <AppText color="muted">{facilityNeighborhoodLabel(item)}</AppText>
            {item.location && (
              <AppButton
                title="Como chegar (abrir rota no GPS)"
                variant="secondary"
                onPress={handleOpenDirections}
              />
            )}
          </DetailSection>
          {item.location && (
            <View style={{ height: 230, borderRadius: layout.radius.card, overflow: 'hidden' }}>
              <MapboxMapView
                region={{ ...item.location, zoom: 16 }}
                markers={[
                  {
                    id: item.id,
                    ...item.location,
                    title: facilityTitle(item),
                    kind: item.category,
                    color: facilityColors[item.category],
                  },
                ]}
                boundary={
                  item.geometry?.type === 'Point' ? undefined : item.geometry
                }
                isDark={isDark}
              />
            </View>
          )}
          {item.locationDerived && (
            <AppText variant="caption" color="muted">
              Ponto interno do espaço público; não indica uma entrada.
            </AppText>
          )}
          <DetailSection title="Contato e funcionamento">
            <AppText selectable>
              {item.phone || 'Telefone não informado'}
            </AppText>
            {Boolean(item.phone) && (
              <AppButton
                title={`Ligar para a unidade (${item.phone})`}
                variant="secondary"
                onPress={handleCall}
              />
            )}
            <AppText selectable>
              {item.openingHours || 'Horário não informado'}
            </AppText>
            <AppText variant="caption" color="muted">
              Cadastro público; confirme o funcionamento com a unidade.
            </AppText>
          </DetailSection>
          <DetailSection title="Fonte do cadastro">
            <AppText>{item.provenance.name}</AppText>
            <AppText variant="caption" color="muted">
              {item.provenance.attribution}
            </AppText>
            <AppText variant="caption" color="muted">
              Importado em{' '}
              {item.provenance.publishedAt
                ? new Date(item.provenance.publishedAt).toLocaleDateString(
                    'pt-BR',
                  )
                : 'data não informada'}
              . Atualização na origem:{' '}
              {item.provenance.sourceUpdatedAt
                ? new Date(item.provenance.sourceUpdatedAt).toLocaleDateString(
                    'pt-BR',
                  )
                : 'não informada'}
              .
            </AppText>
            {item.provenance.state === 'stale' && (
              <AppText color="attention">
                Exibindo a última publicação disponível.
              </AppText>
            )}
            <AppButton
              title="Consultar fonte oficial"
              variant="secondary"
              onPress={() => {
                void openExternal(item.provenance.officialUrl).then((ok) => {
                  if (!ok) setLinkError('Não foi possível abrir a fonte oficial.');
                });
              }}
            />
          </DetailSection>
        </>
      ) : !query.isLoading && !query.error ? (
        <AppText>Cadastro indisponível. Volte à exploração.</AppText>
      ) : null}
    </DetailSheet>
    <AppToast message={linkError} type="error" onDismiss={() => setLinkError(null)} />
    </>
  );
}
