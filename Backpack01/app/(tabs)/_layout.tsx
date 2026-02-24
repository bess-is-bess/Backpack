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
        
        // 🚀 终极绝杀：全平台“悬浮胶囊”导航栏
        tabBarStyle: Platform.select({
          web: { 
            position: 'absolute',
            bottom: 25,          // 👈 距离屏幕底部 25px，彻底悬浮，避开所有物理死角！
            left: 20,            // 两侧留白，形成胶囊感
            right: 20,
            backgroundColor: '#FFFFFF',
            borderRadius: 25,    // 极致圆角
            height: 65,          // 锁定舒适高度
            paddingBottom: 0,    // 👈 清除所有默认内边距，防止内容被挤压
            borderTopWidth: 0,   // 去除默认的一条丑陋顶线
            
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
        
        // 确保内部的图标和文字完美垂直居中
        tabBarItemStyle: Platform.OS === 'web' ? {
          paddingTop: 8,
          paddingBottom: 8,
        } : undefined,

        // 优化文字大小和间距
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4, 
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