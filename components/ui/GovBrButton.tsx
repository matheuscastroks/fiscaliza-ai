import React, { useState } from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { useTheme } from '@/theme/useTheme';

export interface GovBrButtonProps {
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * Botão oficial de autenticação "Entrar com gov.br"
 * em conformidade com o Design System do Governo Federal (Padrão Digital de Governo).
 *
 * - Cor primária: Azul Gov (#1351B4 / active: #0C326F)
 * - Formato: Pill arredondado (9999)
 * - Rótulo: "Entrar com gov.br" (com "gov.br" em peso forte)
 * - Ícone institucional de identificação cidadã
 */
export const GovBrButton: React.FC<GovBrButtonProps> = ({
  onPress,
  loading = false,
  disabled = false,
  style,
}) => {
  const { colors } = useTheme();
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  const handlePress = () => {
    if (disabled || loading) return;
    if (onPress) {
      onPress();
    } else {
      setInfoModalVisible(true);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.button, disabled && styles.disabled, style]}
        onPress={handlePress}
        activeOpacity={0.82}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel="Entrar com gov.br"
        accessibilityHint="Autenticação unificada do governo federal para assegurar autoria cidadã"
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <View style={styles.contentRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="person" size={14} color="#1351B4" />
            </View>
            <AppText style={styles.label}>
              Entrar com{' '}
              <AppText style={styles.labelBold}>gov.br</AppText>
            </AppText>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={infoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setInfoModalVisible(false)}
        >
          <Pressable
            style={[styles.modalCard, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
            accessibilityRole="alert"
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalGovBadge}>
                <Ionicons name="shield-checkmark" size={20} color="#1351B4" />
                <AppText style={styles.modalGovBadgeText}>gov.br</AppText>
              </View>
              <TouchableOpacity
                onPress={() => setInfoModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={colors.subtle} />
              </TouchableOpacity>
            </View>

            <AppText variant="sectionTitle" color="ink" style={{ marginTop: spacing.xs }}>
              Acesso Cidadão com gov.br
            </AppText>

            <AppText color="muted" style={{ marginTop: spacing.xs, lineHeight: 22 }}>
              A autenticação direta via conta gov.br será o meio oficial de identificação no Fiscaliza aí.
            </AppText>

            <View style={[styles.infoBox, { backgroundColor: colors.canvas, borderColor: colors.border }]}>
              <Ionicons name="finger-print" size={22} color={colors.accent} style={{ marginTop: 2 }} />
              <View style={{ flex: 1, gap: 4 }}>
                <AppText variant="label" color="ink">
                  Autoria e Legitimidade
                </AppText>
                <AppText variant="meta" color="muted">
                  Garante que cada relato, voto e proposta parta de uma pessoa real do município, prevenindo contas automatizadas e assegurando valor público ao debate.
                </AppText>
              </View>
            </View>

            <AppText variant="caption" color="subtle" style={{ marginTop: spacing.xs }}>
              A integração SSO federal está em fase de homologação. No momento, você pode utilizar o acesso com e-mail e senha abaixo.
            </AppText>

            <AppButton
              title="Entendido"
              variant="primary"
              style={{ marginTop: spacing.md }}
              onPress={() => setInfoModalVisible(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1351B4',
    minHeight: 52,
    borderRadius: layout.radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#071D41',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 3,
  },
  disabled: {
    opacity: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  labelBold: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: layout.radius.sheet,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalGovBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EBF2FA',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: layout.radius.pill,
  },
  modalGovBadgeText: {
    color: '#1351B4',
    fontWeight: '800',
    fontSize: 13,
  },
  infoBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: layout.radius.sm,
    borderWidth: layout.borderWidth.hairline,
    marginTop: spacing.md,
  },
});
