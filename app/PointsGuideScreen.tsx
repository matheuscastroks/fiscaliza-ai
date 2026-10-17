import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    FadeIn,
    SlideInRight,
    SlideInUp,
    ZoomIn
} from 'react-native-reanimated';

const pointsActivities = [
  {
    id: 1,
    title: 'Reportar Problema',
    description: 'Relate um novo problema urbano com foto e localização',
    points: 10,
    icon: 'add-circle',
    color: '#2E7D32',
    difficulty: 'Fácil',
    time: '2 min',
    tips: [
      'Tire fotos claras do problema',
      'Seja específico na descrição',
      'Marque a localização exata',
    ],
  },
  {
    id: 2,
    title: 'Problema Urgente',
    description: 'Reporte problemas de alta prioridade (segurança, saúde)',
    points: 15,
    icon: 'warning',
    color: '#F44336',
    difficulty: 'Médio',
    time: '3 min',
    tips: [
      'Identifique riscos reais',
      'Documente com evidências',
      'Marque como urgente',
    ],
  },
  {
    id: 3,
    title: 'Adicionar Fotos',
    description: 'Inclua evidências visuais nos seus reportes',
    points: 5,
    icon: 'camera-alt',
    color: '#FF9800',
    difficulty: 'Fácil',
    time: '1 min',
    tips: [
      'Multiple ângulos do problema',
      'Boa iluminação',
      'Contexto da localização',
    ],
  },
  {
    id: 4,
    title: 'Receber Votos',
    description: 'Outros usuários votam positivamente no seu reporte',
    points: 2,
    icon: 'thumb-up',
    color: '#4CAF50',
    difficulty: 'Passivo',
    time: 'Automático',
    tips: [
      'Reportes úteis recebem mais votos',
      'Seja detalhado e preciso',
      'Responda comentários',
    ],
  },
  {
    id: 5,
    title: 'Comentar em Reportes',
    description: 'Contribua com informações adicionais',
    points: 3,
    icon: 'comment',
    color: '#2196F3',
    difficulty: 'Fácil',
    time: '1 min',
    tips: [
      'Adicione informações relevantes',
      'Seja construtivo',
      'Confirme problemas similares',
    ],
  },
  {
    id: 6,
    title: 'Problema Resolvido',
    description: 'Quando um problema reportado por você é marcado como resolvido',
    points: 20,
    icon: 'check-circle',
    color: '#4CAF50',
    difficulty: 'Recompensa',
    time: 'Após resolução',
    tips: [
      'Reportes precisos têm mais chance',
      'Acompanhe o progresso',
      'Seja paciente com o processo',
    ],
  },
];

const achievements = [
  {
    id: 1,
    title: 'Primeiro Reporte',
    description: 'Faça seu primeiro reporte',
    points: 50,
    icon: 'emoji-events',
    color: '#FFD700',
    progress: 100,
    unlocked: true,
  },
  {
    id: 2,
    title: 'Cidadão Ativo',
    description: 'Reporte 10 problemas',
    points: 100,
    icon: 'local-police',
    color: '#2196F3',
    progress: 70,
    unlocked: false,
  },
  {
    id: 3,
    title: 'Herói da Comunidade',
    description: 'Tenha 5 problemas resolvidos',
    points: 150,
    icon: 'superhero',
    color: '#9C27B0',
    progress: 40,
    unlocked: false,
  },
  {
    id: 4,
    title: 'Influenciador Local',
    description: 'Receba 100 votos',
    points: 200,
    icon: 'trending-up',
    color: '#FF5722',
    progress: 25,
    unlocked: false,
  },
];

