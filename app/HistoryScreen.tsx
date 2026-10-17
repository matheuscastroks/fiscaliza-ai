import { Problem } from '@/data/mockData';
import { useAuthStore } from '@/stores/authStore';
import { useProblemsStore } from '@/stores/problemsStore';
import { useStatsStore } from '@/stores/statsStore';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    BounceIn,
    FadeIn,
    SlideInRight,
    SlideInUp,
    ZoomIn
} from 'react-native-reanimated';

const statusConfig = {
  pending: { name: 'Pendente', color: '#F44336', icon: 'schedule' as const },
  in_progress: { name: 'Em Andamento', color: '#FF9800', icon: 'autorenew' as const },
  resolved: { name: 'Resolvido', color: '#4CAF50', icon: 'check-circle' as const },
};

const categories = {
  road: { name: 'Via Pública', icon: 'construction' as const, color: '#F44336' },
  lighting: { name: 'Iluminação', icon: 'lightbulb-outline' as const, color: '#FF9800' },
  cleaning: { name: 'Limpeza', icon: 'delete' as const, color: '#9C27B0' },
  others: { name: 'Outros', icon: 'report-problem' as const, color: '#607D8B' },
};

const filters = [
  { id: 'all', name: 'Todos', color: '#2E7D32', icon: 'list' as const },
  { id: 'pending', name: 'Pendente', color: '#F44336', icon: 'schedule' as const },
  { id: 'in_progress', name: 'Em Andamento', color: '#FF9800', icon: 'autorenew' as const },
  { id: 'resolved', name: 'Resolvido', color: '#4CAF50', icon: 'check-circle' as const },
];

