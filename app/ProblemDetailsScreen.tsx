import { Problem } from '@/data/mockData';
import { problemsApi } from '@/services/mockApi';
import { useAuthStore } from '@/stores/authStore';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  Extrapolate,
  FadeIn,
  interpolate,
  SlideInUp,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

const getCategoryInfo = (category: string) => {
  switch (category) {
    case 'road':
      return { name: 'Via Pública', icon: 'construction', color: '#F44336' };
    case 'lighting':
      return { name: 'Iluminação', icon: 'lightbulb-outline', color: '#FF9800' };
    case 'cleaning':
      return { name: 'Limpeza', icon: 'delete', color: '#9C27B0' };
    case 'others':
      return { name: 'Outros', icon: 'report-problem', color: '#607D8B' };
    default:
      return { name: 'Outros', icon: 'report-problem', color: '#607D8B' };
  }
};

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'resolved':
      return { name: 'Resolvido', color: '#4CAF50', icon: 'check-circle' };
    case 'in_progress':
      return { name: 'Em Andamento', color: '#FF9800', icon: 'autorenew' };
    case 'pending':
      return { name: 'Pendente', color: '#F44336', icon: 'schedule' };
    default:
      return { name: 'Pendente', color: '#F44336', icon: 'schedule' };
  }
};

const InfoCard = ({ icon, title, value, color = "#666", delay = 0 }: {
  icon: string;
  title: string;
  value: string;
  color?: string;
  delay?: number;
}) => (
  <Animated.View entering={FadeIn.delay(delay)} style={styles.infoCard}>
    <View style={[styles.infoCardIcon, { backgroundColor: color + '20' }]}>
      <MaterialIcons name={icon as any} size={20} color={color} />
    </View>
    <View style={styles.infoCardContent}>
      <Text style={styles.infoCardTitle}>{title}</Text>
      <Text style={styles.infoCardValue}>{value}</Text>
    </View>
  </Animated.View>
);

