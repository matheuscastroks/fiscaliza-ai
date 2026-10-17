import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Problem } from '@/data/mockData';
import { problemsApi } from '@/services/mockApi';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { layout } from '@/theme/layout';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppDivider } from '@/components/ui/AppDivider';
import { StatusText } from '@/components/occurrences/StatusText';
import { OccurrenceTimeline } from '@/components/occurrences/OccurrenceTimeline';
import { getCategoryLabel, formatDate } from '@/utils/occurrenceLabels';

export default function ProblemDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const userId = user?.id || 'demo-citizen';

  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const loadProblem = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await problemsApi.getProblemById(id);
      if (response.success && response.data) {
        setProblem(response.data);
      } else {
        setProblem(null);
      }
    } catch {
      setProblem(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProblem();
  }, [loadProblem]);

  const handleVote = async () => {
    if (!problem || isVoting || hasVoted) return;

    setIsVoting(true);
    try {
      const response = await problemsApi.voteProblem(problem.id, userId);
      if (response.success && response.data) {
        setProblem((prev) => (prev ? { ...prev, votes: response.data!.votes } : null));
        setHasVoted(true);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível registrar o apoio.');
    } finally {
      setIsVoting(false);
    }
  };

  const handleAddComment = async () => {
    if (!problem || !commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const response = await problemsApi.addComment(problem.id, userId, commentText.trim());
      if (response.success && response.data) {
        setProblem(response.data);
        setCommentText('');
      } else {
        Alert.alert('Erro', response.error || 'Não foi possível enviar o comentário.');
      }
    } catch {
      Alert.alert('Erro', 'Erro de conexão ao enviar comentário.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <AppScreen edges={['top']} style={styles.screen}>
        <AppHeader title="Ocorrência" onBack={() => router.back()} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={colors.accent} />
          <AppText variant="caption" color="muted" style={styles.loadingText}>
            Carregando ficha da ocorrência...
          </AppText>
        </View>
      </AppScreen>
    );
  }

  if (!problem) {
    return (
      <AppScreen edges={['top']} style={styles.screen}>
        <AppHeader title="Ocorrência" onBack={() => router.back()} />
        <View style={styles.centerContainer}>
          <MaterialIcons name="error-outline" size={40} color={colors.subtle} />
          <AppText variant="sectionTitle" color="ink" style={styles.notFoundTitle}>
            Ocorrência não encontrada
          </AppText>
          <AppText variant="body" color="muted" style={styles.notFoundDescription}>
            O registro solicitado não está disponível no repositório de demonstração.
          </AppText>
          <AppButton
            title="Voltar para a lista"
            variant="secondary"
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </View>
      </AppScreen>
    );
  }

  const formattedDate = formatDate(problem.reportedAt);
  const categoryLabel = getCategoryLabel(problem.category);

  return (
    <AppScreen edges={['top']} style={styles.screen}>
      <AppHeader
        title={`Ocorrência ${problem.id}`}
        context="Vila Esperança · ficha territorial"
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Bloco de Status e Identificação */}
        <View style={styles.summarySection}>
          <View style={styles.statusRow}>
            <StatusText status={problem.status} />
            <AppText variant="caption" color="muted">
              {categoryLabel}
            </AppText>
          </View>

          <AppText variant="screenTitle" color="ink" style={styles.title}>
            {problem.title}
          </AppText>

          <View style={styles.metaRow}>
            <MaterialIcons name="place" size={16} color={colors.muted} />
            <AppText variant="body" color="muted" style={styles.metaAddress}>
              {problem.location.address}
            </AppText>
          </View>

          {formattedDate ? (
            <AppText variant="caption" color="subtle">
              Registrado em {formattedDate}
            </AppText>
          ) : null}
        </View>

        {/* Fotos da Ocorrência */}
        {problem.images && problem.images.length > 0 ? (
          <View style={styles.photosSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {problem.images.map((imgUri, idx) => (
                <Image key={idx} source={{ uri: imgUri }} style={styles.evidenceImage} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        <AppDivider spacingVertical="md" />

        {/* Descrição */}
        <View style={styles.section}>
          <AppText variant="sectionTitle" color="ink" style={styles.sectionTitle}>
            Descrição do Fato
          </AppText>
          <AppText variant="body" color="ink" style={styles.descriptionText}>
            {problem.description}
          </AppText>
        </View>

        <AppDivider spacingVertical="md" />

        {/* Linha do Tempo de Tramitação */}
        <OccurrenceTimeline
          history={problem.statusHistory}
          currentStatus={problem.status}
          reportedAt={problem.reportedAt}
        />

        <AppDivider spacingVertical="md" />

        {/* Apoio Comunitário */}
        <View style={styles.supportSection}>
          <View style={styles.supportInfo}>
            <AppText variant="sectionTitle" color="ink">
              Apoio da Comunidade
            </AppText>
            <AppText variant="caption" color="muted">
              {problem.votes} {problem.votes === 1 ? 'cidadão apoiou' : 'cidadãos apoiaram'} este chamado
            </AppText>
          </View>

          <AppButton
            title={hasVoted ? 'Ocorrência apoiada' : `Apoiar (${problem.votes})`}
            variant={hasVoted ? 'secondary' : 'primary'}
            disabled={hasVoted || isVoting}
            loading={isVoting}
            onPress={handleVote}
            icon={<MaterialIcons name="thumb-up" size={16} color={hasVoted ? colors.ink : colors.white} />}
          />
        </View>

        <AppDivider spacingVertical="md" />

        {/* Comentários Comunitários */}
        <View style={styles.commentsSection}>
          <AppText variant="sectionTitle" color="ink" style={styles.sectionTitle}>
            Manifestações e Comentários ({problem.comments ? problem.comments.length : 0})
          </AppText>

          {problem.comments && problem.comments.length > 0 ? (
            <View style={styles.commentsList}>
              {problem.comments.map((comm) => (
                <View key={comm.id} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <AppText variant="label" color="ink">
                      {comm.userName}
                    </AppText>
                    <AppText variant="caption" color="muted">
                      {formatDate(comm.createdAt)}
                    </AppText>
                  </View>
                  <AppText variant="body" color="ink" style={styles.commentText}>
                    {comm.text}
                  </AppText>
                </View>
              ))}
            </View>
          ) : (
            <AppText variant="caption" color="muted" style={styles.emptyComments}>
              Nenhum comentário adicionado ainda.
            </AppText>
          )}

          {/* Campo de Novo Comentário */}
          <View style={styles.newCommentBox}>
            <TextInput
              style={styles.commentInput}
              placeholder="Adicionar informação sobre o local..."
              placeholderTextColor={colors.subtle}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <AppButton
              title="Comentar"
              variant="secondary"
              disabled={!commentText.trim() || isSubmittingComment}
              loading={isSubmittingComment}
              onPress={handleAddComment}
              style={styles.commentSubmitButton}
            />
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
  },
  scrollContent: {
    paddingHorizontal: spacing.contentPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
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
  notFoundTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxs,
  },
  notFoundDescription: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    minWidth: 160,
  },
  summarySection: {
    marginBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  metaAddress: {
    marginLeft: spacing.xxs,
    flex: 1,
  },
  photosSection: {
    marginVertical: spacing.sm,
  },
  evidenceImage: {
    width: 240,
    height: 160,
    borderRadius: layout.radius.button,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.divider,
    marginRight: spacing.sm,
  },
  section: {
    marginVertical: spacing.xs,
  },
  sectionTitle: {
    marginBottom: spacing.xs,
  },
  descriptionText: {
    lineHeight: 22,
  },
  supportSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.divider,
    borderRadius: layout.radius.panel,
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  supportInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  commentsSection: {
    marginVertical: spacing.xs,
  },
  commentsList: {
    marginVertical: spacing.xs,
  },
  commentItem: {
    backgroundColor: colors.surface,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.divider,
    borderRadius: layout.radius.button,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xxs,
  },
  commentText: {
    lineHeight: 20,
  },
  emptyComments: {
    fontStyle: 'italic',
    marginVertical: spacing.xs,
  },
  newCommentBox: {
    marginTop: spacing.md,
  },
  commentInput: {
    backgroundColor: colors.surface,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.divider,
    borderRadius: layout.radius.button,
    padding: spacing.md,
    minHeight: 64,
    color: colors.ink,
    fontSize: 15,
    marginBottom: spacing.xs,
    textAlignVertical: 'top',
  },
  commentSubmitButton: {
    alignSelf: 'flex-end',
  },
});