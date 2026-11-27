import React, { useState } from 'react';
import { View, Linking, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { DetailSheet, DetailSection } from '@/components/ui/DetailSheet';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppToast } from '@/components/ui/AppToast';
import { openExternal } from '@/services/openExternal';
import { MapboxMapView } from '@/components/ui/MapboxMapView';
import { ScreenState } from '@/components/ui/ScreenState';
import { formatCallDate } from '@/features/city/formatDates';
import { usePublicFacility } from '@/features/territory/usePublicData';
import {
  facilityLabels,
  facilityColors,
  facilityNeighborhoodLabel,
} from '@/features/territory/selectors';
import { facilityTitle } from './FacilityRow';
import { useTheme } from '@/theme/useTheme';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
export function FacilityDetails({
  id,
  onBack,
}: {
  id?: string;
  onBack: () => void;
}) {
  const query = usePublicFacility(id);
  const { isDark } = useTheme();
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
      setLinkError('Não conseguimos abrir o mapa. Tente de novo.');
  };

  const handleCall = async () => {
    if (!item?.phone) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const cleaned = item.phone.replace(/[^0-9+]/g, '');
    const url = `tel:${cleaned}`;
    if (!(await openExternal(url)))
      setLinkError('Não conseguimos abrir o discador neste celular.');
  };

  return (
    <>
    <DetailSheet
      title={item ? facilityLabels[item.category] : 'Serviço público'}
      onBack={onBack}
      onRefresh={query.refetch}
      footer={item && (item.location || item.phone) ? (
        <View style={{ gap: spacing.xs }}>
          {item.location && <AppButton title="Como chegar" onPress={handleOpenDirections} />}
          {item.phone && (
            <AppButton
              title="Ligar para a unidade"
              variant={item.location ? 'secondary' : 'primary'}
              accessibilityLabel={`Ligar para a unidade: ${item.phone}`}
              onPress={handleCall}
            />
          )}
        </View>
      ) : undefined}
    >
      <ScreenState
        loading={query.isLoading}
        error={item ? null : query.error}
        retry={query.refetch}
      />
      {item && query.error && (
        <AppText variant="meta" color="muted" accessibilityLiveRegion="polite">
          Não conseguimos atualizar. Mostrando a última versão.
        </AppText>
      )}
      {item ? (
        <>
          <View style={{ gap: spacing.xs }}>
            <AppText variant="sectionTitle" accessibilityRole="header">
              {facilityTitle(item)}
            </AppText>
            <AppText color="muted">
              {[item.facilityType, item.activity].filter(Boolean).join(' · ') ||
                'Tipo não informado'}
            </AppText>
          </View>
          <DetailSection title="Onde fica">
            <AppText selectable>
              {item.address || 'Endereço não informado'}
            </AppText>
            <AppText color="muted">{facilityNeighborhoodLabel(item)}</AppText>
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
              O ponto marca a área, não a entrada.
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
              Confirme o horário com a unidade.
            </AppText>
          </DetailSection>
          <DetailSection title="De onde vem a informação">
            <AppText>{item.provenance.name}</AppText>
            <AppText variant="caption" color="muted">
              {item.provenance.attribution}
            </AppText>
            <AppText variant="caption" color="muted">
              Divulgado em{' '}
              {formatCallDate(item.provenance.publishedAt) ?? 'data não informada'}
              {' · '}Atualizado na fonte em{' '}
              {formatCallDate(item.provenance.sourceUpdatedAt) ?? 'data não informada'}
            </AppText>
            {item.provenance.state === 'stale' && (
              <AppText color="attention">
                Mostrando a última informação que a Prefeitura divulgou.
              </AppText>
            )}
            <AppButton
              title="Consultar fonte oficial"
              variant="secondary"
              onPress={() => {
                void openExternal(item.provenance.officialUrl).then((ok) => {
                  if (!ok) setLinkError('Não conseguimos abrir a fonte oficial.');
                });
              }}
            />
          </DetailSection>
        </>
      ) : !query.isLoading && !query.error ? (
        <AppText>Não achamos este serviço.</AppText>
      ) : null}
    </DetailSheet>
    <AppToast message={linkError} type="error" onDismiss={() => setLinkError(null)} />
    </>
  );
}
