import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { layout } from '@/theme/layout';
import { AppText } from '@/components/ui/AppText';
import { AppInput } from '@/components/ui/AppInput';

export interface LocationStepProps {
  address: string;
  onAddressChange: (address: string) => void;
  error?: string | null;
}

export const LocationStep: React.FC<LocationStepProps> = ({
  address,
  onAddressChange,
  error,
}) => {
  return (
    <View style={styles.container}>
      <AppText variant="sectionTitle" color="ink" style={styles.heading}>
        Onde fica o problema?
      </AppText>
      <AppText variant="body" color="muted" style={styles.subheading}>
        Informe a rua, praça ou ponto de referência no município de Vila Esperança.
      </AppText>

      <AppInput
        label="Endereço ou Local"
        placeholder="Ex: Rua das Palmeiras, próximo ao nº 120"
        value={address}
        onChangeText={onAddressChange}
        error={error}
        containerStyle={styles.inputContainer}
      />

      <View style={styles.infoCard}>
        <MaterialIcons name="info-outline" size={18} color={colors.accent} style={styles.infoIcon} />
        <AppText variant="caption" color="muted" style={styles.infoText}>
          No ambiente demonstrativo, as coordenadas geográficas são fixadas no perímetro de Vila Esperança para visualização consistente no mapa.
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  heading: {
    marginBottom: spacing.xxs,
  },
  subheading: {
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceSubdued,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.divider,
    borderRadius: layout.radius.button,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  infoIcon: {
    marginRight: spacing.xs,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    lineHeight: 18,
  },
});
