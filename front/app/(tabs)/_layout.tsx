import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppTabBar } from '@/components/ui/AppTabBar';
import { mapPerformanceVariant } from '@/features/territory/mapPerformance';

export const unstable_settings = {
  anchor: 'TerritoryScreen',
};

export default function TabLayout() {
  return (
    <Tabs
      backBehavior="initialRoute"
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
          href: null,
          title: 'Explorar',
        }}
      />
      <Tabs.Screen
        name="TerritoryScreen"
        options={{
          title: 'Explorar',
          tabBarLabel: 'Explorar',
          freezeOnBlur: mapPerformanceVariant !== 'unfrozen',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'map' : 'map-outline'}
              color={typeof color === 'string' ? color : undefined}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="FollowScreen"
        options={{
          title: 'Salvos',
          tabBarLabel: 'Salvos',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'bookmark' : 'bookmark-outline'}
              color={typeof color === 'string' ? color : undefined}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ParticipateScreen"
        options={{
          title: 'Agir',
          tabBarLabel: 'Agir',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'megaphone' : 'megaphone-outline'}
              color={typeof color === 'string' ? color : undefined}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ProfileScreen"
        options={{
          title: 'Perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              color={typeof color === 'string' ? color : undefined}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
