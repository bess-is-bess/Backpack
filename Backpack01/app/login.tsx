import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 登录逻辑
  const signInWithEmail = async () => {
    if (!email || !password) return Alert.alert('提示', '请填写邮箱和密码哦！');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (Platform.OS === 'web') window.alert('登录失败: ' + error.message);
      else Alert.alert('登录失败', error.message);
    }
    setLoading(false);
  };

  // 注册逻辑
  const signUpWithEmail = async () => {
    if (!email || !password) return Alert.alert('提示', '请填写邮箱和密码哦！');
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      if (Platform.OS === 'web') window.alert('注册失败: ' + error.message);
      else Alert.alert('注册失败', error.message);
    } else {
      const msg = '欢迎加入！\n\n如果您的 Supabase 开启了邮箱验证，请先去邮箱点击确认链接。(如果未开启则可直接登录)';
      if (Platform.OS === 'web') window.alert('注册成功 🎉\n\n' + msg);
      else Alert.alert('注册成功 🎉', msg);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        
        <View style={styles.header}>
          <Text style={styles.icon}>🏕️</Text>
          <Text style={styles.title}>My Backpack</Text>
          <Text style={styles.subtitle}>专属你的私人收纳空间</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>邮箱 (Email)</Text>
          <TextInput
            style={styles.input}
            placeholder="hello@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#D7CCC8"
          />

          <Text style={styles.label}>密码 (Password)</Text>
          <TextInput
            style={styles.input}
            placeholder="******"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#D7CCC8"
          />

          {loading ? (
            <ActivityIndicator size="large" color="#78C8A0" style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.btnContainer}>
              <TouchableOpacity style={styles.loginBtn} onPress={signInWithEmail}>
                <Text style={styles.loginBtnText}>登 录</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.signupBtn} onPress={signUpWithEmail}>
                <Text style={styles.signupBtnText}>注册新账号</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6E3' },
  content: { flex: 1, justifyContent: 'center', padding: 30 },
  header: { alignItems: 'center', marginBottom: 40 },
  icon: { fontSize: 60, marginBottom: 10 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#5D4037', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#8D6E63', fontWeight: '500' },
  form: { backgroundColor: '#FFFFFF', padding: 25, borderRadius: 24, shadowColor: '#78C8A0', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5, borderWidth: 2, borderColor: '#EFEBE0' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#8D6E63', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#FDF6E3', borderRadius: 16, padding: 16, color: '#5D4037', fontWeight: '600', borderWidth: 1, borderColor: '#EFEBE0', fontSize: 16, marginBottom: 10 },
  btnContainer: { marginTop: 25, gap: 15 },
  loginBtn: { backgroundColor: '#78C8A0', padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5 },
  loginBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  signupBtn: { backgroundColor: '#EFEBE0', padding: 16, borderRadius: 16, alignItems: 'center' },
  signupBtnText: { color: '#8D6E63', fontSize: 16, fontWeight: 'bold' }
});