const levelBenefits = [
  {
    level: 1,
    title: 'Iniciante',
    description: 'Bem-vindo ao Fiscaliza-AI!',
    points: '0 - 99',
    benefits: ['Reportar problemas', 'Votar em reportes'],
    color: '#9E9E9E',
  },
  {
    level: 2,
    title: 'Cidadão',
    description: 'Começando a fazer a diferença',
    points: '100 - 299',
    benefits: ['Comentar em reportes', 'Badge especial', 'Filtros avançados'],
    color: '#4CAF50',
  },
  {
    level: 3,
    title: 'Ativista',
    description: 'Usuário engajado',
    points: '300 - 599',
    benefits: ['Prioridade no atendimento', 'Estatísticas detalhadas'],
    color: '#2196F3',
  },
  {
    level: 4,
    title: 'Guardião',
    description: 'Protetor da comunidade',
    points: '600 - 999',
    benefits: ['Moderar comentários', 'Relatórios mensais'],
    color: '#9C27B0',
  },
  {
    level: 5,
    title: 'Herói Local',
    description: 'Líder comunitário',
    points: '1000+',
    benefits: ['Contato direto prefeitura', 'Reconhecimento público'],
    color: '#FFD700',
  },
];

const AnimatedActivityCard = ({ 
  activity, 
  index 
}: { 
  activity: any; 
  index: number; 
}) => (
  <Animated.View 
    entering={SlideInRight.delay(index * 100)}
    style={styles.activityCard}
  >
    <View style={styles.activityHeader}>
      <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
        <Icon name={activity.icon} size={24} color={activity.color} />
      </View>
      <View style={styles.activityInfo}>
        <View style={styles.activityTitleRow}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <View style={styles.pointsBadge}>
            <Icon name="stars" size={12} color="#FFD700" />
            <Text style={styles.pointsText}>+{activity.points}</Text>
          </View>
        </View>
        <Text style={styles.activityDescription}>{activity.description}</Text>
        <View style={styles.activityMeta}>
          <View style={styles.metaItem}>
            <Icon name="speed" size={14} color="#666" />
            <Text style={styles.metaText}>{activity.difficulty}</Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="access-time" size={14} color="#666" />
            <Text style={styles.metaText}>{activity.time}</Text>
          </View>
        </View>
      </View>
    </View>
    
    <View style={styles.tipsContainer}>
      <Text style={styles.tipsTitle}>Dicas:</Text>
      {activity.tips.map((tip: string, tipIndex: number) => (
        <View key={tipIndex} style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ))}
    </View>
  </Animated.View>
);

