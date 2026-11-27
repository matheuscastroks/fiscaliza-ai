import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';
import { layout } from '@/theme/layout';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { TerritoryListRow } from './TerritoryListRow';
import type { Entry } from './TerritoryPreviewCard';
import { spacing } from '@/theme/spacing';

interface Props {
  entries: Entry[];
  offline: boolean;
  total: number;
  loading: boolean;
  loadingMore: boolean;
  error: boolean;
  onOpen: (entry: Entry) => void;
  onClose: () => void;
  onLoadMore?: () => void;
  onRetry: () => void;
}

function Separator() {
  const { colors } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.dividerSubtle }} />;
}

export function TerritoryClusterList({ entries, offline, total, loading, loadingMore, error, onOpen, onClose, onLoadMore, onRetry }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const title = entries[0]?.type === 'facility'
    ? total === 1 ? 'Serviço neste ponto' : total + ' serviços neste ponto'
    : total === 1 ? 'Chamado neste ponto' : total + ' chamados neste ponto';

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <AppText variant="sectionTitle" accessibilityRole="header">{title}</AppText>
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fechar lista deste ponto"
          hitSlop={8}
          style={({ pressed }) => [
            { width: layout.touchTarget.minWidth, height: layout.touchTarget.minHeight, borderRadius: layout.radius.panel, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRecessed },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons name="close" size={layout.iconSize.md} color={colors.ink} />
        </Pressable>
      </View>
      <BottomSheetFlatList<Entry>
        data={entries}
        keyExtractor={(entry) => entry.type + ':' + entry.item.id}
        renderItem={({ item }) => <TerritoryListRow entry={item} onOpen={onOpen} />}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: insets.bottom + spacing.lg }}
        ListEmptyComponent={offline ? undefined : error || loading ? (
          <AppText color="muted" accessibilityLiveRegion="polite">
            {error ? 'Não foi possível carregar os resultados deste ponto.' : 'Carregando resultados…'}
          </AppText>
        ) : !onLoadMore && !loadingMore ? <AppText color="muted">Nenhum resultado neste ponto.</AppText> : undefined}
        ListFooterComponent={
          offline ? (
            <AppText color="muted" accessibilityLiveRegion="polite">
              {entries.length ? 'Sem conexão. Mostrando dados carregados anteriormente.' : 'Sem conexão. A busca recomeça quando a conexão voltar.'}
            </AppText>
          ) : error ? <AppButton title="Tentar novamente" onPress={onRetry} /> :
          entries.length > 0 || loadingMore || onLoadMore ? (
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              <AppText color="muted" variant="caption" accessibilityLiveRegion="polite">
                {loadingMore ? 'Carregando mais resultados…' : `${entries.length} de ${total} resultados`}
              </AppText>
              {onLoadMore && <AppButton title="Carregar mais" variant="secondary" onPress={onLoadMore} />}
            </View>
          ) : undefined
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.4}
      />
    </View>
  );
}
