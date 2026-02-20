import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabase';

export default function CategoryDetail() {
  const { id, name } = useLocalSearchParams(); 
  const router = useRouter();
  
  const [items, setItems] = useState<any[]>([]);
  const [newItemName, setNewItemName] = useState('');

  // 控制编辑模态框 (Modal) 的状态
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // 编辑表单的具体内容
  const [editName, setEditName] = useState('');           // 👈 新增：允许改名
  const [editQuantity, setEditQuantity] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState(''); // 👈 新增：备注描述

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

  const handleAddItem = async () => {
    if (!newItemName.trim()) return; 

    const { error } = await supabase
      .from('items')
      .insert([{ category_id: id, name: newItemName, quantity: 0, to_buy: 0 }]);

    if (!error) {
      setNewItemName(''); 
      fetchCategoryItems(); 
    }
  };

  const handleAddMoreToBuy = async (item: any) => {
    const { error } = await supabase
      .from('items')
      .update({ to_buy: item.to_buy + 1 })
      .eq('id', item.id);
      
    if (!error) fetchCategoryItems();
  };

  // 长按打开编辑框，把旧数据填进去
  const openEditModal = (item: any) => {
    setEditingItem(item);
    setEditName(item.name || '');               // 载入旧名字
    setEditQuantity(item.quantity?.toString() || '0');
    setEditPrice(item.price || '');             // 载入价格
    setEditDescription(item.description || ''); // 载入旧备注
    setModalVisible(true);
  };

  // 保存编辑的数据到数据库
  const saveEdit = async () => {
    if (!editingItem) return;
    if (!editName.trim()) return; // 名字不能为空

    const { error } = await supabase
      .from('items')
      .update({ 
        name: editName,                         // 保存新名字
        quantity: parseInt(editQuantity) || 0,
        price: editPrice,
        description: editDescription            // 保存新备注
      })
      .eq('id', editingItem.id);

    if (!error) {
      setModalVisible(false);
      setEditingItem(null);
      fetchCategoryItems(); // 刷新列表看最新效果
    } else {
      console.error("更新失败:", error);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.itemCard} 
      activeOpacity={0.7}
      onLongPress={() => openEditModal(item)}
    >
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        
        {/* 如果有价格，显示出来 */}
        {item.price ? <Text style={styles.metaText}>💰 价值: {item.price}</Text> : null}
        
        {/* 👈 新增：如果有备注，显示备注 */}
        {item.description ? (
          <Text style={styles.descText} numberOfLines={2}>📝 {item.description}</Text>
        ) : null}

        <Text style={styles.quantityText}>
          背包已有: {item.quantity} {item.to_buy > 0 ? ` | 🛒 待买清单中: ${item.to_buy}` : ''}
        </Text>
      </View>
      
      <TouchableOpacity style={styles.buyMoreBtn} onPress={() => handleAddMoreToBuy(item)}>
        <Text style={styles.buyMoreText}>+1 待买</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 隐藏原生顶部导航 */}
      <Stack.Screen options={{ headerShown: false }} />

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
        ListEmptyComponent={<Text style={styles.emptyText}>这里空空的，快来添加物品吧！🌱</Text>}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inputSection}>
        <Text style={styles.inputLabel}>✨ 登记新物品 (长按物品可编辑属性)</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.nameInput}
            placeholder="物品名称 (如: 可乐)"
            value={newItemName}
            onChangeText={setNewItemName}
            placeholderTextColor="#A1887F"
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddItem}>
          <Text style={styles.addBtnText}>加入收纳</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* 📝 编辑物品的动森风弹窗 */}
      <Modal visible={isModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <Text style={styles.modalTitle}>✏️ 编辑物品信息</Text>
            
            <Text style={styles.modalLabel}>物品名称</Text>
            <TextInput 
              style={styles.modalInput} 
              value={editName} 
              onChangeText={setEditName} 
            />
            
            <Text style={styles.modalLabel}>当前数量</Text>
            <TextInput 
              style={styles.modalInput} 
              value={editQuantity} 
              onChangeText={setEditQuantity} 
              keyboardType="numeric" 
            />

            <Text style={styles.modalLabel}>价钱 (可选)</Text>
            <TextInput 
              style={styles.modalInput} 
              value={editPrice} 
              onChangeText={setEditPrice} 
              placeholder="例如: 15.99"
              placeholderTextColor="#D7CCC8"
            />

            <Text style={styles.modalLabel}>备注 Description (可选)</Text>
            <TextInput 
              style={[styles.modalInput, styles.textArea]} 
              value={editDescription} 
              onChangeText={setEditDescription} 
              placeholder="写点关于它的备忘录吧..."
              placeholderTextColor="#D7CCC8"
              multiline={true}
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={saveEdit}>
                <Text style={styles.modalSaveText}>保存</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  emptyText: { textAlign: 'center', color: '#A1887F', marginTop: 40, fontSize: 16 },
  itemCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#78C8A0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#EFEBE0' },
  itemInfo: { flex: 1, paddingRight: 10 },
  itemName: { fontSize: 18, fontWeight: 'bold', color: '#8D6E63', marginBottom: 4 },
  metaText: { fontSize: 13, color: '#F57C00', fontWeight: '600', marginBottom: 4 },
  descText: { fontSize: 13, color: '#A1887F', fontStyle: 'italic', marginBottom: 8, lineHeight: 18 },
  quantityText: { color: '#78C8A0', fontSize: 13, fontWeight: 'bold', marginTop: 4 },
  buyMoreBtn: { backgroundColor: '#FFF3E0', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#FFE0B2' },
  buyMoreText: { color: '#EF6C00', fontWeight: 'bold', fontSize: 13 },
  inputSection: { padding: 25, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EFEBE0', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#78C8A0', marginBottom: 15 },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  nameInput: { flex: 1, backgroundColor: '#FDF6E3', borderRadius: 16, padding: 18, color: '#5D4037', fontWeight: '600', fontSize: 16 },
  addBtn: { backgroundColor: '#78C8A0', padding: 18, borderRadius: 16, alignItems: 'center' },
  addBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  
  // 弹窗样式
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FDF6E3', borderRadius: 24, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#5D4037', marginBottom: 15, textAlign: 'center' },
  modalLabel: { fontSize: 14, fontWeight: 'bold', color: '#8D6E63', marginBottom: 8, marginTop: 10 },
  modalInput: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, color: '#5D4037', fontWeight: '500', borderWidth: 1, borderColor: '#EFEBE0', fontSize: 15 },
  textArea: { minHeight: 80, textAlignVertical: 'top' }, // 👈 针对多行备注的样式优化
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  modalCancelBtn: { flex: 1, backgroundColor: '#EFEBE0', padding: 15, borderRadius: 14, marginRight: 10, alignItems: 'center' },
  modalCancelText: { color: '#8D6E63', fontWeight: 'bold', fontSize: 16 },
  modalSaveBtn: { flex: 1, backgroundColor: '#78C8A0', padding: 15, borderRadius: 14, marginLeft: 10, alignItems: 'center' },
  modalSaveText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }
});