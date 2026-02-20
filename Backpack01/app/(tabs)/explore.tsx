import { useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabase';

export default function ShoppingListScreen() {
  const [shoppingList, setShoppingList] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      fetchShoppingList();
    }, [])
  );

  const fetchShoppingList = async () => {
    let { data: itemsData, error: itemError } = await supabase
      .from('items')
      .select('*, categories(name)')
      .gt('to_buy', 0)
      .order('created_at', { ascending: false }); // 新加到清单的在前面
      
    if (itemError) {
      Alert.alert('❌ 读取失败', itemError.message);
    } else if (itemsData) {
      setShoppingList(itemsData);
    }
  };

  const lastTapRef = useRef<number>(0);

  // 双击手势：购买
  const handleDoubleTap = (item: any) => {
    const now = Date.now();
    if (now - lastTapRef.current < 400) {
      executePurchase(item); 
      lastTapRef.current = 0; 
    } else {
      lastTapRef.current = now; 
    }
  };

  // 静默购买逻辑
  const executePurchase = async (item: any) => {
    const newQuantity = item.quantity + item.to_buy; 
    
    const { error } = await supabase
      .from('items')
      .update({ quantity: newQuantity, to_buy: 0 }) 
      .eq('id', item.id);

    if (!error) {
      fetchShoppingList(); // 成功后立刻刷新列表 
    } else {
      Alert.alert('更新失败', error.message);
    }
  };

  // 👈 新增功能：直接在待买清单里 +1
  const handleAddMoreToBuy = async (item: any) => {
    const { error } = await supabase
      .from('items')
      .update({ to_buy: item.to_buy + 1 })
      .eq('id', item.id);

    if (!error) {
      fetchShoppingList(); 
    } else {
      Alert.alert('更新失败', error.message);
    }
  };

  const renderShoppingItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.shoppingItem} 
      activeOpacity={0.6}
      onPress={() => handleDoubleTap(item)}
    >
      <View style={styles.itemInfo}>
        <Text style={styles.itemText}>{item.name}</Text>
        <Text style={styles.categoryTag}>在 {item.categories?.name || '未知'} 分类下</Text>
      </View>
      
      <View style={styles.actionRow}>
        <Text style={styles.itemTag}>需买 {item.to_buy}</Text>
        {/* 👈 +1 按钮在此 */}
        <TouchableOpacity style={styles.addBtn} onPress={() => handleAddMoreToBuy(item)}>
          <Text style={styles.addBtnText}>+1</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>待买清单 🛒</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 购物清单 (双击整行完成购买)</Text>
        
        <FlatList
          data={shoppingList}
          renderItem={renderShoppingItem}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>太棒啦，目前不需要买任何东西！✨</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6E3', padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#8D6E63', marginTop: 20, marginBottom: 20, textAlign: 'center' },
  section: { flex: 1, marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#5D4037', marginBottom: 15, marginLeft: 5 },
  shoppingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 18, borderRadius: 16, marginBottom: 12, borderWidth: 2, borderColor: '#C8E6C9' },
  itemInfo: { flex: 1 },
  itemText: { fontSize: 18, color: '#2E7D32', fontWeight: 'bold' },
  categoryTag: { fontSize: 12, color: '#388E3C', marginTop: 5, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemTag: { fontSize: 14, color: '#8D6E63', backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, overflow: 'hidden', fontWeight: '600' },
  emptyText: { color: '#A1887F', marginLeft: 5, fontStyle: 'italic', textAlign: 'center', marginTop: 40 },
  addBtn: { backgroundColor: '#78C8A0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
  addBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }
});