import { useFocusEffect, useRouter } from 'expo-router'; // 👈 引入 useFocusEffect
import React, { useCallback, useRef, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabase';

export default function App() {
  const [categories, setCategories] = useState<any[]>([]);
  const [shoppingList, setShoppingList] = useState<any[]>([]);
  
  const router = useRouter();

  // 👈 核心升级：只要页面一出现，就强制刷新数据
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    // 1. 获取分类，并在电脑终端打印出来
    let { data: categoryData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });
    
    console.log("🔍 分类数据返回结果:", categoryData, "错误:", catError); // 👈 重点看你的终端输出
    
    if (catError) {
      Alert.alert('❌ 数据库拦截', '无法读取分类: ' + catError.message);
    } else if (categoryData) {
      setCategories(categoryData);
    }

    // 2. 获取待买清单
    let { data: itemsData, error: itemError } = await supabase
      .from('items')
      .select('*, categories(name)')
      .gt('to_buy', 0);
      
    if (itemsData) setShoppingList(itemsData);
  };

  const lastTapRef = useRef<number>(0);

  const handleDoubleTap = (item: any) => {
    const now = Date.now();
    if (now - lastTapRef.current < 400) {
      executePurchase(item); 
      lastTapRef.current = 0; 
    } else {
      lastTapRef.current = now; 
    }
  };

  const executePurchase = async (item: any) => {
    const newQuantity = item.quantity + item.to_buy; 
    
    const { error } = await supabase
      .from('items')
      .update({ quantity: newQuantity, to_buy: 0 }) 
      .eq('id', item.id);

    if (!error) {
      // 购买成功后直接刷新界面，移除 Alert 弹窗，实现无缝静默体验
      fetchData(); 
    } else {
      Alert.alert('更新失败', error.message); // 只有报错时才弹窗提示
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
        <Text style={styles.sectionTitle}>📝 待买清单 (双击完成购买)</Text>
        {shoppingList.map((item: any) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.shoppingItem} 
            activeOpacity={0.6}
            onPress={() => handleDoubleTap(item)}
          >
            <Text style={styles.itemText}>{item.name}</Text>
            <View style={styles.actionRow}>
              <Text style={styles.itemTag}>需买 {item.to_buy} 个</Text>
            </View>
          </TouchableOpacity>
        ))}
        {shoppingList.length === 0 && (
          <Text style={styles.emptyText}>太棒啦，目前不需要买任何东西！</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🗂️ 我的收纳</Text>
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

// 样式保持不变...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6E3', padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#8D6E63', marginTop: 20, marginBottom: 20, textAlign: 'center' },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#5D4037', marginBottom: 15, marginLeft: 5 },
  row: { justifyContent: 'space-between', marginBottom: 15 },
  card: { backgroundColor: '#FFFFFF', width: '47%', padding: 20, borderRadius: 24, alignItems: 'center', shadowColor: '#78C8A0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, borderWidth: 2, borderColor: '#EFEBE0' },
  cardIcon: { fontSize: 32, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#8D6E63' },
  shoppingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 18, borderRadius: 16, marginBottom: 10, borderWidth: 2, borderColor: '#C8E6C9' },
  itemText: { fontSize: 18, color: '#2E7D32', fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  itemTag: { fontSize: 14, color: '#8D6E63', backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, overflow: 'hidden', fontWeight: '600' },
  emptyText: { color: '#A1887F', marginLeft: 5, fontStyle: 'italic' }
});