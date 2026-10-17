import { Problem } from '@/data/mockData';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  BounceIn,
  FadeIn,
  SlideInDown,
  SlideInRight,
  SlideInUp,
  ZoomIn
} from 'react-native-reanimated';
import { useProblemsStore } from '../../stores/problemsStore';

const filters = [
  { id: 'all', name: 'Todos', icon: 'list' as const, color: '#2E7D32' },
  { id: 'pending', name: 'Pendente', icon: 'schedule' as const, color: '#F44336' },
  { id: 'in_progress', name: 'Em Andamento', icon: 'autorenew' as const, color: '#FF9800' },
  { id: 'resolved', name: 'Resolvido', icon: 'check-circle' as const, color: '#4CAF50' },
];

const categories = {
  road: { name: 'Via Pública', icon: 'construction' as const, color: '#F44336' },
  lighting: { name: 'Iluminação', icon: 'lightbulb-outline' as const, color: '#FF9800' },
  cleaning: { name: 'Limpeza', icon: 'delete' as const, color: '#9C27B0' },
  others: { name: 'Outros', icon: 'report-problem' as const, color: '#607D8B' },
};

const statusConfig = {
  pending: { name: 'Pendente', color: '#F44336', icon: 'schedule' as const },
  in_progress: { name: 'Em Andamento', color: '#FF9800', icon: 'autorenew' as const },
  resolved: { name: 'Resolvido', color: '#4CAF50', icon: 'check-circle' as const },
};

// Mock de bairros da Ilha do Governador
const neighborhoods = [
  'Todos os Bairros',
  'Ribeira',
  'Zumbi',
  'Portuguesa',
  'Galeão',
  'Jardim Guanabara',
  'Jardim Carioca',
  'Tauá',
  'Moneró',
  'Pitangueiras',
  'Praia da Bandeira',
  'Cocotá',
  'Bancários',
  'Cacuia',
  'Freguesia (Ilha)',
];

// AnimatedFilterChip removido - agora usando filtros compactos inline