export default function ProblemDetailsScreen() {
  const router = useRouter();
  const { problemId } = useLocalSearchParams<{ problemId: string }>();
  const { user } = useAuthStore();
  
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);
  const [voting, setVoting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Animated values for scroll effect
  const scrollY = useSharedValue(0);
  const headerHeight = useSharedValue(250);
  const isCollapsed = useSharedValue(false);

  // Scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      
      // Collapse threshold
      const collapseThreshold = 100;
      const maxScroll = 200;
      
      // Calculate new header height (minimum 80px for compact header)
      const newHeight = interpolate(
        scrollY.value,
        [0, maxScroll],
        [250, 80],
        Extrapolate.CLAMP
      );
      
      headerHeight.value = withTiming(newHeight, { duration: 100 });
      
      // Update collapsed state
      const shouldCollapse = scrollY.value > collapseThreshold;
      if (shouldCollapse !== isCollapsed.value) {
        isCollapsed.value = shouldCollapse;
      }
    },
  });

  // Animated styles (must be before early returns)
  const heroAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: headerHeight.value,
    };
  });

  const heroImageStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [0, 200],
      [1, 1.2],
      Extrapolate.CLAMP
    );
    
    const opacity = interpolate(
      scrollY.value,
      [0, 150],
      [1, 0.3],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const heroContentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [0, -20],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const compactHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [80, 120],
      [0, 1],
      Extrapolate.CLAMP
    );

    return {
      opacity,
    };
  });

  const loadProblem = useCallback(async () => {
    if (!problemId) return;
    
    try {
      setLoading(true);
      const response = await problemsApi.getProblemById(problemId);
      if (response.success && response.data) {
        setProblem(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar problema:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do problema');
    } finally {
      setLoading(false);
    }
  }, [problemId]);

  useEffect(() => {
    loadProblem();
  }, [loadProblem]);

  const handleVote = async () => {
    if (!problem || !user || voting) return;
    
    try {
      setVoting(true);
      const response = await problemsApi.voteProblem(problem.id, user.id);
      if (response.success && response.data) {
        setProblem(prev => prev ? { ...prev, votes: response.data!.votes } : null);
      }
    } catch (error) {
      console.error('Erro ao votar:', error);
      Alert.alert('Erro', 'Não foi possível registrar seu voto');
    } finally {
      setVoting(false);
    }
  };

  const handleAddComment = async () => {
    if (!problem || !user || !newComment.trim() || commenting) return;
    
    try {
      setCommenting(true);
      const response = await problemsApi.addComment(problem.id, user.id, newComment.trim());
      if (response.success && response.data) {
        setProblem(response.data);
        setNewComment('');
      }
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      Alert.alert('Erro', 'Não foi possível adicionar seu comentário');
    } finally {
      setCommenting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Carregando detalhes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!problem) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={48} color="#666" />
          <Text style={styles.errorText}>Problema não encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  const categoryInfo = getCategoryInfo(problem.category);
  const statusInfo = getStatusInfo(problem.status);
  const isOwnProblem = user && problem.reportedBy === user.id;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header fixo com imagem de fundo */}
      <Animated.View style={[styles.heroSection, heroAnimatedStyle]}>
        {problem.images && problem.images.length > 0 && (
          <Animated.Image 
            source={{ uri: problem.images[selectedImageIndex] }} 
            style={[styles.heroImage, heroImageStyle]}
          />
        )}
        <View style={styles.heroOverlay} />
        
        {/* Header controls */}
        <Animated.View style={[styles.headerControls, heroContentStyle]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          {isOwnProblem && (
            <TouchableOpacity style={styles.headerButton}>
              <MaterialIcons name="edit" size={22} color="white" />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Compact header que aparece quando rola */}
        <Animated.View style={[styles.compactHeader, compactHeaderStyle]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.compactBackButton}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.compactTitle} numberOfLines={1}>
            {problem.title}
          </Text>
          <View style={[styles.compactStatus, { backgroundColor: statusInfo.color }]}>
            <MaterialIcons name={statusInfo.icon as any} size={14} color="white" />
          </View>
        </Animated.View>

        {/* Status badge na hero */}
        <Animated.View entering={BounceIn.delay(300)} style={[styles.heroStatusContainer, heroContentStyle]}>
          <View style={[styles.heroStatusBadge, { backgroundColor: statusInfo.color }]}>
            <MaterialIcons name={statusInfo.icon as any} size={18} color="white" />
            <Text style={styles.heroStatusText}>{statusInfo.name}</Text>
          </View>
        </Animated.View>
      </Animated.View>

      <Animated.ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Card principal com título e meta */}
        <Animated.View entering={SlideInUp.delay(200)} style={styles.mainCard}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>{problem.title}</Text>
            
            {/* Categoria e prioridade */}
            <View style={styles.metaRow}>
              <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + '20' }]}>
                <MaterialIcons name={categoryInfo.icon as any} size={16} color={categoryInfo.color} />
                <Text style={[styles.categoryText, { color: categoryInfo.color }]}>
                  {categoryInfo.name}
                </Text>
              </View>
              
              {problem.priority === 'high' && (
                <View style={styles.priorityBadge}>
                  <MaterialIcons name="priority-high" size={14} color="#FF5722" />
                  <Text style={styles.priorityText}>Alta Prioridade</Text>
                </View>
              )}
            </View>
          </View>

          {/* Informações do reporte */}
          <View style={styles.reporterSection}>
            <MaterialIcons name="person" size={20} color="#666" />
            <View style={styles.reporterInfo}>
              <Text style={styles.reporterText}>
                Reportado por {isOwnProblem ? "Você" : `Usuário ${problem.reportedBy.slice(-4)}`}
              </Text>
              <Text style={styles.reportDate}>
                {new Date(problem.reportedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Galeria de imagens */}
        {problem.images && problem.images.length > 1 && (
          <Animated.View entering={FadeIn.delay(400)} style={styles.gallerySection}>
            <Text style={styles.sectionTitle}>Fotos do Problema</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
              {problem.images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImageIndex(index)}
                  style={[
                    styles.galleryImage,
                    selectedImageIndex === index && styles.galleryImageSelected
                  ]}
                >
                  <Image source={{ uri: image }} style={styles.galleryImageContent} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Descrição */}
        <Animated.View entering={SlideInUp.delay(500)} style={styles.descriptionCard}>
          <Text style={styles.sectionTitle}>Descrição do Problema</Text>
          <Text style={styles.description}>{problem.description}</Text>
        </Animated.View>

        {/* Informações detalhadas em cards */}
        <View style={styles.infoCardsGrid}>
          <InfoCard
            icon="location-on"
            title="Localização"
            value={problem.location.address}
            color="#2196F3"
            delay={600}
          />
          <InfoCard
            icon="calendar-today"
            title="Data do Reporte"
            value={new Date(problem.reportedAt).toLocaleDateString('pt-BR')}
            color="#9C27B0"
            delay={700}
          />
          {problem.resolvedAt && (
            <InfoCard
              icon="check-circle"
              title="Resolvido em"
              value={new Date(problem.resolvedAt).toLocaleDateString('pt-BR')}
              color="#4CAF50"
              delay={800}
            />
          )}
        </View>

        {/* Card de interações */}
        <Animated.View entering={SlideInUp.delay(900)} style={styles.interactionCard}>
          <Text style={styles.sectionTitle}>Apoie este Reporte</Text>
          <View style={styles.interactionButtons}>
            <TouchableOpacity 
              style={[styles.voteButton, voting && styles.buttonDisabled]}
              onPress={handleVote}
              disabled={voting || !user}
            >
              {voting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <MaterialIcons name="thumb-up" size={20} color="white" />
              )}
              <Text style={styles.voteButtonText}>
                {voting ? 'Votando...' : `${problem.votes} Apoios`}
              </Text>
            </TouchableOpacity>

            <View style={styles.commentsPreview}>
              <MaterialIcons name="comment" size={18} color="#666" />
              <Text style={styles.commentsCount}>{problem.comments.length} comentários</Text>
            </View>
          </View>
        </Animated.View>

        {/* Seção de comentários */}
        <Animated.View entering={SlideInUp.delay(1000)} style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>Comentários da Comunidade</Text>
          
          {/* Adicionar comentário */}
          {user && (
            <View style={styles.addCommentSection}>
              <View style={styles.addCommentHeader}>
                <MaterialIcons name="account-circle" size={24} color="#666" />
                <Text style={styles.addCommentUser}>Adicionar comentário</Text>
              </View>
              <View style={styles.addCommentContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Compartilhe sua experiência sobre este problema..."
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity 
                  style={[
                    styles.sendCommentButton, 
                    (!newComment.trim() || commenting) && styles.sendButtonDisabled
                  ]}
                  onPress={handleAddComment}
                  disabled={!newComment.trim() || commenting}
                >
                  {commenting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <MaterialIcons name="send" size={18} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Lista de comentários */}
          {problem.comments.length > 0 ? (
            <View style={styles.commentsList}>
              {problem.comments.map((comment, index) => (
                <Animated.View 
                  key={comment.id} 
                  entering={FadeIn.delay(1100 + (index * 100))}
                  style={styles.commentCard}
                >
                  <View style={styles.commentHeader}>
                    <View style={styles.commentUserInfo}>
                      <MaterialIcons name="account-circle" size={20} color="#666" />
                      <Text style={styles.commentAuthor}>{comment.userName}</Text>
                    </View>
                    <Text style={styles.commentDate}>
                      {new Date(comment.createdAt).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                  <Text style={styles.commentText}>{comment.text}</Text>
                </Animated.View>
              ))}
            </View>
          ) : (
            <Animated.View entering={FadeIn.delay(1100)} style={styles.noCommentsContainer}>
              <MaterialIcons name="forum" size={48} color="#E0E0E0" />
              <Text style={styles.noCommentsTitle}>Nenhum comentário ainda</Text>
              <Text style={styles.noCommentsText}>
                Seja o primeiro a compartilhar sua opinião sobre este problema!
              </Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* Espaçamento extra no final */}
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  heroSection: {
    height: 250,
    overflow: 'hidden', 
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerButton: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 10,
  },
  heroStatusContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  heroStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  heroStatusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  mainCard: {
    backgroundColor: 'white',
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  titleSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    lineHeight: 32,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF5722',
  },
  reporterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  reporterInfo: {
    flex: 1,
  },
  reporterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  reportDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  gallerySection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gallery: {
    marginTop: 12,
  },
  galleryImage: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  galleryImageSelected: {
    borderColor: '#2E7D32',
  },
  galleryImageContent: {
    width: 80,
    height: 80,
  },
  descriptionCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  infoCardsGrid: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  infoCard: {
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
    gap: 16,
  },
  infoCardIcon: {
    borderRadius: 12,
    padding: 12,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  interactionCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  interactionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  voteButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  voteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7',
    elevation: 0,
  },
  commentsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentsCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  commentsSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addCommentSection: {
    marginTop: 16,
    marginBottom: 20,
  },
  addCommentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  addCommentUser: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  addCommentContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    padding: 16,
    fontSize: 14,
    minHeight: 50,
    maxHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: '#F8F9FA',
  },
  sendCommentButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 20,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  commentsList: {
    gap: 12,
  },
  commentCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#2E7D32',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  noCommentsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noCommentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  noCommentsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10,
    margin: 16,
    marginTop: 50,
  },
  compactHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  compactBackButton: {
    padding: 8,
    marginRight: 12,
  },
  compactTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  compactStatus: {
    borderRadius: 12,
    padding: 6,
  },
}); 