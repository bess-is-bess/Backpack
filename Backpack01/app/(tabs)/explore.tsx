import { useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabase';
// 👈 引入手势库的核心组件
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

export default function ShoppingListScreen() {
  const [shoppingList, setShoppingList] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      fetchShoppingList();
    }, [])
  );

  const fetchShoppingList = async () => {
    let { data: itemsData } = await supabase
      .from('items')
      .select('*, categories(name)')
      .gt('to_buy', 0)
      .order('created_at', { ascending: false });
      
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
    const { error } = await supabase.from('items').update({ quantity: newQuantity, to_buy: 0 }).eq('id', item.id);
    if (!error) fetchShoppingList(); 
  };

  const handleAddMoreToBuy = async (item: any) => {
    const { error } = await supabase.from('items').update({ to_buy: item.to_buy + 1 }).eq('id', item.id);
    if (!error) fetchShoppingList(); 
  };

  // 从清单中移除 (只是把 to_buy 清零，不破坏背包库存)
  const handleRemoveFromList = async (item: any) => {
    const { error } = await supabase.from('items').update({ to_buy: 0 }).eq('id', item.id);
    if (!error) fetchShoppingList();
  };

  // 👈 新增：渲染左滑后出现的隐藏按钮组
  const renderRightActions = (item: any) => (
    <View style={styles.swipeActionsContainer}>
      <TouchableOpacity style={[styles.swipeActionBtn, { backgroundColor: '#FFB74D' }]} onPress={() => handleAddMoreToBuy(item)}>
        <Text style={styles.swipeActionText}>+1</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.swipeActionBtn, { backgroundColor: '#EF5350' }]} onPress={() => handleRemoveFromList(item)}>
        <Text style={styles.swipeActionText}>删除</Text>
      </TouchableOpacity>
    </View>
  );

  const renderShoppingItem = ({ item }: { item: any }) => (
    <View style={styles.swipeContainer}>
      {/* 👈 将物品卡片包裹在 Swipeable 内部 */}
      <Swipeable renderRightActions={() => renderRightActions(item)} overshootRight={false}>
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
          </View>
        </TouchableOpacity>
      </Swipeable>
    </View>
  );

  return (
    // 👈 必须用 GestureHandlerRootView 包裹整个页面才能使手势生效
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.headerTitle}>待买清单 🛒</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 购物清单 (双击完成购买，左滑更多选项)</Text>
          <FlatList
            data={shoppingList}
            renderItem={renderShoppingItem}
            keyExtractor={(item: any) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={<Text style={styles.emptyText}>太棒啦，目前不需要买任何东西！✨</Text>}
          />
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// 样式部分
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6E3', padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#8D6E63', marginTop: 20, marginBottom: 20, textAlign: 'center' },
  section: { flex: 1, marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#5D4037', marginBottom: 15, marginLeft: 5 },
  
  // 👈 修改了原有的外层框样式，用于适配滑动组件
  swipeContainer: { marginBottom: 12, borderRadius: 16, borderWidth: 2, borderColor: '#C8E6C9', overflow: 'hidden', backgroundColor: '#E8F5E9' },
  shoppingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 18 },
  
  itemInfo: { flex: 1 },
  itemText: { fontSize: 18, color: '#2E7D32', fontWeight: 'bold' },
  categoryTag: { fontSize: 12, color: '#388E3C', marginTop: 5, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemTag: { fontSize: 14, color: '#8D6E63', backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, overflow: 'hidden', fontWeight: '600' },
  emptyText: { color: '#A1887F', marginLeft: 5, fontStyle: 'italic', textAlign: 'center', marginTop: 40 },
  
  // 👈 滑动隐藏按钮的专属样式
  swipeActionsContainer: { flexDirection: 'row' },
  swipeActionBtn: { justifyContent: 'center', alignItems: 'center', width: 75 },
  swipeActionText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }
});