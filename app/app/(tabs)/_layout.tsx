import { Tabs } from 'expo-router';
import React from 'react';
import { COLORS } from '@/constants/Config';
import { Home, Video, Bell, User, Radio } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textDim,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: 'rgba(0,0,0,0.05)',
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 8,
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 4,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="monitor"
        options={{
          title: 'Monitor',
          tabBarIcon: ({ color }) => <Video size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="broadcast"
        options={{
          href: null, // This hides it from the bottom tab bar
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => <Bell size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Agency',
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
