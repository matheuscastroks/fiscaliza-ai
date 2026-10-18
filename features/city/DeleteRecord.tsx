import React, { useState } from 'react';
import { View, Platform, useWindowDimensions } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { mutation } from '@/services/http';
import { useAuthStore } from '@/stores/authStore';
import { useProblemsStore } from '@/stores/problemsStore';
import { canDeleteRecord } from '@/shared/record-deletion';
import type { CivicItem, Occurrence } from '@/shared/contracts';
import { goBack } from '@/utils/navigation';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';
import { BottomSheet, RNHostView } from '@expo/ui';
import { Ionicons } from '@expo/vector-icons';

export function DeleteRecord({
  item,
  path,
}: {
  item: Occurrence | CivicItem;
  path: string;
}) {
  const user = useAuthStore((state) => state.user);
  const { width } = useWindowDimensions();
  const [confirming, setConfirming] = useState(false);
  const cache = useQueryClient();
  const remove = useMutation({
    mutationFn: () => mutation(path, 'DELETE'),
    onSuccess: async () => {
      await cache.cancelQueries({
        predicate: (query) => query.queryKey.includes(path),
      });
      cache.removeQueries({
        predicate: (query) => query.queryKey.includes(path),
      });
      goBack();
      void cache.invalidateQueries({ queryKey: ['municipality'] });
      void useProblemsStore.getState().loadProblems();
    },
  });
  const author = 'kind' in item ? item.createdBy : item.reportedBy;
  if (author !== user?.id || item.canDelete === false || !canDeleteRecord(item))
    return null;
  return (
    <View style={{ gap: spacing.xs }}>
      <AppButton
        title="Excluir registro"
        variant="destructive"
        icon={<Ionicons name="trash-outline" size={20} color={colors.white} />}
        onPress={() => {
          remove.reset();
          setConfirming(true);
        }}
      />
      <BottomSheet
        isPresented={confirming}
        onDismiss={() => {
          if (!remove.isPending) setConfirming(false);
        }}
        containerColor={colors.surface}
        contentPadding={{
          left: spacing.contentPadding,
          right: spacing.contentPadding,
          bottom: spacing.xl,
        }}
        shouldDismissOnBackPress={!remove.isPending}
        shouldDismissOnClickOutside={!remove.isPending}
      >
        <RNHostView matchContents={{ vertical: true }}>
          <View
            style={{
              gap: spacing.sm,
              paddingTop: spacing.sm,
              width:
                Platform.OS === 'web'
                  ? '100%'
                  : Math.min(width, 640) - 2 * spacing.contentPadding,
            }}
            accessibilityViewIsModal
          >
            <AppText variant="sectionTitle">Excluir este registro?</AppText>
            <AppText color="muted">
              O registro e suas participações serão removidos. Esta ação não
              pode ser desfeita.
            </AppText>
            <AppButton
              title="Excluir registro"
              variant="destructive"
              loading={remove.isPending}
              onPress={() => remove.mutate()}
            />
            <AppButton
              title="Manter registro"
              variant="quiet"
              disabled={remove.isPending}
              onPress={() => setConfirming(false)}
            />
            {remove.error && (
              <AppText color="risk" accessibilityRole="alert">
                {remove.error.message}
              </AppText>
            )}
          </View>
        </RNHostView>
      </BottomSheet>
    </View>
  );
}
