import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#78C8A0', // 动森绿
        headerShown: false,
        tabBarButton: HapticTab,
        
        tabBarStyle: {
          position: 'absolute',
          bottom: 25,
          marginHorizontal: 20,          
          backgroundColor: '#FFFFFF',
          borderRadius: 35,    
          height: 75,          
          paddingBottom: 8,   
          paddingTop: 12,      
          borderTopWidth: 0,   
          shadowColor: '#78C8A0',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 15,
          elevation: 10,
        },
        
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