import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FloatingGlassTabBar } from '@/components/ui/FloatingGlassTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
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
          title: 'Território',
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
        name="ParticipateScreen"
        options={{
          title: 'Participar',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="FollowScreen"
        options={{
          title: 'Situação',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'pulse' : 'pulse-outline'}
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
