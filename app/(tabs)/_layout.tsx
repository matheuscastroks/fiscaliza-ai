import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
        },
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="TerritoryScreen"
        options={{
          title: 'Território',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="map" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="ParticipateScreen"
        options={{
          title: 'Participar',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="people-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="FollowScreen"
        options={{
          title: 'Acompanhar',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons
              name="notifications-none"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen name="ReportScreen" options={{ href: null }} />
      <Tabs.Screen name="ProblemsListScreen" options={{ href: null }} />
      <Tabs.Screen name="ProfileScreen" options={{ href: null }} />
    </Tabs>
  );
}
