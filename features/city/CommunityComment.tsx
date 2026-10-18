import React from 'react';
import { View } from 'react-native';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { AppText } from '@/components/ui/AppText';
import { spacing } from '@/theme';
import type { CityComment } from '@/shared/contracts';
import { CommentActions } from './CommentActions';

export function CommunityComment({
  comment,
  path,
}: {
  comment: CityComment;
  path: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: spacing.sm,
        paddingVertical: spacing.sm,
      }}
    >
      <UserAvatar
        size={40}
        profile={{
          id: comment.userId,
          name: comment.userName,
          avatar: comment.avatar,
        }}
      />
      <View style={{ flex: 1, gap: spacing.xxs }}>
        <View
          style={{
            minHeight: 40,
            gap: spacing.xxs,
            paddingRight: 48,
            justifyContent: 'center',
          }}
        >
          <AppText variant="label">{comment.userName}</AppText>
          <AppText variant="meta" color="muted">
            {new Date(comment.createdAt).toLocaleString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
            {comment.editedAt ? ' · editado' : ''}
          </AppText>
          <View style={{ position: 'absolute', right: 0, top: -spacing.xxs }}>
            <CommentActions comment={comment} path={path} />
          </View>
        </View>
        <AppText>{comment.text}</AppText>
      </View>
    </View>
  );
}
