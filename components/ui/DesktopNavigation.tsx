import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname, type Href } from 'expo-router';
import { useTheme } from '@/theme/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { AppText } from './AppText';
import { AppBrandGlyph } from './AppBrandGlyph';
import { UserAvatar } from './UserAvatar';
import { useSignOutSheet } from './SignOutSheet';

const destinations = [
  ['Início', '/', 'home-outline'],
  ['Território', '/TerritoryScreen', 'map-outline'],
  ['Participar', '/ParticipateScreen', 'people-outline'],
  ['Situação', '/FollowScreen', 'pulse-outline'],
  ['Resultados e prazos', '/ResultsScreen', 'stats-chart-outline'],
  ['Panorama municipal', '/CityScreen', 'business-outline'],
  ['Como funciona', '/OnboardingScreen', 'book-outline'],
  ['Preferências', '/SettingsScreen', 'settings-outline'],
  ['Ajuda', '/HelpScreen', 'help-circle-outline'],
] as const;

/** Persistent counterpart to the mobile drawer; the route tree stays mounted. */
export function DesktopNavigation() {
  const { colors } = useTheme();
  const path = usePathname();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return (
    <View
      style={{
        width: 256,
        backgroundColor: colors.surface,
        borderRightWidth: 1,
        borderRightColor: colors.divider,
        padding: 24,
        gap: 24,
      }}
    >
      <Pressable
        onPress={() => router.push('/')}
        accessibilityRole="link"
        accessibilityLabel="Fiscaliza aí, início"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: colors.ink,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppBrandGlyph size={18} color={colors.onAccent} />
        </View>
        <AppText variant="screenTitle">Fiscaliza aí</AppText>
      </Pressable>
      <View style={{ gap: 4 }}>
        <AppText variant="label">
          {user?.municipality?.name || 'Rio de Janeiro · RJ'}
        </AppText>
        <AppText variant="caption" color="muted">
          Inteligência urbana · Rio
        </AppText>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 8 }}>
        {destinations.map(([label, route, icon]) => {
          const active = path === route;
          return (
            <Pressable
              key={route}
              accessibilityRole="link"
              accessibilityLabel={label}
              accessibilityState={{ selected: active }}
              onPress={() => router.push(route as Href)}
              style={({ pressed }) => ({
                minHeight: 52,
                borderRadius: 28,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: active
                  ? colors.accent
                  : pressed
                    ? colors.surfaceSubdued
                    : colors.transparent,
              })}
            >
              <Ionicons
                name={icon}
                size={21}
                color={active ? colors.onAccent : colors.muted}
              />
              <AppText variant="label" color={active ? 'onAccent' : 'ink'}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir perfil"
        onPress={() =>
          router.push(isAuthenticated ? '/ProfileScreen' : '/LoginScreen')
        }
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        <UserAvatar size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText variant="label" numberOfLines={1}>
            {user?.name || 'Visitante'}
          </AppText>
          <AppText variant="caption" color="muted">
            {isAuthenticated ? 'Meu perfil' : 'Acesso público'}
          </AppText>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          isAuthenticated
            ? useSignOutSheet.getState().setOpen(true)
            : router.push('/LoginScreen')
        }
        style={{
          minHeight: 48,
          justifyContent: 'center',
          borderTopWidth: 1,
          borderTopColor: colors.divider,
        }}
      >
        <AppText variant="label">
          {isAuthenticated ? 'Sair da conta' : 'Entrar na conta'}
        </AppText>
      </Pressable>
    </View>
  );
}
