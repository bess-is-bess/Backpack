import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, TouchableOpacity as RNTouchableOpacity, SafeAreaView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { GestureHandlerRootView, Swipeable, TouchableOpacity } from 'react-native-gesture-handler';
import { supabase } from '../../supabase';

export default function ShoppingListScreen() {
  const [shoppingList, setShoppingList] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]); 

  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemToBuy, setNewItemToBuy] = useState('1');

  const [editItem, setEditItem] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editToBuy, setEditToBuy] = useState('');
  
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchShoppingListAndCategories();
    }, [])
  );

  const fetchShoppingListAndCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let { data: itemsData } = await supabase
      .from('items')
      .select('*, categories(name)')
      .eq('user_id', user.id)
      .gt('to_buy', 0)
      .order('created_at', { ascending: false });
    if (itemsData) setShoppingList(itemsData);

    let { data: catData } = await supabase.from('categories').select('*').eq('user_id', user.id);
    if (catData) {
      setCategories(catData);
      if (catData.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(catData[0].id);
      }
    }
  };

  const executePurchase = async (item: any) => {
    const newQuantity = item.quantity + item.to_buy; 
    await supabase.from('items').update({ quantity: newQuantity, to_buy: 0 }).eq('id', item.id);
    fetchShoppingListAndCategories(); 
  };

  const handleAddMoreToBuy = async (item: any) => {
    await supabase.from('items').update({ to_buy: item.to_buy + 1 }).eq('id', item.id);
    fetchShoppingListAndCategories(); 
  };

  const handleRemoveFromList = async (item: any) => {
    await supabase.from('items').update({ to_buy: 0 }).eq('id', item.id);
    fetchShoppingListAndCategories();
  };

  const handleAddNewItem = async () => {
    if (!newItemName.trim() || !selectedCategoryId) {
      Alert.alert("提示", "请输入物品名称并选择一个博物馆分类！");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('items').insert([{
      name: newItemName,
      to_buy: parseInt(newItemToBuy) || 1,
      quantity: 0,
      category_id: selectedCategoryId,
      user_id: user.id
    }]);

    if (!error) {
      setAddModalVisible(false);
      setNewItemName('');
      setNewItemToBuy('1');
      fetchShoppingListAndCategories();
    }
  };

  const openEditModal = (item: any) => {
    setEditItem(item);
    setEditName(item.name);
    setEditToBuy(item.to_buy.toString());
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editItem || !editName.trim()) return;
    const { error } = await supabase.from('items').update({
        name: editName,
        to_buy: parseInt(editToBuy) || 0
    }).eq('id', editItem.id);
    
    if (!error) {
       setEditModalVisible(false);
       fetchShoppingListAndCategories();
    }
  };

  const renderRightActions = (item: any) => (
    <View style={styles.swipeActionsContainer}>
      <RNTouchableOpacity style={[styles.swipeActionBtn, { backgroundColor: '#66BB6A' }]} onPress={() => executePurchase(item)}>
        <Text style={styles.swipeActionText}>买入</Text>
      </RNTouchableOpacity>
      <RNTouchableOpacity style={[styles.swipeActionBtn, { backgroundColor: '#FFB74D' }]} onPress={() => handleAddMoreToBuy(item)}>
        <Text style={styles.swipeActionText}>+1</Text>
      </RNTouchableOpacity>
      <RNTouchableOpacity style={[styles.swipeActionBtn, { backgroundColor: '#EF5350' }]} onPress={() => handleRemoveFromList(item)}>
        <Text style={styles.swipeActionText}>移除</Text>
      </RNTouchableOpacity>
    </View>
  );

  const renderShoppingItem = ({ item }: { item: any }) => (
    <View style={styles.swipeContainer}>
      <Swipeable renderRightActions={() => renderRightActions(item)} overshootRight={false}>
        <View style={styles.shoppingItem}>
          
          <TouchableOpacity 
            style={styles.itemInfo} 
            activeOpacity={0.6}
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.itemText}>{item.name}</Text>
            {item.description ? <Text style={styles.descText} numberOfLines={2}>📝 {item.description}</Text> : null}
            <Text style={styles.categoryTag}>在 {item.categories?.name || '未知'} 分类下</Text>
            <Text style={styles.itemTag}>🛒 需买数量: {item.to_buy}</Text>
          </TouchableOpacity>

          {item.image_url ? (
            <RNTouchableOpacity 
              style={styles.itemImageContainer}
              onPress={() => setZoomedImageUrl(item.image_url)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: item.image_url }} style={styles.itemImage} />
            </RNTouchableOpacity>
          ) : null}

        </View>
      </Swipeable>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.headerTitle}>待买清单 🛒</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 购物单 (轻点编辑，左滑买入/更多选项)</Text>
          <FlatList
            data={shoppingList}
            renderItem={renderShoppingItem}
            keyExtractor={(item: any) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={<Text style={styles.emptyText}>太棒啦，目前不需要买任何东西！✨</Text>}
          />
        </View>

        <RNTouchableOpacity style={styles.fab} onPress={() => setAddModalVisible(true)} activeOpacity={0.8}>
          <Text style={styles.fabIcon}>+</Text>
        </RNTouchableOpacity>

        <Modal visible={isAddModalVisible} transparent={true} animationType="slide">
          {/* 🚀 核心修复：添加物品弹窗兼容 Web 键盘 */}
          <RNTouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={Platform.OS === 'web' ? undefined : Keyboard.dismiss}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
              <TouchableWithoutFeedback onPress={Platform.OS === 'web' ? undefined : Keyboard.dismiss}>
                <View style={{ width: '100%' }}>
                  <Text style={styles.modalTitle}>✨ 添加待买物品</Text>
                  <TextInput style={styles.modalInput} placeholder="物品名称 (如: 牛奶)" value={newItemName} onChangeText={setNewItemName} autoFocus />
                  
                  <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 15}}>
                    <Text style={[styles.modalLabel, {marginTop: 0, marginRight: 15}]}>需买数量:</Text>
                    <TextInput style={[styles.modalInput, {flex: 1, marginBottom: 0}]} value={newItemToBuy} onChangeText={setNewItemToBuy} keyboardType="numeric" />
                  </View>

                  <Text style={styles.modalLabel}>选择放进哪个盒子：</Text>
                  <FlatList 
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={categories}
                    keyExtractor={c => c.id}
                    style={{ marginBottom: 20, maxHeight: 45 }}
                    renderItem={({item: c}) => (
                      <RNTouchableOpacity 
                        style={[styles.catBadge, selectedCategoryId === c.id && styles.catBadgeSelected]}
                        onPress={() => setSelectedCategoryId(c.id)}
                      >
                        <Text style={[styles.catBadgeText, selectedCategoryId === c.id && styles.catBadgeTextSelected]}>
                          {c.icon} {c.name}
                        </Text>
                      </RNTouchableOpacity>
                    )}
                  />

                  <View style={styles.modalActions}>
                    <RNTouchableOpacity style={styles.modalCancelBtn} onPress={() => setAddModalVisible(false)}><Text style={styles.modalCancelText}>取消</Text></RNTouchableOpacity>
                    <RNTouchableOpacity style={styles.modalSaveBtn} onPress={handleAddNewItem}><Text style={styles.modalSaveText}>添加进清单</Text></RNTouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </RNTouchableOpacity>
        </Modal>

        <Modal visible={isEditModalVisible} transparent={true} animationType="slide">
          {/* 🚀 核心修复：修改物品弹窗兼容 Web 键盘 */}
          <RNTouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={Platform.OS === 'web' ? undefined : Keyboard.dismiss}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
              <TouchableWithoutFeedback onPress={Platform.OS === 'web' ? undefined : Keyboard.dismiss}>
                <View style={{ width: '100%' }}>
                  <Text style={styles.modalTitle}>✏️ 修改待买物品</Text>
                  <Text style={styles.modalLabel}>物品名称</Text>
                  <TextInput style={styles.modalInput} value={editName} onChangeText={setEditName} />
                  <Text style={styles.modalLabel}>需买数量 (改成 0 即为删除)</Text>
                  <TextInput style={styles.modalInput} value={editToBuy} onChangeText={setEditToBuy} keyboardType="numeric" />
                  
                  <View style={styles.modalActions}>
                    <RNTouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditModalVisible(false)}>
                      <Text style={styles.modalCancelText}>取消</Text>
                    </RNTouchableOpacity>
                    <RNTouchableOpacity 
                      style={styles.modalBuyBtn} 
                      onPress={() => {
                        executePurchase(editItem);
                        setEditModalVisible(false);
                      }}
                    >
                      <Text style={styles.modalSaveText}>✅ 买入</Text>
                    </RNTouchableOpacity>
                    <RNTouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveEdit}>
                      <Text style={styles.modalSaveText}>保存</Text>
                    </RNTouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </RNTouchableOpacity>
        </Modal>

        <Modal visible={zoomedImageUrl !== null} transparent={true} animationType="fade">
          <RNTouchableOpacity style={styles.zoomModalOverlay} activeOpacity={1} onPress={() => setZoomedImageUrl(null)}>
            <Image source={{ uri: zoomedImageUrl || '' }} style={styles.zoomedImage} resizeMode="contain" />
          </RNTouchableOpacity>
        </Modal>

      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6E3', padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#8D6E63', marginTop: 20, marginBottom: 20, textAlign: 'center' },
  section: { flex: 1, marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#5D4037', marginBottom: 15, marginLeft: 5 },
  
  swipeContainer: { marginBottom: 12, marginHorizontal: 10, borderRadius: 16, borderWidth: 2, borderColor: '#C8E6C9', overflow: 'hidden', backgroundColor: '#E8F5E9' },
  shoppingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 15 },
  itemInfo: { flex: 1, paddingRight: 10 },
  itemText: { fontSize: 18, color: '#2E7D32', fontWeight: 'bold' },
  descText: { fontSize: 13, color: '#66BB6A', fontStyle: 'italic', marginTop: 4, lineHeight: 18 },
  categoryTag: { fontSize: 12, color: '#388E3C', marginTop: 5, fontStyle: 'italic' },
  itemTag: { fontSize: 14, color: '#1B5E20', fontWeight: 'bold', marginTop: 8 },
  itemImageContainer: { width: 65, height: 65, borderRadius: 14, backgroundColor: '#C8E6C9', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#A5D6A7' },
  itemImage: { width: '100%', height: '100%', resizeMode: 'cover' },

  emptyText: { color: '#A1887F', marginLeft: 5, fontStyle: 'italic', textAlign: 'center', marginTop: 40 },
  
  swipeActionsContainer: { flexDirection: 'row', height: '100%' },
  swipeActionBtn: { justifyContent: 'center', alignItems: 'center', width: 65, height: '100%' },
  swipeActionText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }, 
  
  fab: { position: 'absolute', right: 30, bottom: 110, width: 65, height: 65, borderRadius: 32.5, backgroundColor: '#B19CD9', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#B19CD9', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: {width:0, height:5} },
  fabIcon: { color: '#FFFFFF', fontSize: 40, fontWeight: '300', lineHeight: 45 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FDF6E3', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#5D4037', marginBottom: 20, textAlign: 'center' },
  modalLabel: { fontSize: 14, fontWeight: 'bold', color: '#8D6E63', marginBottom: 6, marginTop: 10 },
  modalInput: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 15, marginBottom: 15, color: '#5D4037', fontWeight: '500', borderWidth: 1, borderColor: '#EFEBE0', fontSize: 16 },
  catBadge: { backgroundColor: '#EFEBE0', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#D7CCC8' },
  catBadgeSelected: { backgroundColor: '#78C8A0', borderColor: '#78C8A0' },
  catBadgeText: { color: '#8D6E63', fontWeight: 'bold' },
  catBadgeTextSelected: { color: '#FFFFFF' },
  
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: Platform.OS === 'ios' ? 20 : 0 },
  modalCancelBtn: { flex: 1, backgroundColor: '#EFEBE0', padding: 15, borderRadius: 14, marginRight: 8, alignItems: 'center' },
  modalCancelText: { color: '#8D6E63', fontWeight: 'bold', fontSize: 16 },
  modalBuyBtn: { flex: 1, backgroundColor: '#66BB6A', padding: 15, borderRadius: 14, marginHorizontal: 4, alignItems: 'center' },
  modalSaveBtn: { flex: 1, backgroundColor: '#78C8A0', padding: 15, borderRadius: 14, marginLeft: 8, alignItems: 'center' },
  modalSaveText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  
  zoomModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  zoomedImage: { width: '100%', height: '80%' }
});