import { mockProblems } from '@/data/mockData';
import { useAuthStore } from '@/stores/authStore';
import { useStatsStore } from '@/stores/statsStore';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  BounceIn,
  FadeIn,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';

const AnimatedBadgeCard = ({ 
  badge, 
  index 
}: { 
  badge: any; 
  index: number; 
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      scale.value = withSpring(1, {
        damping: 12,
        stiffness: 100,
      });
      opacity.value = withTiming(1, {
        duration: 300,
      });
    }, index * 100);
    
    return () => clearTimeout(timer);
  }, [index, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.badgeCard, animatedStyle]}>
      <View style={[styles.badgeIcon, { backgroundColor: badge.color }]}>
        <Icon name={badge.icon as any} size={20} color="white" />
      </View>
      <Text style={styles.badgeName}>{badge.name}</Text>
      <Text style={styles.badgeDescription}>{badge.description}</Text>
      {badge.earned && (
        <Animated.View 
          entering={BounceIn.delay(index * 100 + 500)}
          style={styles.earnedIndicator}
        >
          <Icon name="check-circle" size={14} color="#4CAF50" />
        </Animated.View>
      )}
    </Animated.View>
  );
};

const AnimatedProgressBadge = ({ 
  badge, 
  index 
}: { 
  badge: any; 
  index: number; 
}) => {
  const progressValue = useSharedValue(0);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      progressValue.value = withTiming(badge.progress, {
        duration: 1000,
      });
    }, index * 200);
    
    return () => clearTimeout(timer);
  }, [index, badge.progress, progressValue]);

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value}%`,
  }));

  const getPointsReward = () => {
    // Calcular pontos baseado no tipo de badge
    if (badge.name.includes('Exemplar')) return 100;
    if (badge.name.includes('Especialista')) return 75;
    if (badge.name.includes('Vigilante')) return 80;
    return 50;
  };

  return (
    <Animated.View 
      entering={SlideInRight.delay(index * 150)}
      style={[
        styles.achievementCard,
        badge.progress > 50 && styles.achievementCardActive
      ]}
    >
      <View style={[
        styles.achievementIcon, 
        { backgroundColor: badge.color + '20' },
        badge.progress > 50 && { backgroundColor: badge.color }
      ]}>
        <Icon 
          name={badge.icon as any} 
          size={20} 
          color={badge.progress > 50 ? 'white' : badge.color} 
        />
      </View>
      
      <View style={styles.achievementInfo}>
        <Text style={[
          styles.achievementTitle,
          badge.progress > 50 && styles.achievementTitleActive
        ]}>
          {badge.name}
        </Text>
        <Text style={styles.achievementDescription}>{badge.description}</Text>
        
        <View style={styles.achievementProgress}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill, 
                { backgroundColor: badge.color },
                progressAnimatedStyle
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{badge.progress}%</Text>
        </View>
        
        <View style={styles.achievementPoints}>
          <Icon name="stars" size={12} color="#FFD700" />
          <Text style={styles.achievementPointsText}>+{getPointsReward()} pts ao completar</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const AnimatedStatCard = ({ 
  stat, 
  index 
}: { 
  stat: any; 
  index: number; 
}) => {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(-10);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
      rotation.value = withSpring(0, {
        damping: 12,
        stiffness: 100,
      });
    }, index * 100);
    
    return () => clearTimeout(timer);
  }, [index, scale, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
  }));

  return (
    <Animated.View style={[styles.statCard, animatedStyle]}>
      <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
        <Icon name={stat.icon as any} size={20} color={stat.color} />
      </View>
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
    </Animated.View>
  );
};

const RecentActivityCard = ({ 
  activity, 
  index 
}: { 
  activity: any; 
  index: number; 
}) => {
  return (
    <Animated.View 
      entering={FadeIn.delay(index * 100)}
      style={styles.activityCard}
    >
      <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
        <Icon name={activity.icon as any} size={16} color={activity.color} />
      </View>
      <View style={styles.activityInfo}>
        <Text style={styles.activityTitle}>{activity.title}</Text>
        <Text style={styles.activityTime}>{activity.time}</Text>
      </View>
    </Animated.View>
  );
};

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { userStats, ranking, isLoading, lastUpdated, loadUserStats, loadRanking } = useStatsStore();
  const [refreshing, setRefreshing] = React.useState(false);

  // Usar dados reais do mockData ou dados padrão se não logado
  const userData = user || {
    id: '1',
    name: 'João Silva',
    level: 5,
    points: 1250,
    ranking: 47,
    badges: [],
    streak: 7,
    lastActivity: '2024-01-15T14:30:00.000Z',
    totalComments: 12,
    joinedDaysAgo: 45,
    nextLevelPoints: 1500,
    avatar: undefined,
  };

  const loadUserData = React.useCallback(async () => {
    try {
      await Promise.all([
        loadUserStats(userData.id),
        loadRanking(),
      ]);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setRefreshing(false);
    }
  }, [userData.id, loadUserStats, loadRanking]);

  React.useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  React.useEffect(() => {
    if (lastUpdated > 0) {
      loadUserData();
    }
  }, [lastUpdated, loadUserData]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadUserData();
  }, [loadUserData]);

  // Usar badges reais do usuário
  const userBadges = userData.badges || [];
  const earnedBadges = userBadges.filter(badge => badge.earned);
  const nextBadges = userBadges.filter(badge => !badge.earned && badge.progress > 0);

  const getDisplayStats = () => {
    const userInRanking = ranking?.find((u: any) => u.id === userData.id);
    
    return [
      { 
        label: 'Reportes', 
        value: userStats?.problemsReported || mockProblems.filter(p => p.reportedBy === userData.id).length, 
        icon: 'report-problem', 
        color: '#F44336'
      },
      { 
        label: 'Resolvidos', 
        value: userStats?.problemsResolved || mockProblems.filter(p => p.reportedBy === userData.id && p.status === 'resolved').length, 
        icon: 'check-circle', 
        color: '#4CAF50'
      },
      { 
        label: 'Comentários', 
        value: userStats?.totalComments || userData.totalComments || mockProblems.reduce((sum, p) => sum + p.comments.filter(c => c.userId === userData.id).length, 0), 
        icon: 'comment', 
        color: '#2196F3'
      },
      { 
        label: 'Ranking', 
        value: `#${userInRanking?.ranking || userData.ranking}`, 
        icon: 'leaderboard', 
        color: '#FF9800'
      },
    ];
  };

  const getRecentActivities = () => {
    const activities: {
      id: string;
      title: string;
      time: string;
      icon: string;
      color: string;
    }[] = [];
    
    // Buscar problemas reportados pelo usuário (atividades reais do mockData)
    const userProblems = mockProblems
      .filter(p => p.reportedBy === userData.id)
      .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
      .slice(0, 2);
    
    userProblems.forEach(problem => {
      const timeAgo = getTimeAgo(problem.reportedAt);
      activities.push({
        id: `report-${problem.id}`,
        title: `Reportou: ${problem.title}`,
        time: timeAgo,
        icon: 'report',
        color: '#F44336'
      });
    });

    // Buscar comentários do usuário
    const userComments: {
      problemTitle: string;
      comment: any;
      problemId: string;
    }[] = [];
    mockProblems.forEach(problem => {
      problem.comments
        .filter(comment => comment.userId === userData.id)
        .forEach(comment => {
          userComments.push({
            problemTitle: problem.title,
            comment,
            problemId: problem.id
          });
        });
    });
    
    userComments
      .sort((a, b) => new Date(b.comment.createdAt).getTime() - new Date(a.comment.createdAt).getTime())
      .slice(0, 1)
      .forEach(item => {
        const timeAgo = getTimeAgo(item.comment.createdAt);
        activities.push({
          id: `comment-${item.comment.id}`,
          title: `Comentou em "${item.problemTitle.substring(0, 30)}..."`,
          time: timeAgo,
          icon: 'comment',
          color: '#2196F3'
        });
      });

    // Buscar badges conquistadas recentemente
    const recentBadges = earnedBadges
      .filter(badge => badge.earnedAt)
      .sort((a, b) => new Date(b.earnedAt!).getTime() - new Date(a.earnedAt!).getTime())
      .slice(0, 1);
    
    recentBadges.forEach(badge => {
      const timeAgo = getTimeAgo(badge.earnedAt!);
      activities.push({
        id: `badge-${badge.id}`,
        title: `Conquistou "${badge.name}"`,
        time: timeAgo,
        icon: 'emoji-events',
        color: badge.color
      });
    });

    return activities.slice(0, 3);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      if (diffHours === 1) return 'Há 1 hora';
      return `Há ${diffHours} horas`;
    }
    if (diffDays === 1) return 'Ontem';
    if (diffDays === 2) return 'Anteontem';
    return `${diffDays} dias atrás`;
  };

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hoje';
    if (diffDays === 2) return 'Ontem';
    return `${diffDays-1} dias atrás`;
  };

  const getProgressToNextLevel = () => {
    const currentPoints = userData.points;
    const nextLevelPoints = userData.nextLevelPoints;
    const previousLevelPoints = (userData.level - 1) * 250; // Assumindo 250 pontos por nível
    
    const progress = ((currentPoints - previousLevelPoints) / (nextLevelPoints - previousLevelPoints)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Deseja realmente sair do aplicativo?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/LoginScreen');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header - Fixo no topo com medidas consistentes */}
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Olá, {userData.name.split(' ')[0]}! 👋</Text>
          <Text style={styles.subtitle}>Cidadão Ativo • {userData.joinedDaysAgo} dias no app</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="notifications" size={24} color="#2E7D32" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction} onPress={handleLogout}>
            <Icon name="logout" size={24} color="#2E7D32" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Card Principal do Usuário */}
        <Animated.View 
          entering={FadeIn.delay(200)}
          style={styles.mainProfileCard}
        >
          {/* Avatar e Info Básica */}
          <View style={styles.profileHeader}>
            <Animated.View 
              entering={BounceIn.delay(300)}
              style={styles.avatarContainer}
            >
              <View style={styles.avatar}>
                {userData.avatar ? (
                  <Image 
                    source={{ uri: userData.avatar }} 
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Icon name="person" size={32} color="#2E7D32" />
                )}
              </View>
              <View style={styles.levelBadge}>
                <Icon name="stars" size={12} color="#FFD700" />
                <Text style={styles.levelText}>{userData.level}</Text>
              </View>
            </Animated.View>
            
            <View style={styles.userMainInfo}>
              <Text style={styles.userName}>{userData.name}</Text>
              <Text style={styles.userTitle}>#{userData.ranking} • {userData.points.toLocaleString()} pontos</Text>
              
              {/* Barra de Progresso para Próximo Nível */}
              <View style={styles.levelProgressContainer}>
                <Text style={styles.levelProgressLabel}>Progresso para Nível {userData.level + 1}</Text>
                <View style={styles.levelProgressBar}>
                  <Animated.View 
                    entering={FadeIn.delay(800)}
                    style={[styles.levelProgressFill, { width: `${getProgressToNextLevel()}%` }]} 
                  />
                </View>
                <Text style={styles.levelProgressText}>
                  {userData.points} / {userData.nextLevelPoints}
                </Text>
              </View>
            </View>
          </View>

          {/* Streak e Última Atividade */}
          <View style={styles.activityRow}>
            <View style={styles.streakContainer}>
              <Icon name="local-fire-department" size={16} color="#FF5722" />
              <Text style={styles.streakText}>{userData.streak} dias</Text>
              <Text style={styles.streakLabel}>Sequência</Text>
            </View>
            <View style={styles.lastActivityContainer}>
              <Icon name="schedule" size={16} color="#666" />
              <Text style={styles.lastActivityText}>
                Ativo {formatLastActivity(userData.lastActivity)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Estatísticas Rápidas */}
        <View style={styles.quickStatsSection}>
          <Text style={styles.sectionTitle}>Estatísticas</Text>
          <View style={styles.quickStatsGrid}>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <View key={index} style={[styles.statCard, styles.loadingCard]}>
                  <View style={styles.loadingDot} />
                  <View style={styles.loadingLine} />
                </View>
              ))
            ) : (
              getDisplayStats().map((stat: any, index: number) => (
                <AnimatedStatCard 
                  key={index}
                  stat={stat}
                  index={index}
                />
              ))
            )}
          </View>
        </View>

        {/* Badges Conquistadas */}
        {earnedBadges.length > 0 && (
          <View style={styles.badgesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Conquistas ({earnedBadges.length}/{userBadges.length})</Text>
              <TouchableOpacity onPress={() => router.push('/PointsGuideScreen')}>
                <Text style={styles.seeAllText}>Ver todas</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.badgesGrid}>
              {earnedBadges.slice(0, 4).map((badge, index) => (
                <AnimatedBadgeCard
                  key={badge.id}
                  badge={badge}
                  index={index}
                />
              ))}
            </View>
          </View>
        )}

        {/* Próximas Conquistas - Melhorado com base no PointsGuideScreen */}
        {nextBadges.length > 0 && (
          <View style={styles.nextBadgesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Próximas Conquistas</Text>
              <TouchableOpacity onPress={() => router.push('/PointsGuideScreen')}>
                <Text style={styles.seeAllText}>Como ganhar</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionSubtitle}>
              Continue contribuindo para desbloquear essas conquistas
            </Text>
            <View style={styles.achievementsGrid}>
              {nextBadges.slice(0, 2).map((badge, index) => (
                <AnimatedProgressBadge
                  key={badge.id}
                  badge={badge}
                  index={index}
                />
              ))}
            </View>
          </View>
        )}

        {/* Atividade Recente */}
        <View style={styles.recentActivitySection}>
          <Text style={styles.sectionTitle}>Atividade Recente</Text>
          {getRecentActivities().length > 0 ? (
            getRecentActivities().map((activity, index) => (
              <RecentActivityCard
                key={activity.id}
                activity={activity}
                index={index}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="timeline" size={32} color="#ccc" />
              <Text style={styles.emptyStateText}>
                Nenhuma atividade recente. Comece reportando um problema!
              </Text>
            </View>
          )}
        </View>

        {/* Ações Rápidas */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Ações</Text>
          
          <Animated.View entering={FadeIn.delay(1500)}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/HistoryScreen')}
            >
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: '#2196F3' + '20' }]}>
                  <Icon name="history" size={18} color="#2196F3" />
                </View>
                <View>
                  <Text style={styles.actionText}>Meus Reportes</Text>
                  <Text style={styles.actionSubtext}>Ver histórico completo</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={18} color="#666" />
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View entering={FadeIn.delay(1600)}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/RankingScreen')}
            >
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: '#FF9800' + '20' }]}>
                  <Icon name="leaderboard" size={18} color="#FF9800" />
                </View>
                <View>
                  <Text style={styles.actionText}>Ranking</Text>
                  <Text style={styles.actionSubtext}>Você está em #{userData.ranking}º lugar</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={18} color="#666" />
            </TouchableOpacity>
          </Animated.View>

        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Header - Consistente com ReportScreen
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerButton: {
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    position: 'relative',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerAction: {
    padding: 12,
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#F44336',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  mainProfileCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#2E7D32',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  levelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  userMainInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  userTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  levelProgressContainer: {
    marginTop: 8,
  },
  levelProgressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  levelProgressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 4,
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  levelProgressText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  streakLabel: {
    fontSize: 12,
    color: '#666',
  },
  lastActivityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lastActivityText: {
    fontSize: 12,
    color: '#666',
  },
  quickStatsSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '47%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statIcon: {
    borderRadius: 20,
    padding: 10,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  badgesSection: {
    margin: 16,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '47%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    position: 'relative',
  },
  badgeIcon: {
    borderRadius: 20,
    padding: 10,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  earnedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  nextBadgesSection: {
    margin: 16,
  },
  // Melhorado baseado no PointsGuideScreen
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: '47%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    opacity: 0.8,
  },
  achievementCardActive: {
    opacity: 1,
    elevation: 4,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  achievementTitleActive: {
    color: '#333',
  },
  achievementDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  achievementProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  achievementPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  achievementPointsText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FF8F00',
  },
  recentActivitySection: {
    margin: 16,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  activityIcon: {
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  actionsSection: {
    margin: 16,
  },
  actionButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    borderRadius: 12,
    padding: 10,
    marginRight: 12,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  actionSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  loadingCard: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  loadingDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    marginBottom: 8,
  },
  loadingLine: {
    width: '70%',
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E0E0E0',
    marginBottom: 4,
  },
});