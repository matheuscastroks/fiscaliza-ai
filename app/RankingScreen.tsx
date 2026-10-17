import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { User } from '@/data/mockData';
import { statsApi } from '@/services/mockApi';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { layout } from '@/theme/layout';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppDivider } from '@/components/ui/AppDivider';
import { DemoNotice } from '@/components/demo/DemoNotice';

export default function RankingScreen() {
  const { user } = useAuthStore();
  const currentUserId = user?.id || 'demo-citizen';

  const [ranking, setRanking] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRanking() {
      setIsLoading(true);
      try {
        const response = await statsApi.getRanking();
        if (response.success && response.data) {
          setRanking(response.data);
        }
      } catch {
        // Fallback silencioso mantendo array vazio
      } finally {
        setIsLoading(false);
      }
    }
    loadRanking();
  }, []);

  const renderItem = ({ item, index }: { item: User; index: number }) => {
    const isCurrentUser = item.id === currentUserId;
    const position = index + 1;

    return (
      <View style={[styles.rankingRow, isCurrentUser && styles.currentUserRow]}>
        <View style={styles.positionCol}>
          <AppText
            variant="label"
            color={position <= 3 ? 'accent' : 'muted'}
            style={styles.positionText}
          >
            #{position}
          </AppText>
        </View>

        <View style={styles.userCol}>
          <View style={styles.nameRow}>
            <AppText variant="label" color="ink">
              {item.name}
            </AppText>
            {isCurrentUser ? (
              <View style={styles.youBadge}>
                <AppText variant="caption" color="accent" style={styles.youBadgeText}>
                  Você
                </AppText>
              </View>
            ) : null}
          </View>
          <AppText variant="caption" color="muted">
            Nível {item.level} · Vila Esperança
          </AppText>
        </View>

        <View style={styles.pointsCol}>
          <AppText variant="label" color="ink" style={styles.pointsText}>
            {item.points}
          </AppText>
          <AppText variant="caption" color="muted">
            pontos
          </AppText>
        </View>
      </View>
    );
  };

  return (
    <AppScreen edges={['top']} style={styles.screen}>
      <AppHeader
        title="Participação Comunitária"
        context="Vila Esperança · dados demonstrativos"
        onBack={() => router.back()}
      />

      <View style={styles.noticeContainer}>
        <DemoNotice
          message="Pontos cívicos e ranking são demonstrativos. A participação cidadã auxilia na priorização comunitária, sem conferir privilégios em serviços públicos reais."
        />
      </View>

      <AppDivider />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={colors.accent} />
          <AppText variant="caption" color="muted" style={styles.loadingText}>
            Carregando ranking comunitário...
          </AppText>
        </View>
      ) : (
        <FlatList
          data={ranking}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <AppDivider />}
          contentContainerStyle={styles.listContent}
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
  },
  noticeContainer: {
    paddingHorizontal: spacing.contentPadding,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  listContent: {
    backgroundColor: colors.surface,
    paddingBottom: spacing.xxl,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.contentPadding,
    paddingVertical: spacing.md,
    minHeight: layout.touchTarget.minHeight,
  },
  currentUserRow: {
    backgroundColor: colors.accentSoft,
  },
  positionCol: {
    width: 40,
    alignItems: 'flex-start',
  },
  positionText: {
    fontWeight: '700',
  },
  userCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  youBadge: {
    backgroundColor: colors.surface,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.accent,
    borderRadius: layout.radius.xs,
    paddingHorizontal: spacing.xs,
    marginLeft: spacing.xs,
  },
  youBadgeText: {
    fontWeight: '600',
    fontSize: 10,
  },
  pointsCol: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.xs,
  },
});