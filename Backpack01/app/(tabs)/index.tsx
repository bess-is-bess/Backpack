import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabase';

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<any[]>([]);
  const router = useRouter();

  // 只要页面出现，就强制刷新数据
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    let { data: categoryData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (catError) {
      Alert.alert('❌ 数据库拦截', '无法读取分类: ' + catError.message);
    } else if (categoryData) {
      setCategories(categoryData);
    }
  };

  const renderCategory = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => {
        router.push({
          pathname: '/category/[id]' as any,
          params: { id: item.id, name: item.name }
        });
      }}
    >
      <Text style={styles.cardIcon}>{item.icon || '📦'}</Text>
      <Text style={styles.cardTitle}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>My Backpack 🏕️</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🗂️ 我的收纳 (Categories)</Text>
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item: any) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6E3', padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#8D6E63', marginTop: 20, marginBottom: 20, textAlign: 'center' },
  section: { flex: 1, marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#5D4037', marginBottom: 15, marginLeft: 5 },
  row: { justifyContent: 'space-between', marginBottom: 15 },
  card: { backgroundColor: '#FFFFFF', width: '47%', padding: 20, borderRadius: 24, alignItems: 'center', shadowColor: '#78C8A0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, borderWidth: 2, borderColor: '#EFEBE0' },
  cardIcon: { fontSize: 32, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#8D6E63' },
});