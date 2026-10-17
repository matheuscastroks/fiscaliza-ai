import { User } from '@/data/mockData';
import { useAuthStore } from '@/stores/authStore';
import { useStatsStore } from '@/stores/statsStore';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

interface RankingUser extends Omit<User, 'password'> {
  problemsReported: number;
  problemsResolved: number;
  totalVotes: number;
  efficiency: number;
}

const categories = [
  { id: 'points', name: 'Pontos', icon: 'star', color: '#2E7D32', description: 'Pontuação geral' },
  { id: 'reports', name: 'Reportes', icon: 'report', color: '#F44336', description: 'Problemas reportados' },
  { id: 'resolved', name: 'Resolvidos', icon: 'check-circle', color: '#4CAF50', description: 'Problemas resolvidos' },
  { id: 'votes', name: 'Votos', icon: 'thumb-up', color: '#FF9800', description: 'Aprovações recebidas' },
];

const PodiumCard = ({ 
  user, 
  position, 
  category,
  isCurrentUser
}: { 
  user: RankingUser; 
  position: number; 
  category: string;
  isCurrentUser: boolean;
}) => {
  const getValue = () => {
    switch (category) {
      case 'points': return user.points.toLocaleString();
      case 'reports': return user.problemsReported.toString();
      case 'resolved': return user.problemsResolved.toString();
      case 'votes': return user.totalVotes.toString();
      default: return user.points.toLocaleString();
    }
  };

  const getPositionColors = () => {
    switch (position) {
      case 1: return { bg: '#FFD700', text: '#B45309', icon: '🥇' };
      case 2: return { bg: '#C0C0C0', text: '#666', icon: '🥈' };
      case 3: return { bg: '#CD7F32', text: '#92400E', icon: '🥉' };
      default: return { bg: '#F5F5F5', text: '#666', icon: '' };
    }
  };

  const colors = getPositionColors();

  return (
    <View style={[styles.newPodiumCard, { backgroundColor: colors.bg }]}>
      <Text style={styles.newPodiumPosition}>{colors.icon}</Text>
      <View style={[styles.newPodiumAvatar, isCurrentUser && styles.currentUserAvatar]}>
        <Text style={styles.avatarText}>
          {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
        </Text>
      </View>
      <Text style={[styles.newPodiumName, { color: colors.text }]} numberOfLines={1}>
        {user.name}
      </Text>
      <Text style={[styles.newPodiumValue, { color: colors.text }]}>
        {getValue()}
      </Text>
      <Text style={[styles.newPodiumCategory, { color: colors.text }]}>
        {categories.find(c => c.id === category)?.name}
      </Text>
    </View>
  );
};

const RankingCard = ({ 
  user, 
  position, 
  category, 
  isCurrentUser,
  index 
}: { 
  user: RankingUser; 
  position: number; 
  category: string;
  isCurrentUser: boolean;
  index: number; 
}) => {
  const getValue = () => {
    switch (category) {
      case 'points': return user.points.toLocaleString();
      case 'reports': return user.problemsReported.toString();
      case 'resolved': return user.problemsResolved.toString();
      case 'votes': return user.totalVotes.toString();
      default: return user.points.toLocaleString();
    }
  };

  const getSecondaryInfo = () => {
    switch (category) {
      case 'points': return `${user.problemsReported} reportes • ${user.efficiency}% eficiência`;
      case 'reports': return `${user.points} pontos • Nível ${user.level}`;
      case 'resolved': return `${user.totalVotes} votos • ${user.efficiency}% eficiência`;
      case 'votes': return `${user.points} pontos • Nível ${user.level}`;
      default: return `${user.problemsReported} reportes • Nível ${user.level}`;
    }
  };

  const categoryData = categories.find(c => c.id === category);

  return (
    <Animated.View>
      <View style={[styles.rankingCard, isCurrentUser && styles.currentUserCard]}>
        <View style={styles.rankingPosition}>
          <Text style={[styles.positionNumber, isCurrentUser && styles.currentUserText]}>
            #{position}
          </Text>
        </View>
        
        <View style={styles.userSection}>
          <View style={[styles.userAvatar, isCurrentUser && styles.currentUserAvatar]}>
            <Text style={[styles.avatarText, isCurrentUser && { color: '#2E7D32' }]}>
              {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </Text>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={[styles.userName, isCurrentUser && styles.currentUserText]}>
              {user.name}{isCurrentUser ? ' (Você)' : ''}
            </Text>
            <Text style={styles.userSecondary}>
              {getSecondaryInfo()}
            </Text>
          </View>
        </View>
        
        <View style={styles.valueSection}>
          <View style={[styles.valueContainer, { backgroundColor: categoryData?.color + '15' }]}>
            <Icon name={categoryData?.icon as any} size={16} color={categoryData?.color} />
            <Text style={[styles.valueText, { color: categoryData?.color }]}>
              {getValue()}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const CategoryTab = ({ 
  category, 
  isSelected, 
  onPress, 
  index 
}: { 
  category: any; 
  isSelected: boolean; 
  onPress: () => void; 
  index: number; 
}) => (
  <Animated.View>
    <TouchableOpacity
      style={[
        styles.categoryTab,
        isSelected && [styles.selectedTab, { backgroundColor: category.color + '15', borderColor: category.color }]
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon 
        name={category.icon as any} 
        size={18} 
        color={isSelected ? category.color : '#666'} 
      />
      <Text style={[
        styles.categoryTabText,
        isSelected && { color: category.color, fontWeight: '600' }
      ]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  </Animated.View>
);

export default function RankingScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { globalStats, ranking, isLoading, lastUpdated, loadGlobalStats, loadRanking } = useStatsStore();
  const [selectedCategory, setSelectedCategory] = useState('points');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadGlobalStats(),
        loadRanking(),
      ]);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setRefreshing(false);
    }
  }, [loadGlobalStats, loadRanking]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (lastUpdated > 0) {
      loadData();
    }
  }, [lastUpdated, loadData]);

  const sortedRanking = React.useMemo(() => {
    if (!ranking) return [];
    
    return [...ranking].sort((a, b) => {
      switch (selectedCategory) {
        case 'reports': return (b.problemsReported || 0) - (a.problemsReported || 0);
        case 'resolved': return (b.problemsResolved || 0) - (a.problemsResolved || 0);
        case 'votes': return (b.totalVotes || 0) - (a.totalVotes || 0);
        default: return b.points - a.points;
      }
    });
  }, [ranking, selectedCategory]);

  const currentUserPosition = sortedRanking.findIndex(u => u.id === user?.id) + 1;
  const topThree = sortedRanking.slice(0, 3);
  const restOfRanking = sortedRanking.slice(3);

  const onRefresh = useCallback(() => {
    loadData();
  }, [loadData]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2E7D32']}
            tintColor="#2E7D32"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#2E7D32" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Ranking da Comunidade</Text>
            <Text style={styles.headerSubtitle}>Ilha do Governador</Text>
          </View>
          <TouchableOpacity 
            style={styles.headerAction}
            onPress={() => {}}
          >
            <Icon name="info-outline" size={24} color="#2E7D32" />
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Overview */}
        {globalStats && (
          <Animated.View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Estatísticas da Comunidade</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Icon name="people" size={24} color="#2E7D32" />
                <Text style={styles.statNumber}>{globalStats.totalUsers}</Text>
                <Text style={styles.statLabel}>Usuários Ativos</Text>
              </View>
              <View style={styles.statCard}>
                <Icon name="assignment" size={24} color="#F44336" />
                <Text style={styles.statNumber}>{globalStats.totalProblems}</Text>
                <Text style={styles.statLabel}>Problemas Reportados</Text>
              </View>
              <View style={styles.statCard}>
                <Icon name="check-circle" size={24} color="#4CAF50" />
                <Text style={styles.statNumber}>{globalStats.resolvedProblems}</Text>
                <Text style={styles.statLabel}>Problemas Resolvidos</Text>
              </View>
            </View>
            <View style={styles.progressSection}>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${(globalStats.resolvedProblems / globalStats.totalProblems) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round((globalStats.resolvedProblems / globalStats.totalProblems) * 100)}% dos problemas resolvidos
              </Text>
            </View>
          </Animated.View>
        )}

        {/* User Position */}
        {currentUserPosition > 0 && (
          <Animated.View style={styles.userPositionContainer}>
            <View style={styles.userPositionCard}>
              <Icon name="person" size={20} color="#2E7D32" />
              <View style={styles.userPositionInfo}>
                <Text style={styles.userPositionText}>Sua posição atual: #{currentUserPosition}</Text>
                <Text style={styles.userPositionCategory}>
                  Categoria: {categories.find(c => c.id === selectedCategory)?.name}
                </Text>
              </View>
              <Icon name="keyboard-arrow-right" size={20} color="#2E7D32" />
            </View>
          </Animated.View>
        )}

        {/* Categories */}
        <Animated.View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Filtrar por categoria</Text>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <CategoryTab
                category={item}
                isSelected={selectedCategory === item.id}
                onPress={() => setSelectedCategory(item.id)}
                index={index}
              />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.categoriesList}
          />
        </Animated.View>

        {/* Podium */}
        {topThree.length > 0 && (
          <Animated.View style={styles.newPodiumSection}>
            <Text style={styles.sectionTitle}>Pódio dos Campeões</Text>
            <View style={styles.newPodiumContainer}>
              {topThree[1] && (
                <PodiumCard
                  user={topThree[1]}
                  position={2}
                  category={selectedCategory}
                  isCurrentUser={topThree[1].id === user?.id}
                />
              )}
              
              {topThree[0] && (
                <PodiumCard
                  user={topThree[0]}
                  position={1}
                  category={selectedCategory}
                  isCurrentUser={topThree[0].id === user?.id}
                />
              )}
              
              {topThree[2] && (
                <PodiumCard
                  user={topThree[2]}
                  position={3}
                  category={selectedCategory}
                  isCurrentUser={topThree[2].id === user?.id}
                />
              )}
            </View>
          </Animated.View>
        )}

        {/* Ranking List */}
        {isLoading ? (
          <Animated.View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.loadingText}>Carregando ranking...</Text>
          </Animated.View>
        ) : restOfRanking.length > 0 && (
          <Animated.View style={styles.rankingSection}>
            <Text style={styles.sectionTitle}>Classificação Geral</Text>
            <FlatList
              data={restOfRanking}
              renderItem={({ item, index }) => (
                <RankingCard
                  user={item}
                  position={index + 4}
                  category={selectedCategory}
                  isCurrentUser={item.id === user?.id}
                  index={index}
                />
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.rankingList}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          </Animated.View>
        )}
        
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
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
  backButton: {
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerAction: {
    padding: 12,
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statsContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  progressSection: {
    marginTop: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  userPositionContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  userPositionCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  userPositionInfo: {
    flex: 1,
  },
  userPositionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  userPositionCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  categoriesSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 120,
  },
  selectedTab: {
    borderWidth: 1,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  newPodiumSection: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  newPodiumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 220,
  },
  newPodiumCard: {
    width: '30%',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  newPodiumPosition: {
    fontSize: 24,
    marginBottom: 8,
  },
  newPodiumAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  newPodiumName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  newPodiumValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  newPodiumCategory: {
    fontSize: 12,
    textAlign: 'center',
  },
  rankingSection: {
    paddingHorizontal: 16,
  },
  rankingList: {
    gap: 8,
  },
  rankingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  currentUserCard: {
    borderWidth: 2,
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E8',
  },
  rankingPosition: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  positionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  userSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  currentUserAvatar: {
    backgroundColor: '#E8F5E8',
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  currentUserText: {
    color: '#2E7D32',
  },
  userSecondary: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  valueSection: {
    alignItems: 'flex-end',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  valueText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  bottomSpace: {
    height: 20,
  },
}); 