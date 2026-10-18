import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import type { Consultation, Proposal } from '@/shared/contracts';
import { colors, spacing } from '@/theme';

export function ProposalStages({ status }: { status: Proposal['status'] }) {
  const current =
    status === 'submitted' ? 0 : status === 'under_review' ? 1 : 2;
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
      {['Recebida', 'Em análise', 'Decisão'].map((label, index) => (
        <View key={label} style={{ flex: 1, gap: spacing.xs }}>
          <View
            style={{
              height: 3,
              borderRadius: 2,
              backgroundColor: index <= current ? colors.ink : colors.divider,
            }}
          />
          <AppText variant="meta" color={index <= current ? 'ink' : 'muted'}>
            {label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

export function BallotOption({
  item,
  index,
  selected,
  disabled,
  onSelect,
  closed,
}: {
  item: Consultation;
  index: number;
  selected?: number;
  disabled: boolean;
  closed: boolean;
  onSelect: () => void;
}) {
  const checked = selected === index;
  const total = item.answerCounts.reduce((sum, count) => sum + count, 0);
  const count = item.answerCounts[index] || 0;
  const percent = total ? Math.round((count / total) * 100) : 0;
  return (
    <Pressable
      accessibilityRole={closed ? 'text' : 'radio'}
      accessibilityLabel={
        item.options[index] +
        (closed ? `, ${count} respostas, ${percent}%` : '')
      }
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={onSelect}
      style={{
        padding: spacing.md,
        minHeight: 64,
        gap: spacing.sm,
        borderWidth: checked ? 2 : 1,
        borderColor: checked ? colors.ink : colors.divider,
        borderRadius: 20,
        backgroundColor: colors.surface,
      }}
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
      >
        {!closed && (
          <Ionicons
            name={checked ? 'radio-button-on' : 'radio-button-off'}
            size={24}
            color={colors.ink}
          />
        )}
        <AppText variant="label" style={{ flex: 1 }}>
          {item.options[index]}
        </AppText>
        {closed && <AppText variant="label">{percent}%</AppText>}
      </View>
      {closed && (
        <>
          <View
            style={{
              height: 4,
              backgroundColor: colors.divider,
              borderRadius: 2,
            }}
          >
            <View
              style={{
                height: 4,
                width: `${percent}%`,
                backgroundColor: colors.ink,
                borderRadius: 2,
              }}
            />
          </View>
          <AppText variant="meta" color="muted">
            {count} {count === 1 ? 'resposta' : 'respostas'}
          </AppText>
        </>
      )}
    </Pressable>
  );
}