const AnimatedProblemCard = ({ 
  item, 
  index, 
  onPress 
}: { 
  item: Problem; 
  index: number; 
  onPress: () => void; 
}) => {
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
        onPress={onPress}
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

export default function ProblemsListScreen() {
  const router = useRouter();
  
  // Usar store para dados centralizados
  const { problems, isLoading: loading, lastUpdated } = useProblemsStore();
  
  const [selectedFilter, setSelectedFilter] = useState<'all' | keyof typeof statusConfig>('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('Todos os Bairros');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadProblems = useCallback(async () => {
    // Usar store para carregar dados
    await useProblemsStore.getState().loadProblems({
      status: selectedFilter === 'all' ? undefined : selectedFilter
    });
  }, [selectedFilter]);

  useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  // Recarregar quando lastUpdated mudar (novo report criado)
  useEffect(() => {
    if (lastUpdated > 0) {
      loadProblems();
    }
  }, [lastUpdated, loadProblems]);

  const filteredProblems = problems.filter(problem => {
    const matchesSearch = searchQuery === '' || 
      problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesNeighborhood = selectedNeighborhood === 'Todos os Bairros' ||
      problem.location.address?.toLowerCase().includes(selectedNeighborhood.toLowerCase());
    
    return matchesSearch && matchesNeighborhood;
  });

  const renderProblemCard = ({ item, index }: { item: Problem; index: number }) => (
    <AnimatedProblemCard
      item={item}
      index={index}
      onPress={() => router.push({
        pathname: '/ProblemDetailsScreen',
        params: { problemId: item.id }
      })}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header com contador integrado */}
      <Animated.View 
        entering={SlideInUp.delay(100)}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Problemas Reportados</Text>
          <Text style={styles.subtitle}>
            {filteredProblems.length} encontrado(s) • {selectedNeighborhood === 'Todos os Bairros' ? 'Ilha do Governador' : selectedNeighborhood}
          </Text>
        </View>
        <Animated.View entering={BounceIn.delay(300)}>
          <TouchableOpacity 
            style={[styles.searchButton, searchVisible && styles.searchButtonActive]}
            onPress={() => setSearchVisible(!searchVisible)}
          >
            <Icon name="search" size={24} color={searchVisible ? "white" : "#2E7D32"} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Barra de Busca */}
      {searchVisible && (
        <Animated.View 
          entering={SlideInDown}
          style={styles.searchContainer}
        >
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por título ou descrição..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="clear" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      {/* Filtros Compactos */}
      <Animated.View 
        entering={SlideInDown.delay(200)}
        style={styles.compactFiltersContainer}
      >
        {/* Linha 1: Filtros de Status */}
        <View style={styles.filtersRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.compactFiltersList}
          >
            {filters.map((filter, index) => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.compactFilterChip,
                  selectedFilter === filter.id && [styles.compactFilterChipActive, { backgroundColor: filter.color + '15', borderColor: filter.color }]
                ]}
                onPress={() => setSelectedFilter(filter.id as keyof typeof statusConfig)}
              >
                <Icon 
                  name={filter.icon} 
                  size={14} 
                  color={selectedFilter === filter.id ? filter.color : '#666'} 
                />
                <Text style={[
                  styles.compactFilterText,
                  selectedFilter === filter.id && { color: filter.color, fontWeight: '600' }
                ]}>
                  {filter.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Linha 2: Filtros de Bairro */}
        <View style={styles.filtersRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.compactFiltersList}
          >
            {neighborhoods.slice(0, 6).map((neighborhood) => (
              <TouchableOpacity
                key={neighborhood}
                style={[
                  styles.compactNeighborhoodChip,
                  selectedNeighborhood === neighborhood && styles.compactNeighborhoodChipSelected
                ]}
                onPress={() => setSelectedNeighborhood(neighborhood)}
              >
                <Text style={[
                  styles.compactNeighborhoodText,
                  selectedNeighborhood === neighborhood && styles.compactNeighborhoodTextSelected
                ]}>
                  {neighborhood === 'Todos os Bairros' ? 'Todos' : neighborhood}
                </Text>
              </TouchableOpacity>
            ))}
            {neighborhoods.length > 6 && (
              <TouchableOpacity style={styles.moreFiltersButton}>
                <Icon name="more-horiz" size={16} color="#666" />
                <Text style={styles.moreFiltersText}>+{neighborhoods.length - 6}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </Animated.View>

      {/* Lista de Problemas */}
      {loading ? (
        <Animated.View 
          entering={FadeIn}
          style={styles.loadingContainer}
        >
          <Animated.View entering={ZoomIn}>
            <ActivityIndicator size="large" color="#2E7D32" />
          </Animated.View>
          <Animated.View entering={FadeIn.delay(300)}>
            <Text style={styles.loadingText}>Carregando problemas...</Text>
          </Animated.View>
        </Animated.View>
      ) : filteredProblems.length === 0 ? (
        <Animated.View 
          entering={FadeIn}
          style={styles.emptyContainer}
        >
          <Icon name="search-off" size={48} color="#CCC" />
          <Text style={styles.emptyText}>Nenhum problema encontrado</Text>
          <Text style={styles.emptySubtext}>
            Tente ajustar os filtros ou termo de busca
          </Text>
        </Animated.View>
      ) : (
        <Animated.View 
          entering={FadeIn.delay(400)}
          style={styles.listContainer}
        >
          <FlatList
            data={filteredProblems}
            keyExtractor={(item) => item.id}
            renderItem={renderProblemCard}
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
  headerLeft: {
    flex: 1,
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
  searchButton: {
    padding: 12,
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
  },
  // Removidos - substituídos pelos compactos
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
  imageContainer: {
    position: 'relative',
  },
  problemImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  statusIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 10,
    padding: 4,
    borderWidth: 2,
    borderColor: 'white',
  },
  problemContent: {
    flex: 1,
  },
  problemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  problemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  problemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  problemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  problemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  engagementInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  engagementText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  priorityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  chevronContainer: {
    alignSelf: 'center',
    padding: 4,
  },
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
  searchButtonActive: {
    backgroundColor: '#2E7D32',
  },
  searchContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  // Removidos - substituídos pelos compactos
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
  // Novos estilos para cards modernos
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
  compactFiltersContainer: {
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
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  compactFiltersList: {
    paddingHorizontal: 16,
  },
  compactFilterChip: {
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
  compactFilterChipActive: {
    borderWidth: 1,
  },
  compactFilterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  compactNeighborhoodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    gap: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  compactNeighborhoodChipSelected: {
    backgroundColor: '#E8F5E8',
    borderColor: '#2E7D32',
  },
  compactNeighborhoodText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
    compactNeighborhoodTextSelected: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  moreFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    gap: 4,
  },
  moreFiltersText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
 });
 