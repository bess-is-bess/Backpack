import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, TouchableOpacity as RNTouchableOpacity, SafeAreaView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { GestureHandlerRootView, Swipeable, TouchableOpacity } from 'react-native-gesture-handler';
import { supabase } from '../../supabase';

export default function CategoryDetail() {
  const { id, name, icon } = useLocalSearchParams(); 
  const router = useRouter();
  
  const [items, setItems] = useState<any[]>([]);

  // 🚀 新增：控制添加藏品弹窗的显示状态
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1'); // 默认添加数量为 1

  const [isModalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editName, setEditName] = useState('');           
  const [editQuantity, setEditQuantity] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState(''); 
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchCategoryItems();
  }, [id]);

  const fetchCategoryItems = async () => {
    let { data } = await supabase.from('items').select('*').eq('category_id', id).order('created_at', { ascending: false });
    if (data) setItems(data);
  };

  // 🚀 修改：通过弹窗添加物品的函数
  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      if (Platform.OS === 'web') window.alert('请输入藏品名称');
      else Alert.alert('提示', '请输入藏品名称');
      return; 
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (Platform.OS === 'web') window.alert('请先登录');
      else Alert.alert('错误', '请先登录');
      return;
    }

    const { error } = await supabase.from('items').insert([{ 
      category_id: id, 
      name: newItemName, 
      quantity: parseInt(newItemQuantity) || 1, // 读取输入的数量
      to_buy: 0,
      user_id: user.id
    }]);

    if (!error) { 
      setNewItemName(''); 
      setNewItemQuantity('1'); // 重置数量
      setAddModalVisible(false); // 关闭弹窗
      fetchCategoryItems(); 
    } else {
      if (Platform.OS === 'web') window.alert('添加失败: ' + error.message);
      else Alert.alert('添加失败', error.message);
    }
  };

  const handleAddMoreToBuy = async (item: any) => {
    const { error } = await supabase.from('items').update({ to_buy: item.to_buy + 1 }).eq('id', item.id);
    if (!error) fetchCategoryItems();
  };

  const handleDeleteItem = async (item: any) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`彻底丢弃\n\n确定要把 "${item.name}" 从你的博物馆中永远扔掉吗？`);
      if (confirmed) {
        const { error } = await supabase.from('items').delete().eq('id', item.id);
        if (!error) fetchCategoryItems();
      }
    } else {
      Alert.alert('彻底丢弃', `确定要把 "${item.name}" 从你的博物馆中永远扔掉吗？`, [
        { text: '取消', style: 'cancel' },
        { text: '扔掉', style: 'destructive', onPress: async () => {
            const { error } = await supabase.from('items').delete().eq('id', item.id);
            if (!error) fetchCategoryItems();
        }}
      ]);
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setEditName(item.name || '');               
    setEditQuantity(item.quantity?.toString() || '0');
    setEditPrice(item.price || '');             
    setEditDescription(item.description || ''); 
    setEditImageUrl(item.image_url || null); 
    setModalVisible(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      if (Platform.OS === 'web') window.alert('需要相册权限才能上传照片！');
      else Alert.alert('需要权限', '抱歉，我们需要相册权限才能上传照片！');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setEditImageUrl(base64Image); 
    }
  };

  const saveEdit = async () => {
    if (!editingItem || !editName.trim()) return;
    const { error } = await supabase.from('items').update({ 
      name: editName, 
      quantity: parseInt(editQuantity) || 0, 
      price: editPrice, 
      description: editDescription,
      image_url: editImageUrl 
    }).eq('id', editingItem.id);

    if (!error) { 
      setModalVisible(false); 
      setEditingItem(null); 
      fetchCategoryItems(); 
    } else { 
      if (Platform.OS === 'web') window.alert("保存失败: " + error.message);
      else Alert.alert("保存失败", error.message); 
    }
  };

  const renderRightActions = (item: any) => (
    <View style={styles.swipeActionsContainer}>
      <RNTouchableOpacity style={[styles.swipeActionBtn, { backgroundColor: '#FFB74D' }]} onPress={() => handleAddMoreToBuy(item)}>
        <Text style={styles.swipeActionText}>待买+1</Text>
      </RNTouchableOpacity>
      <RNTouchableOpacity style={[styles.swipeActionBtn, { backgroundColor: '#EF5350' }]} onPress={() => handleDeleteItem(item)}>
        <Text style={styles.swipeActionText}>删除</Text>
      </RNTouchableOpacity>
    </View>
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.swipeContainer}>
      <Swipeable renderRightActions={() => renderRightActions(item)} overshootRight={false}>
        <View style={styles.itemCard}>
          <TouchableOpacity 
            style={styles.itemInfo} 
            activeOpacity={0.6}
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.itemName}>{item.name}</Text>
            {item.price ? <Text style={styles.metaText}>💰 价值: {item.price}</Text> : null}
            {item.description ? <Text style={styles.descText} numberOfLines={2}>📝 {item.description}</Text> : null}
            <Text style={styles.quantityText}>
              背包已有: {item.quantity} {item.to_buy > 0 ? ` | 🛒 待买中: ${item.to_buy}` : ''}
            </Text>
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
        <Stack.Screen options={{ headerShown: false }} />
        
        {/* 🚀 头部修改：将原先居中靠左的标题排布，修改为两端对齐，并加入右上角的“+”按钮 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <RNTouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>{'返回'}</Text>
            </RNTouchableOpacity>
            <Text style={styles.title} numberOfLines={1}>{icon || '🏛️'} {name} 博物馆</Text>
          </View>

          {/* 右上角的添加按钮 */}
          <RNTouchableOpacity style={styles.headerAddBtn} onPress={() => setAddModalVisible(true)}>
            <Text style={styles.headerAddBtnText}>+</Text>
          </RNTouchableOpacity>
        </View>

        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>这里空空的，快来添加藏品吧！🌱</Text>}
        />

        {/* 🚀 移除底部固定的输入框区域，给列表腾出空间 */}

        {/* 🚀 新增：添加藏品的专属弹窗 */}
        <Modal visible={isAddModalVisible} transparent={true} animationType="slide">
          <RNTouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={Platform.OS === 'web' ? undefined : Keyboard.dismiss}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
              <TouchableWithoutFeedback onPress={Platform.OS === 'web' ? undefined : Keyboard.dismiss}>
                <View style={{ width: '100%' }}>
                  <Text style={styles.modalTitle}>✨ 登记新藏品</Text>
                  
                  <Text style={styles.modalLabel}>藏品名称</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="例如: 珍藏版可乐" 
                    value={newItemName} 
                    onChangeText={setNewItemName} 
                    autoFocus 
                  />
                  
                  <Text style={styles.modalLabel}>初始数量</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    value={newItemQuantity} 
                    onChangeText={setNewItemQuantity} 
                    keyboardType="numeric" 
                  />
                  
                  <View style={styles.modalActions}>
                    <RNTouchableOpacity style={styles.modalCancelBtn} onPress={() => setAddModalVisible(false)}>
                      <Text style={styles.modalCancelText}>取消</Text>
                    </RNTouchableOpacity>
                    <RNTouchableOpacity style={styles.modalSaveBtn} onPress={handleAddItem}>
                      <Text style={styles.modalSaveText}>加入博物馆</Text>
                    </RNTouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </RNTouchableOpacity>
        </Modal>

        {/* 编辑藏品弹窗 (原样保留) */}
        <Modal visible={isModalVisible} transparent={true} animationType="slide">
          <RNTouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={Platform.OS === 'web' ? undefined : Keyboard.dismiss}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
              <TouchableWithoutFeedback onPress={Platform.OS === 'web' ? undefined : Keyboard.dismiss}>
                <View style={{ width: '100%' }}>
                  <Text style={styles.modalTitle}>✏️ 编辑物品信息</Text>
                  
                  <View style={styles.imageUploadSection}>
                    <RNTouchableOpacity style={styles.imageUploadBtn} onPress={pickImage}>
                      {editImageUrl ? (
                        <Image source={{ uri: editImageUrl }} style={styles.previewImage} />
                      ) : (
                        <Text style={styles.imageUploadText}>📸 添加/更换照片</Text>
                      )}
                    </RNTouchableOpacity>
                    {editImageUrl ? (
                      <RNTouchableOpacity onPress={() => setEditImageUrl(null)} style={styles.removeImageBtn}>
                        <Text style={styles.removeImageText}>清除照片</Text>
                      </RNTouchableOpacity>
                    ) : null}
                  </View>

                  <Text style={styles.modalLabel}>藏品名称</Text>
                  <TextInput style={styles.modalInput} value={editName} onChangeText={setEditName} />
                  <Text style={styles.modalLabel}>当前数量</Text>
                  <TextInput style={styles.modalInput} value={editQuantity} onChangeText={setEditQuantity} keyboardType="numeric" />
                  <Text style={styles.modalLabel}>价钱 (可选)</Text>
                  <TextInput style={styles.modalInput} value={editPrice} onChangeText={setEditPrice} placeholderTextColor="#D7CCC8" />
                  <Text style={styles.modalLabel}>备注 Description (可选)</Text>
                  <TextInput style={[styles.modalInput, styles.textArea]} value={editDescription} onChangeText={setEditDescription} placeholderTextColor="#D7CCC8" multiline={true} numberOfLines={2} />
                  
                  <View style={styles.modalActions}>
                    <RNTouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                      <Text style={styles.modalCancelText}>取消</Text>
                    </RNTouchableOpacity>
                    <RNTouchableOpacity style={styles.modalSaveBtn} onPress={saveEdit}>
                      <Text style={styles.modalSaveText}>保存</Text>
                    </RNTouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </RNTouchableOpacity>
        </Modal>

        {/* 图片放大弹窗 (原样保留) */}
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
  container: { flex: 1, backgroundColor: '#FDF6E3' },
  
  // 🚀 头部样式大改：支持两侧布局
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', // 让左右两端分开
    paddingHorizontal: 20, 
    paddingVertical: 15, // 稍微缩小一点高度
    borderBottomWidth: 2, 
    borderBottomColor: '#EFEBE0' 
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // 占据剩余空间，防止标题被按钮挤压
  },
  backBtn: { marginRight: 15, padding: 10, backgroundColor: '#EFEBE0', borderRadius: 12 },
  backBtnText: { color: '#8D6E63', fontWeight: 'bold', fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#5D4037', flexShrink: 1 }, // 防止过长的名字撑破头部
  
  // 🚀 新增：右上角添加按钮的样式
  headerAddBtn: { 
    backgroundColor: '#78C8A0', 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 3, 
    elevation: 2 
  },
  headerAddBtnText: { color: '#FFFFFF', fontSize: 26, fontWeight: 'bold', lineHeight: 28, textAlign: 'center' },

  listContainer: { padding: 20, paddingBottom: 40 }, // 列表底部留一点空间
  emptyText: { textAlign: 'center', color: '#A1887F', marginTop: 40, fontSize: 16 },
  
  swipeContainer: { marginBottom: 15, borderRadius: 20, backgroundColor: '#FFFFFF', shadowColor: '#78C8A0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#EFEBE0', overflow: 'hidden' },
  itemCard: { backgroundColor: '#FFFFFF', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemInfo: { flex: 1, paddingRight: 10 },
  itemName: { fontSize: 18, fontWeight: 'bold', color: '#8D6E63', marginBottom: 4 },
  metaText: { fontSize: 13, color: '#F57C00', fontWeight: '600', marginBottom: 4 },
  descText: { fontSize: 13, color: '#A1887F', fontStyle: 'italic', marginBottom: 8, lineHeight: 18 },
  quantityText: { color: '#78C8A0', fontSize: 13, fontWeight: 'bold', marginTop: 4 },
  itemImageContainer: { width: 70, height: 70, borderRadius: 16, backgroundColor: '#FDF6E3', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#EFEBE0', marginLeft: 10 },
  itemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  swipeActionsContainer: { flexDirection: 'row', height: '100%' },
  swipeActionBtn: { justifyContent: 'center', alignItems: 'center', width: 75, height: '100%' },
  swipeActionText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FDF6E3', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#5D4037', marginBottom: 15, textAlign: 'center' },
  
  imageUploadSection: { alignItems: 'center', marginBottom: 15 },
  imageUploadBtn: { width: 100, height: 100, borderRadius: 20, backgroundColor: '#EFEBE0', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: '#D7CCC8', borderStyle: 'dashed' },
  imageUploadText: { color: '#8D6E63', fontWeight: 'bold', textAlign: 'center', fontSize: 13, padding: 5 },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  removeImageBtn: { marginTop: 8 },
  removeImageText: { color: '#EF5350', fontSize: 13, fontWeight: 'bold' },
  
  modalLabel: { fontSize: 14, fontWeight: 'bold', color: '#8D6E63', marginBottom: 6, marginTop: 10 },
  modalInput: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, color: '#5D4037', fontWeight: '500', borderWidth: 1, borderColor: '#EFEBE0', fontSize: 15 },
  textArea: { minHeight: 60, textAlignVertical: 'top' }, 
  
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: Platform.OS === 'ios' ? 20 : 0 },
  modalCancelBtn: { flex: 1, backgroundColor: '#EFEBE0', padding: 15, borderRadius: 14, marginRight: 10, alignItems: 'center' },
  modalCancelText: { color: '#8D6E63', fontWeight: 'bold', fontSize: 16 },
  modalSaveBtn: { flex: 1, backgroundColor: '#78C8A0', padding: 15, borderRadius: 14, marginLeft: 10, alignItems: 'center' },
  modalSaveText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  
  zoomModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  zoomedImage: { width: '100%', height: '80%' }
});