const AnimatedProblemCard = ({ 
  item, 
  index 
}: { 
  item: Problem; 
  index: number; 
}) => {
  const router = useRouter();
  const category = categories[item.category];
  const status = statusConfig[item.status];
  const displayImage = item.images && item.images.length > 0 ? item.images[0] : 'https://oystr.com.br/wp-content/uploads/2022/08/placeholder.png';
  const displayDate = new Date(item.reportedAt).toLocaleDateString('pt-BR');

  return (
    <Animated.View 
      entering={SlideInRight.delay(index * 30)}
    >
      <TouchableOpacity 
        style={styles.problemCard}
        onPress={() => router.push({
          pathname: '/ProblemDetailsScreen',
          params: { problemId: item.id }
        })}
        activeOpacity={0.95}
      >
        {/* Hero Image with Overlay */}
        <View style={styles.cardImageContainer}>
          <Animated.View entering={ZoomIn.delay(index * 30 + 100)}>
            <Image source={{ uri: displayImage }} style={styles.cardImage} />
          </Animated.View>
          <View style={styles.imageOverlay}>
            <View style={styles.topRow}>
              <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
                <Icon name={category.icon} size={14} color={category.color} />
                <Text style={[styles.categoryBadgeText, { color: category.color }]}>
                  {category.name}
                </Text>
              </View>
              <View style={[styles.statusBadgeCard, { backgroundColor: status.color }]}>
                <Icon name={status.icon} size={10} color="white" />
              </View>
            </View>
            {item.priority === 'high' && (
              <View style={styles.priorityBadge}>
                <Icon name="priority-high" size={12} color="white" />
                <Text style={styles.priorityBadgeText}>URGENTE</Text>
              </View>
            )}
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.cardDate}>{displayDate}</Text>
          </View>

          <Text style={styles.cardDescription} numberOfLines={3}>
            {item.description}
          </Text>

          <View style={styles.cardFooter}>
            <View style={styles.cardEngagement}>
              <View style={styles.cardEngagementItem}>
                <Icon name="thumb-up" size={16} color="#4CAF50" />
                <Text style={styles.cardEngagementText}>{item.votes}</Text>
              </View>
              <View style={styles.cardEngagementItem}>
                <Icon name="comment" size={16} color="#2196F3" />
                <Text style={styles.cardEngagementText}>{item.comments.length}</Text>
              </View>
              <View style={styles.cardEngagementItem}>
                <Icon name="location-on" size={16} color="#666" />
                <Text style={styles.cardLocationText} numberOfLines={1}>
                  {item.location.address?.split(',')[0] || 'Localização'}
                </Text>
              </View>
            </View>
            
            <View style={styles.cardAction}>
              <Icon name="arrow-forward" size={20} color="#2E7D32" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // Usar stores para dados centralizados
  const { userProblems: problems, isLoading: loading, lastUpdated } = useProblemsStore();
  const { userStats } = useStatsStore();
  
  const [filteredProblems, setFilteredProblems] = useState<Problem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const loadUserProblems = useCallback(async () => {
    if (!user) return;
    
    // Usar stores para carregar dados
    await useProblemsStore.getState().loadUserProblems(user.id);
    await useStatsStore.getState().loadUserStats(user.id);
  }, [user]);

  useEffect(() => {
    loadUserProblems();
  }, [loadUserProblems]);

  // Recarregar quando lastUpdated mudar (novo report criado)
  useEffect(() => {
    if (lastUpdated > 0 && user) {
      loadUserProblems();
    }
  }, [lastUpdated, user, loadUserProblems]);

  useEffect(() => {
    if (selectedFilter === 'all') {
      setFilteredProblems(problems);
    } else {
      setFilteredProblems(problems.filter(p => p.status === selectedFilter));
    }
  }, [selectedFilter, problems]);

  const renderFilterChip = ({ item, index }: { item: any; index: number }) => (
    <Animated.View entering={FadeIn.delay(index * 100)}>
      <TouchableOpacity
        style={[
          styles.filterChip,
          selectedFilter === item.id && [styles.filterChipSelected, { backgroundColor: item.color + '15', borderColor: item.color }]
        ]}
        onPress={() => setSelectedFilter(item.id)}
        activeOpacity={0.8}
      >
        <Icon 
          name={item.icon} 
          size={14} 
          color={selectedFilter === item.id ? item.color : '#666'} 
        />
        <Text style={[
          styles.filterText,
          selectedFilter === item.id && { color: item.color, fontWeight: '600' }
        ]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderProblemCard = ({ item, index }: { item: Problem; index: number }) => (
    <AnimatedProblemCard item={item} index={index} />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View 
        entering={SlideInUp.delay(100)}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#2E7D32" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Histórico</Text>
          <Text style={styles.subtitle}>
            {filteredProblems.length} encontrado(s) • Seus problemas reportados
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.headerAction}
          onPress={() => router.push('/ReportScreen')}
        >
          <Icon name="add" size={24} color="#2E7D32" />
        </TouchableOpacity>
      </Animated.View>

      {/* Stats Compactas */}
      {userStats && (
        <Animated.View 
          entering={SlideInUp.delay(200)}
          style={styles.statsContainer}
        >
          <Animated.View entering={BounceIn.delay(300)} style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.problemsReported}</Text>
            <Text style={styles.statLabel}>Reportados</Text>
          </Animated.View>
          <Animated.View entering={BounceIn.delay(400)} style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.problemsResolved}</Text>
            <Text style={styles.statLabel}>Resolvidos</Text>
          </Animated.View>
          <Animated.View entering={BounceIn.delay(500)} style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.totalVotes}</Text>
            <Text style={styles.statLabel}>Votos</Text>
          </Animated.View>
          <Animated.View entering={BounceIn.delay(600)} style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.totalComments}</Text>
            <Text style={styles.statLabel}>Comentários</Text>
          </Animated.View>
        </Animated.View>
      )}

      {/* Filtros */}
      <Animated.View 
        entering={SlideInUp.delay(400)}
        style={styles.filtersContainer}
      >
        <FlatList
          data={filters}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={renderFilterChip}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.filtersList}
        />
      </Animated.View>

      {/* Problems List */}
      {loading ? (
        <Animated.View 
          entering={FadeIn}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Carregando histórico...</Text>
        </Animated.View>
      ) : filteredProblems.length === 0 ? (
        <Animated.View 
          entering={FadeIn.delay(500)}
          style={styles.emptyContainer}
        >
          <Icon name="search-off" size={48} color="#CCC" />
          <Text style={styles.emptyText}>Nenhum reporte encontrado</Text>
          <Text style={styles.emptySubtext}>
            {selectedFilter === 'all' 
              ? 'Você ainda não reportou nenhum problema.' 
              : `Você não tem reportes com status "${filters.find(f => f.id === selectedFilter)?.name}".`
            }
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => router.push('/ReportScreen')}
            activeOpacity={0.8}
          >
            <Icon name="add" size={20} color="white" />
            <Text style={styles.emptyButtonText}>Reportar Problema</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <Animated.View 
          entering={FadeIn.delay(500)}
          style={styles.listContainer}
        >
          <FlatList
            data={filteredProblems}
            renderItem={renderProblemCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.problemsList}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Header
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
    marginRight: 16,
  },
  headerCenter: {
    flex: 1,
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
  
  // Stats Container Compacto
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Filtros simples
  filtersContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filtersList: {
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipSelected: {
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  
  // Problem Cards igual ao ProblemsListScreen
  listContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  problemsList: {
    padding: 16,
  },
  problemCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  cardImageContainer: {
    position: 'relative',
    height: 120,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadgeCard: {
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: 'flex-start',
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 24,
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 12,
    color: '#999',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardEngagement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  cardEngagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardEngagementText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  cardLocationText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    maxWidth: 80,
  },
  cardAction: {
    padding: 4,
  },
  
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 