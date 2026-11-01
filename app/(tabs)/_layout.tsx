import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppTabBar } from '@/components/ui/AppTabBar';
import { useAuthStore } from '@/stores/authStore';

export default function TabLayout() {
  const authenticated = useAuthStore((s) => s.isReady && s.isAuthenticated);
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      detachInactiveScreens={false}
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="TerritoryScreen"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'map' : 'map-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="FollowScreen"
        options={{
          title: 'Acompanhar',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'bookmark' : 'bookmark-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ParticipateScreen"
        options={{
          title: 'Agir',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'hand-left' : 'hand-left-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Protected guard={authenticated}>
        <Tabs.Screen name="ReportScreen" options={{ href: null }} />
        <Tabs.Screen name="ProblemsListScreen" options={{ href: null }} />
        <Tabs.Screen name="ProfileScreen" options={{ href: null }} />
      </Tabs.Protected>
    </Tabs>
  );
}
