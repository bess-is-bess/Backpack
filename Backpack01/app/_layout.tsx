import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '../supabase';

// 保持启动页显示，直到我们确认了用户的登录状态
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // 管理全局的登录 Session 状态
  const [session, setSession] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);

  const segments = useSegments();
  const router = useRouter();

  // 监听 Supabase 登录状态
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 状态初始化完成后，隐藏启动页
  useEffect(() => {
    if (initialized) {
      SplashScreen.hideAsync();
    }
  }, [initialized]);

  // 核心“门禁”逻辑，根据登录状态自动跳转
  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === ('login' as any);

    if (!session && !inAuthGroup) {
      // 没登录，且不在登录页 -> 强制去登录页
      router.replace('/login' as any);
    } else if (session && inAuthGroup) {
      // 已经登录了，还在登录页 -> 护送去主页面
      router.replace('/(tabs)' as any);
    }
  }, [session, initialized, segments]);

  // 如果还没初始化完，不渲染任何东西（此时启动页盖在上面）
  if (!initialized) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="category/[id]" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}