import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppTabBar } from '@/components/ui/AppTabBar';
import { mapPerformanceVariant } from '@/features/territory/mapPerformance';

export default function TabLayout() {
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
          freezeOnBlur: mapPerformanceVariant !== 'unfrozen',
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
      <Tabs.Screen
        name="ProfileScreen"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
