import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: layout.borderWidth.hairline,
          borderTopColor: colors.divider,
          paddingTop: 6,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          height: 56 + (insets.bottom > 0 ? insets.bottom : 8),
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="map" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ReportScreen"
        options={{
          title: 'Registrar',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="add-circle-outline" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ProblemsListScreen"
        options={{
          title: 'Ocorrências',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="format-list-bulleted" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ProfileScreen"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person-outline" size={size || 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
