import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import { create } from 'zustand';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { colors } from '@/theme/colors';
import { useAuthStore } from '@/stores/authStore';
export const useMenu = create<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>((set) => ({ open: false, setOpen: (open) => set({ open }) }));
export function SideMenu() {
  const { open, setOpen } = useMenu();
  const user = useAuthStore((s) => s.user);
  const links: [string, Href][] = [
    ['Meu perfil', '/(tabs)/ProfileScreen'],
    ['Município e bairros', '/CityScreen'],
    ['Resultados', '/ResultsScreen'],
    ['Ajuda e acessibilidade', '/HelpScreen'],
    ['Preferências', '/SettingsScreen'],
    ['Sobre', '/AboutScreen'],
  ];
  return (
    <Modal
      transparent
      visible={open}
      animationType="none"
      onRequestClose={() => setOpen(false)}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.panel} accessibilityViewIsModal>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
            <AppButton
              title="Fechar menu"
              variant="quiet"
              onPress={() => setOpen(false)}
            />
            <AppText variant="sectionTitle">Fiscaliza-AI</AppText>
            <AppText color="muted">{user?.name}</AppText>
            {user?.municipality&&<AppText color="muted">{user.municipality.name} · {user.municipality.state}</AppText>}
            {links.map(([label, path]) => (
              <AppButton
                key={label}
                title={label}
                variant="quiet"
                onPress={() => {
                  setOpen(false);
                  router.push(path);
                }}
              />
            ))}
          </ScrollView>
        </SafeAreaView>
        <Pressable
          style={{ flex: 1 }}
          accessibilityLabel="Fechar menu"
          accessibilityRole="button"
          onPress={() => setOpen(false)}
        />
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  panel: { width: '85%', maxWidth: 340, backgroundColor: colors.canvas },
});
