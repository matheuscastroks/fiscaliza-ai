import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { AppText } from './AppText';
import { useAuthStore } from '@/stores/authStore';
import { useAvatarStore } from '@/stores/avatarStore';
import { colors, layout } from '@/theme';
import { assetUrl } from '@/services/http';
import type { SessionUser } from '@/shared/contracts';

export function UserAvatar({
  size = 48,
  profile,
}: {
  size?: number;
  profile?: Pick<SessionUser, 'id' | 'name' | 'avatar'>;
}) {
  const sessionUser = useAuthStore((state) => state.user);
  const user = profile || sessionUser;
  const localPhoto = useAvatarStore((state) =>
    user ? state.photos[user.id] : null,
  );
  const [failed, setFailed] = useState<string | null>(null);
  useEffect(() => {
    if (user?.id)
      void useAvatarStore
        .getState()
        .load(user.id)
        .catch(() => {});
  }, [user?.id]);
  const uri = user?.avatar?.startsWith('/api/attachments/')
    ? user.avatar
    : localPhoto || user?.avatar;
  const initials = (user?.name || 'Meu perfil')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0])
    .join('')
    .toUpperCase();
  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      {uri && failed !== uri ? (
        <Image
          source={{ uri: assetUrl(uri) }}
          style={styles.image}
          contentFit="cover"
          accessibilityLabel={`Foto de ${user?.name || 'perfil'}`}
          onError={() => setFailed(uri)}
        />
      ) : (
        <AppText
          variant={size >= 80 ? 'screenTitle' : 'label'}
          accessibilityLabel={`Perfil de ${user?.name || 'usuário'}`}
        >
          {initials}
        </AppText>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  frame: {
    borderRadius: layout.radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSubdued,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
});
