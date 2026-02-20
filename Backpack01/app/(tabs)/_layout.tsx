import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#78C8A0', // 动森绿
        headerShown: false,
        tabBarButton: HapticTab,
        // 移除了会导致报错的 TabBarBackground
        tabBarStyle: Platform.select({
          ios: { position: 'absolute', backgroundColor: '#FFFFFF' },
          default: { backgroundColor: '#FFFFFF' },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '待买清单',
          // 换回了默认支持的 paperplane.fill 图标，完美避开 TS 报错
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}