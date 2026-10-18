import { useState } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { useAuthStore } from '@/stores/authStore';
import { mutation } from '@/services/http';
import type { CityComment } from '@/shared/contracts';
import { colors } from '@/theme';

export function CommentActions({
  comment,
  path,
}: {
  comment: CityComment;
  path: string;
}) {
  const user = useAuthStore((state) => state.user);
  const [mode, setMode] = useState<'closed' | 'menu' | 'edit' | 'delete'>(
    'closed',
  );
  const [text, setText] = useState(comment.text);
  const cache = useQueryClient();
  const change = useMutation({
    mutationFn: (method: 'PATCH' | 'DELETE') =>
      mutation(
        path + '/comments/' + encodeURIComponent(comment.id),
        method,
        method === 'PATCH' ? { text: text.trim() } : undefined,
      ),
    onSuccess: () => {
      setMode('closed');
      void cache.invalidateQueries({ queryKey: ['municipality'] });
    },
  });
  if (user?.id !== comment.userId) return null;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={'Opções do comentário de ' + comment.userName}
        onPress={() => {
          change.reset();
          setMode('menu');
        }}
        style={{
          width: 48,
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="ellipsis-horizontal" size={22} color={colors.ink} />
      </Pressable>
      <AppBottomSheet
        scroll={mode === 'edit'}
        open={mode !== 'closed'}
        onClose={() => setMode('closed')}
        busy={change.isPending}
      >
        <AppText variant="sectionTitle">
          {mode === 'edit'
            ? 'Editar comentário'
            : mode === 'delete'
              ? 'Apagar comentário?'
              : 'Seu comentário'}
        </AppText>
        {mode === 'menu' && (
          <>
            <AppButton
              title="Editar comentário"
              variant="quiet"
              onPress={() => {
                setText(comment.text);
                setMode('edit');
              }}
            />
            <AppButton
              title="Apagar comentário"
              variant="quiet"
              onPress={() => setMode('delete')}
            />
          </>
        )}
        {mode === 'edit' && (
          <>
            <AppInput
              label="Comentário"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={2000}
              editable={!change.isPending}
            />
            <AppButton
              title="Salvar alteração"
              loading={change.isPending}
              disabled={!text.trim() || text.trim() === comment.text}
              onPress={() => change.mutate('PATCH')}
            />
          </>
        )}
        {mode === 'delete' && (
          <>
            <AppText color="muted">
              Esta contribuição será removida do registro. Esta ação não pode
              ser desfeita.
            </AppText>
            <AppButton
              title="Apagar comentário"
              variant="destructive"
              loading={change.isPending}
              onPress={() => change.mutate('DELETE')}
            />
          </>
        )}
        {change.error && (
          <AppText color="risk" accessibilityRole="alert">
            {change.error.message}
          </AppText>
        )}
        <AppButton
          title="Cancelar"
          variant="quiet"
          disabled={change.isPending}
          onPress={() => setMode('closed')}
        />
      </AppBottomSheet>
    </>
  );
}
