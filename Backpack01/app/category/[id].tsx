import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabase';

export default function CategoryDetail() {
  const { id, name } = useLocalSearchParams(); 
  const router = useRouter();
  
  const [items, setItems] = useState<any[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [toBuyQuantity, setToBuyQuantity] = useState('1'); 

  useEffect(() => {
    fetchCategoryItems();
  }, [id]);

  const fetchCategoryItems = async () => {
    let { data } = await supabase
      .from('items')
      .select('*')
      .eq('category_id', id)
      .order('created_at', { ascending: false });
      
    if (data) setItems(data);
  };

  // 1. 添加全新物品
  const handleAddItem = async () => {
    if (!newItemName.trim()) return; 

    const { error } = await supabase
      .from('items')
      .insert([
        { 
          category_id: id, 
          name: newItemName, 
          quantity: 0, 
          to_buy: parseInt(toBuyQuantity) || 1 // 直接记入待买数量
        }
      ]);

    if (!error) {
      setNewItemName(''); 
      setToBuyQuantity('1'); 
      fetchCategoryItems(); 
    }
  };

  // 2. 为已有的物品增加待买数量
  const handleAddMoreToBuy = async (item: any) => {
    const { error } = await supabase
      .from('items')
      .update({ to_buy: item.to_buy + 1 })
      .eq('id', item.id);
      
    if (!error) fetchCategoryItems();
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.quantityText}>
          背包已有: {item.quantity} {item.to_buy > 0 ? ` | 🛒 待买清单中: ${item.to_buy}` : ''}
        </Text>
      </View>
      
      {/* 快捷加入待买按钮 */}
      <TouchableOpacity style={styles.buyMoreBtn} onPress={() => handleAddMoreToBuy(item)}>
        <Text style={styles.buyMoreText}>+1 待买</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{'< 返回'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{name} 收纳盒 📦</Text>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item: any) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inputSection}>
        <Text style={styles.inputLabel}>✨ 记录需要买的新物品</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.nameInput}
            placeholder="物品名称 (如: 可乐)"
            value={newItemName}
            onChangeText={setNewItemName}
            placeholderTextColor="#A1887F"
          />
          <TextInput
            style={styles.qtyInput}
            placeholder="买几个"
            value={toBuyQuantity}
            onChangeText={setToBuyQuantity}
            keyboardType="numeric"
            placeholderTextColor="#A1887F"
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddItem}>
          <Text style={styles.addBtnText}>加入清单并列入待买</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// 样式部分
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6E3' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 2, borderBottomColor: '#EFEBE0' },
  backBtn: { marginRight: 15, padding: 10, backgroundColor: '#EFEBE0', borderRadius: 12 },
  backBtnText: { color: '#8D6E63', fontWeight: 'bold', fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#5D4037' },
  listContainer: { padding: 20 },
  itemCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#78C8A0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#EFEBE0' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 18, fontWeight: 'bold', color: '#8D6E63', marginBottom: 4 },
  quantityText: { color: '#A1887F', fontSize: 13, fontWeight: '600' },
  buyMoreBtn: { backgroundColor: '#FFF3E0', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#FFE0B2' },
  buyMoreText: { color: '#EF6C00', fontWeight: 'bold', fontSize: 13 },
  inputSection: { padding: 25, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EFEBE0', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  inputLabel: { fontSize: 16, fontWeight: 'bold', color: '#78C8A0', marginBottom: 15 },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  nameInput: { flex: 0.7, backgroundColor: '#FDF6E3', borderRadius: 16, padding: 18, color: '#5D4037', fontWeight: '600', fontSize: 16 },
  qtyInput: { flex: 0.25, backgroundColor: '#FDF6E3', borderRadius: 16, padding: 18, textAlign: 'center', color: '#5D4037', fontWeight: 'bold', fontSize: 16 },
  addBtn: { backgroundColor: '#78C8A0', padding: 18, borderRadius: 16, alignItems: 'center' },
  addBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }
});