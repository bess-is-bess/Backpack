import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://gtvfpqyxmymdbuqihkzj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0dmZwcXl4bXltZGJ1cWloa3pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NDk2MzIsImV4cCI6MjA4NzEyNTYzMn0.jWDQoJJnMoLvfaJtBXpfkYYbhl7RL3m43ON1V4w1SWA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});