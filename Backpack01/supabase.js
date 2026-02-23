import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native'; // 👈 引入 Platform 模块

// ⚠️ 注意：这里要保留你原本自己的 URL 和 Anon Key！不要直接复制这几行占位符！
const supabaseUrl = 'https://gtvfpqyxmymdbuqihkzj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0dmZwcXl4bXltZGJ1cWloa3pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NDk2MzIsImV4cCI6MjA4NzEyNTYzMn0.jWDQoJJnMoLvfaJtBXpfkYYbhl7RL3m43ON1V4w1SWA';

// 🌟 核心修复：创建一个能自动识别环境的存储保护壳
const customStorageAdapter = {
  getItem: (key) => {
    // 如果是 Web 预渲染端（没有 window 对象），直接返回空，防止崩溃
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return Promise.resolve(null);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: (key, value) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return Promise.resolve();
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return Promise.resolve();
    }
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorageAdapter, // 👈 重点：替换掉原来的 AsyncStorage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});