const AnimatedAchievementCard = ({ 
  achievement, 
  index 
}: { 
  achievement: any; 
  index: number; 
}) => (
  <Animated.View 
    entering={ZoomIn.delay(index * 150)}
    style={[
      styles.achievementCard,
      achievement.unlocked && styles.achievementUnlocked
    ]}
  >
    <View style={[
      styles.achievementIcon, 
      { backgroundColor: achievement.color + '20' },
      achievement.unlocked && { backgroundColor: achievement.color }
    ]}>
      <Icon 
        name={achievement.icon} 
        size={20} 
        color={achievement.unlocked ? 'white' : achievement.color} 
      />
    </View>
    <Text style={[
      styles.achievementTitle,
      achievement.unlocked && styles.achievementTitleUnlocked
    ]}>
      {achievement.title}
    </Text>
    <Text style={styles.achievementDescription}>
      {achievement.description}
    </Text>
    <View style={styles.achievementProgress}>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${achievement.progress}%`,
              backgroundColor: achievement.color 
            }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>{achievement.progress}%</Text>
    </View>
    <View style={styles.achievementPoints}>
      <Icon name="stars" size={12} color="#FFD700" />
      <Text style={styles.achievementPointsText}>+{achievement.points}</Text>
    </View>
  </Animated.View>
);

const AnimatedLevelCard = ({ 
  level, 
  index 
}: { 
  level: any; 
  index: number; 
}) => (
  <Animated.View 
    entering={SlideInUp.delay(index * 100)}
    style={styles.levelCard}
  >
    <View style={styles.levelHeader}>
      <View style={[styles.levelNumber, { backgroundColor: level.color }]}>
        <Text style={styles.levelText}>{level.level}</Text>
      </View>
      <View style={styles.levelInfo}>
        <Text style={styles.levelTitle}>{level.title}</Text>
        <Text style={styles.levelDescription}>{level.description}</Text>
        <Text style={styles.levelPoints}>{level.points} pontos</Text>
      </View>
    </View>
    <View style={styles.benefitsContainer}>
      {level.benefits.map((benefit: string, benefitIndex: number) => (
        <View key={benefitIndex} style={styles.benefitItem}>
          <Icon name="check" size={14} color={level.color} />
          <Text style={styles.benefitText}>{benefit}</Text>
        </View>
      ))}
    </View>
  </Animated.View>
);

export default function PointsGuideScreen() {
  const router = useRouter();

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
          <Text style={styles.title}>Como Ganhar Pontos</Text>
          <Text style={styles.subtitle}>Guia completo de gamificação</Text>
        </View>
        <View style={styles.headerRight} />
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <Animated.View 
          entering={FadeIn.delay(200)}
          style={styles.introContainer}
        >
          <View style={styles.introIcon}>
            <Icon name="emoji-events" size={32} color="#FFD700" />
          </View>
          <Text style={styles.introTitle}>Sistema de Pontuação</Text>
          <Text style={styles.introText}>
            Ganhe pontos contribuindo para melhorar nossa cidade. Quanto mais você participar, 
            mais reconhecimento e benefícios você terá!
          </Text>
        </Animated.View>

        {/* Activities */}
        <Animated.View 
          entering={SlideInUp.delay(400)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Como Ganhar Pontos</Text>
          {pointsActivities.map((activity, index) => (
            <AnimatedActivityCard 
              key={activity.id} 
              activity={activity} 
              index={index} 
            />
          ))}
        </Animated.View>

        {/* Achievements */}
        <Animated.View 
          entering={SlideInUp.delay(600)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Conquistas Especiais</Text>
          <Text style={styles.sectionSubtitle}>
            Desbloqueie conquistas e ganhe pontos extras
          </Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement, index) => (
              <AnimatedAchievementCard 
                key={achievement.id} 
                achievement={achievement} 
                index={index} 
              />
            ))}
          </View>
        </Animated.View>

        {/* Levels */}
        <Animated.View 
          entering={SlideInUp.delay(800)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Sistema de Níveis</Text>
          <Text style={styles.sectionSubtitle}>
            Evolua seu nível e desbloqueie novos benefícios
          </Text>
          {levelBenefits.map((level, index) => (
            <AnimatedLevelCard 
              key={level.level} 
              level={level} 
              index={index} 
            />
          ))}
        </Animated.View>

        {/* Tips */}
        <Animated.View 
          entering={SlideInUp.delay(1000)}
          style={styles.tipsSection}
        >
          <Text style={styles.sectionTitle}>Dicas Gerais</Text>
          <View style={styles.tipsList}>
            <View style={styles.generalTip}>
              <Icon name="lightbulb" size={20} color="#FF9800" />
              <Text style={styles.generalTipText}>
                Seja específico e detalhado em seus reportes
              </Text>
            </View>
            <View style={styles.generalTip}>
              <Icon name="camera-alt" size={20} color="#2196F3" />
              <Text style={styles.generalTipText}>
                Sempre inclua fotos como evidência
              </Text>
            </View>
            <View style={styles.generalTip}>
              <Icon name="location-on" size={20} color="#F44336" />
              <Text style={styles.generalTipText}>
                Marque a localização exata do problema
              </Text>
            </View>
            <View style={styles.generalTip}>
              <Icon name="group" size={20} color="#9C27B0" />
              <Text style={styles.generalTipText}>
                Interaja com a comunidade através de comentários e votos
              </Text>
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
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
    marginRight: 16,
  },
  headerCenter: {
    flex: 1,
  },
  headerRight: {
    width: 40,
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
  content: {
    flex: 1,
  },
  introContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF8F00',
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  activityMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  tipsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 8,
  },
  tipBullet: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
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
    opacity: 0.6,
  },
  achievementUnlocked: {
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
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  achievementTitleUnlocked: {
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
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF8F00',
  },
  levelCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  levelHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  levelNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  levelDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  levelPoints: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  benefitsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  benefitText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  tipsSection: {
    margin: 16,
  },
  tipsList: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  generalTip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  generalTipText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
}); 