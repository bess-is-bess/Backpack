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
        
        // 🚀 核心修复：针对 Web 端独立设置高度和底部安全距离
        tabBarStyle: Platform.select({
          web: { 
            backgroundColor: '#FFFFFF',
            height: 85,             // 👈 强行增加整个底部导航栏的高度
            paddingBottom: 30,      // 👈 把按钮整体往上顶，给手机底部的“小横条”留出绝对安全的空间
            paddingTop: 10,         // 👈 让图标和文字视觉上居中
          },
          ios: { position: 'absolute', backgroundColor: '#FFFFFF' },
          default: { backgroundColor: '#FFFFFF' },
        }),
        
        // 让文字稍微变大一点点，更像原生 App
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        }
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: '陈列室', // 👈 顺手帮你把文字改成中文，和整体更搭
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '待买清单',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
      
    </Tabs>
  );
}