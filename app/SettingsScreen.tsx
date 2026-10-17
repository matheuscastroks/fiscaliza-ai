import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { demoApi } from '@/services/mockApi';
import { useAuthStore } from '@/stores/authStore';
import { useProblemsStore } from '@/stores/problemsStore';
import { DemoScenario } from '@/demo/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { layout } from '@/theme/layout';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppDivider } from '@/components/ui/AppDivider';
import { DemoNotice } from '@/components/demo/DemoNotice';

const SCENARIOS: { id: DemoScenario; title: string; description: string }[] = [
  {
    id: 'registered',
    title: 'Recém-registrado',
    description: 'Relato inicial pendente de triagem pela equipe técnica.',
  },
  {
    id: 'in_progress',
    title: 'Em atendimento',
    description: 'Equipe de manutenção designada e tramitação em andamento.',
  },
  {
    id: 'resolved',
    title: 'Concluído',
    description: 'Reparo finalizado na via pública com histórico documentado.',
  },
];

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const { loadProblems } = useProblemsStore();

  const [currentScenario, setCurrentScenario] = useState<DemoScenario | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    async function fetchScenario() {
      try {
        const scenario = await demoApi.getScenario();
        setCurrentScenario(scenario);
      } catch {
        setCurrentScenario('registered');
      }
    }
    fetchScenario();
  }, []);

  const handleApplyScenario = async (scenario: DemoScenario) => {
    setIsResetting(true);
    try {
      await demoApi.reset(scenario);
      setCurrentScenario(scenario);
      await loadProblems();
      Alert.alert(
        'Cenário Atualizado',
        `A demonstração foi restaurada para o cenário "${scenario}". O mapa e a lista foram sincronizados.`
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível restaurar o cenário.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/LoginScreen');
  };

  return (
    <AppScreen edges={['top']} style={styles.screen}>
      <AppHeader
        title="Controles da Demonstração"
        context="Vila Esperança · configurações"
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Aviso de Escopo */}
        <View style={styles.noticeSection}>
          <DemoNotice
            message="Controles de simulação de dados para validação acadêmica e testes da banca."
          />
        </View>

        {/* Seção de Cenários */}
        <View style={styles.section}>
          <AppText variant="sectionTitle" color="ink" style={styles.heading}>
            Cenários de Demonstração
          </AppText>
          <AppText variant="body" color="muted" style={styles.subheading}>
            Selecione um cenário predefinido para demonstrar o ciclo de vida e a tramitação do chamado principal (DEMO-001).
          </AppText>

          <View style={styles.scenariosList}>
            {SCENARIOS.map((scen) => {
              const isSelected = currentScenario === scen.id;
              return (
                <TouchableOpacity
                  key={scen.id}
                  style={[
                    styles.scenarioCard,
                    isSelected && styles.scenarioCardSelected,
                  ]}
                  onPress={() => handleApplyScenario(scen.id)}
                  disabled={isResetting}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.scenarioCardHeader}>
                    <View style={styles.scenarioRadio}>
                      {isSelected ? (
                        <View style={styles.scenarioRadioSelected} />
                      ) : null}
                    </View>
                    <AppText variant="label" color="ink" style={styles.scenarioTitle}>
                      {scen.title}
                    </AppText>
                    {isSelected ? (
                      <View style={styles.activePill}>
                        <AppText variant="caption" color="accent" style={styles.activePillText}>
                          Ativo
                        </AppText>
                      </View>
                    ) : null}
                  </View>

                  <AppText variant="body" color="muted" style={styles.scenarioDesc}>
                    {scen.description}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          {isResetting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.accent} />
              <AppText variant="caption" color="muted" style={styles.loadingText}>
                Atualizando dados locais...
              </AppText>
            </View>
          ) : null}
        </View>

        <AppDivider spacingVertical="lg" />

        {/* Sessão e Dados */}
        <View style={styles.section}>
          <AppText variant="sectionTitle" color="ink" style={styles.heading}>
            Sessão Local
          </AppText>

          <View style={styles.infoRow}>
            <AppText variant="caption" color="muted">
              CONTA ATIVA
            </AppText>
            <AppText variant="body" color="ink">
              {user?.name || 'Pessoa de demonstração'} ({user?.email || 'demo@vilaesperanca.exemplo'})
            </AppText>
          </View>

          <View style={styles.infoRow}>
            <AppText variant="caption" color="muted">
              CHAVE DE PERSISTÊNCIA
            </AppText>
            <AppText variant="protocol" color="ink">
              fiscaliza:citizen:v1 (AsyncStorage)
            </AppText>
          </View>

          <AppButton
            title="Sair da demonstração"
            variant="secondary"
            onPress={handleLogout}
            style={styles.logoutButton}
          />
        </View>

        <AppDivider spacingVertical="lg" />

        {/* Sobre */}
        <View style={styles.section}>
          <AppText variant="caption" color="muted" style={styles.aboutText}>
            Fiscaliza-AI · Projeto de TCC em Cidades Inteligentes{'\n'}
            Desenvolvido com React Native, Expo e arquitetura de demonstração offline.
          </AppText>
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
  noticeSection: {
    marginBottom: spacing.md,
  },
  section: {
    marginVertical: spacing.xs,
  },
  heading: {
    marginBottom: spacing.xxs,
  },
  subheading: {
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  scenariosList: {
    rowGap: spacing.sm,
  },
  scenarioCard: {
    backgroundColor: colors.surface,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.divider,
    borderRadius: layout.radius.panel,
    padding: spacing.md,
  },
  scenarioCardSelected: {
    borderColor: colors.borderActive,
    backgroundColor: colors.accentSoft,
  },
  scenarioCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  scenarioRadio: {
    width: 18,
    height: 18,
    borderRadius: layout.radius.pill,
    borderWidth: 2,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  scenarioRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: layout.radius.pill,
    backgroundColor: colors.accent,
  },
  scenarioTitle: {
    flex: 1,
  },
  activePill: {
    backgroundColor: colors.surface,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.accent,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: layout.radius.pill,
  },
  activePillText: {
    fontWeight: '700',
    fontSize: 10,
  },
  scenarioDesc: {
    lineHeight: 20,
    marginLeft: 26,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  loadingText: {
    marginLeft: spacing.xs,
  },
  infoRow: {
    marginVertical: spacing.xs,
  },
  logoutButton: {
    marginTop: spacing.md,
  },
  aboutText: {
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.md,
  },
});