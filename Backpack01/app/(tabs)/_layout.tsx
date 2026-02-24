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
        
        tabBarStyle: Platform.select({
          web: { 
            position: 'absolute',
            bottom: 25,          
            left: 20,            
            right: 20,
            backgroundColor: '#FFFFFF',
            borderRadius: 35,    // 变得更圆润，像完美的药丸形
            height: 75,          // 👈 核心修复 1：稍微加高胶囊总体高度 (从 65 改为 75)
            paddingBottom: 8,   // 👈 核心修复 2：把底部的文字“往上托”，防止被底边切掉
            paddingTop: 12,      // 把顶部的图标“往下压”，实现绝对垂直居中
            borderTopWidth: 0,   
            
            // 超有质感的悬浮阴影
            shadowColor: '#78C8A0',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 15,
            elevation: 10,
          },
          ios: { position: 'absolute', backgroundColor: '#FFFFFF' },
          default: { backgroundColor: '#FFFFFF' },
        }),
        
        // 👈 移除了之前多余的 tabBarItemStyle，防止它扰乱内部排版

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4, // 让文字和图标之间保留舒适距离
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '陈列室', 
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '待买清单',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}