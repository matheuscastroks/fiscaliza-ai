import React from 'react';
import { View, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DetailSheet, DetailSection } from '@/components/ui/DetailSheet';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { OsmMapView } from '@/components/ui/OsmMapView';
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
  return (
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
              size={32}
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
          </DetailSection>
          {item.location && (
            <View style={{ height: 230, borderRadius: 24, overflow: 'hidden' }}>
              <OsmMapView
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
                void Linking.openURL(item.provenance.officialUrl);
              }}
            />
          </DetailSection>
        </>
      ) : !query.isLoading && !query.error ? (
        <AppText>Cadastro indisponível. Volte à exploração.</AppText>
      ) : null}
    </DetailSheet>
  );
}
