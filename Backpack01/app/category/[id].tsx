import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, Image, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';

// 获取屏幕宽度，用于计算大图显示尺寸
const { width: screenWidth } = Dimensions.get('window');

export default function CategoryDetail() {
  const { id, name } = useLocalSearchParams(); 
  const router = useRouter();
  
  const [items, setItems] = useState<any[]>([]);
  const [newItemName, setNewItemName] = useState('');

  // 编辑弹窗状态
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editName, setEditName] = useState('');           
  const [editQuantity, setEditQuantity] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState(''); 
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);

  // 👈 新增：控制图片放大预览（灯箱）的状态，存储当前要放大的图片URL
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchCategoryItems();
  }, [id]);

  const fetchCategoryItems = async () => {
    let { data } = await supabase.from('items').select('*').eq('category_id', id).order('created_at', { ascending: false });
    if (data) setItems(data);
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return; 
    const { error } = await supabase.from('items').insert([{ category_id: id, name: newItemName, quantity: 0, to_buy: 0 }]);
    if (!error) { setNewItemName(''); fetchCategoryItems(); }
  };

  const handleAddMoreToBuy = async (item: any) => {
    const { error } = await supabase.from('items').update({ to_buy: item.to_buy + 1 }).eq('id', item.id);
    if (!error) fetchCategoryItems();
  };

  const handleDeleteItem = async (item: any) => {
    Alert.alert('彻底丢弃', `确定要把 "${item.name}" 从你的收纳盒中永远扔掉吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '扔掉', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('items').delete().eq('id', item.id);
          if (!error) fetchCategoryItems();
      }}
    ]);
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
      Alert.alert('需要权限', '抱歉，我们需要相册权限才能上传照片！');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], 
      // 👈 核心改动：恢复允许编辑，并强制 1:1 正方形裁剪
      allowsEditing: true,  
      aspect: [1, 1],
      // 不设置 quality，让系统自动处理，尽量保留原图质量
      base64: true,   
    });

    if (!result.canceled && result.assets[0].base64) {
      // 注意：开启 editing 后，iOS 可能会强制转为 JPEG，导致透明底变黑/白。
      // 这是为了统一正方形 UI 的妥协。如果用户选的是 iOS 抠好的透明图，
      // 裁剪后依然是一个背景透明的正方形图片，视觉上没问题。
      const mimeType = result.assets[0].mimeType || 'image/jpeg'; 
      const base64Image = `data:${mimeType};base64,${result.assets[0].base64}`;
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

    if (!error) { setModalVisible(false); setEditingItem(null); fetchCategoryItems(); }
    else { Alert.alert("保存失败", error.message); }
  };

  const renderRightActions = (item: any) => (
    <View style={styles.swipeActionsContainer}>
      <TouchableOpacity style={[styles.swipeActionBtn, { backgroundColor: '#FFB74D' }]} onPress={() => handleAddMoreToBuy(item)}>
        <Text style={styles.swipeActionText}>+1</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.swipeActionBtn, { backgroundColor: '#EF5350' }]} onPress={() => handleDeleteItem(item)}>
        <Text style={styles.swipeActionText}>删除</Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.swipeContainer}>
      <Swipeable renderRightActions={() => renderRightActions(item)} overshootRight={false}>
        <TouchableOpacity 
          style={styles.itemCard} 
          activeOpacity={0.7}
          onLongPress={() => openEditModal(item)}
        >
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            {item.price ? <Text style={styles.metaText}>💰 价值: {item.price}</Text> : null}
            {item.description ? <Text style={styles.descText} numberOfLines={2}>📝 {item.description}</Text> : null}
            <Text style={styles.quantityText}>
              背包已有: {item.quantity} {item.to_buy > 0 ? ` | 🛒 待买中: ${item.to_buy}` : ''}
            </Text>
          </View>

          {/* 👈 修改：将小图包裹在 TouchableOpacity 中，点击触发放大 */}
          {item.image_url ? (
            <TouchableOpacity 
              style={styles.itemImageContainer}
              onPress={() => setZoomedImageUrl(item.image_url)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: item.image_url }} style={styles.itemImage} />
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      </Swipeable>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{'返回'}</Text>
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
          <Text style={styles.inputLabel}>✨ 登记新物品 (长按编辑，左滑选项，点击图片放大)</Text>
          <View style={styles.inputRow}>
            <TextInput style={styles.nameInput} placeholder="物品名称 (如: 可乐)" value={newItemName} onChangeText={setNewItemName} placeholderTextColor="#A1887F" />
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddItem}>
            <Text style={styles.addBtnText}>加入收纳</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>

        {/* 编辑物品弹窗 */}
        <Modal visible={isModalVisible} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
              <Text style={styles.modalTitle}>✏️ 编辑物品信息</Text>
              
              <View style={styles.imageUploadSection}>
                <TouchableOpacity style={styles.imageUploadBtn} onPress={pickImage}>
                  {editImageUrl ? (
                    <Image source={{ uri: editImageUrl }} style={styles.previewImage} />
                  ) : (
                    <Text style={styles.imageUploadText}>📸 添加/更换照片(正方形)</Text>
                  )}
                </TouchableOpacity>
                {editImageUrl && (
                  <TouchableOpacity onPress={() => setEditImageUrl(null)} style={styles.removeImageBtn}>
                     <Text style={styles.removeImageText}>清除照片</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* ... 其他输入框 ... */}
              <Text style={styles.modalLabel}>物品名称</Text>
              <TextInput style={styles.modalInput} value={editName} onChangeText={setEditName} />
              <Text style={styles.modalLabel}>当前数量</Text>
              <TextInput style={styles.modalInput} value={editQuantity} onChangeText={setEditQuantity} keyboardType="numeric" />
              <Text style={styles.modalLabel}>价钱 (可选)</Text>
              <TextInput style={styles.modalInput} value={editPrice} onChangeText={setEditPrice} placeholderTextColor="#D7CCC8" />
              <Text style={styles.modalLabel}>备注 Description (可选)</Text>
              <TextInput style={[styles.modalInput, styles.textArea]} value={editDescription} onChangeText={setEditDescription} placeholderTextColor="#D7CCC8" multiline={true} numberOfLines={2} />
              
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

        {/* 👈 新增：图片放大预览弹窗 (灯箱) */}
        <Modal visible={zoomedImageUrl !== null} transparent={true} animationType="fade">
          <View style={styles.zoomModalOverlay}>
            <TouchableOpacity 
              style={styles.zoomModalContainer} 
              activeOpacity={1} 
              onPress={() => setZoomedImageUrl(null)} // 点击空白处或图片关闭弹窗
            >
              {zoomedImageUrl && (
                <Image 
                  source={{ uri: zoomedImageUrl }} 
                  style={styles.zoomedImage} 
                  resizeMode="contain" 
                />
              )}
            </TouchableOpacity>
          </View>
        </Modal>

      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6E3' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 2, borderBottomColor: '#EFEBE0' },
  backBtn: { marginRight: 15, padding: 10, backgroundColor: '#EFEBE0', borderRadius: 12 },
  backBtnText: { color: '#8D6E63', fontWeight: 'bold', fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#5D4037' },
  listContainer: { padding: 20 },
  emptyText: { textAlign: 'center', color: '#A1887F', marginTop: 40, fontSize: 16 },
  
  swipeContainer: { marginBottom: 15, borderRadius: 20, backgroundColor: '#FFFFFF', shadowColor: '#78C8A0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#EFEBE0', overflow: 'hidden' },
  itemCard: { backgroundColor: '#FFFFFF', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  
  itemInfo: { flex: 1, paddingRight: 10 },
  itemName: { fontSize: 18, fontWeight: 'bold', color: '#8D6E63', marginBottom: 4 },
  metaText: { fontSize: 13, color: '#F57C00', fontWeight: '600', marginBottom: 4 },
  descText: { fontSize: 13, color: '#A1887F', fontStyle: 'italic', marginBottom: 8, lineHeight: 18 },
  quantityText: { color: '#78C8A0', fontSize: 13, fontWeight: 'bold', marginTop: 4 },
  
  // 恢复了容器的尺寸限制，确保列表整齐
  itemImageContainer: { 
    width: 70, 
    height: 70, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: 10,
    backgroundColor: 'transparent', 
    borderRadius: 12, // 加一点圆角让点击反馈更好看
    overflow: 'hidden',
  },
  // 使用 cover 模式填满正方形容器
  itemImage: { width: '100%', height: '100%', resizeMode: 'cover' },

  swipeActionsContainer: { flexDirection: 'row' },
  swipeActionBtn: { justifyContent: 'center', alignItems: 'center', width: 75 },
  swipeActionText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },

  inputSection: { padding: 25, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EFEBE0', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#78C8A0', marginBottom: 15 },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  nameInput: { flex: 1, backgroundColor: '#FDF6E3', borderRadius: 16, padding: 18, color: '#5D4037', fontWeight: '600', fontSize: 16 },
  addBtn: { backgroundColor: '#78C8A0', padding: 18, borderRadius: 16, alignItems: 'center' },
  addBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  
  // 编辑弹窗样式
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FDF6E3', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#5D4037', marginBottom: 15, textAlign: 'center' },
  
  imageUploadSection: { alignItems: 'center', marginBottom: 15 },
  // 预览图容器也改成正方形
  imageUploadBtn: { width: 120, height: 120, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: '#D7CCC8', borderStyle: 'dashed' },
  imageUploadText: { color: '#8D6E63', fontWeight: 'bold', textAlign: 'center', fontSize: 13, padding: 5 },
  // 预览图使用 cover 填满
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

  // 👈 新增：图片放大弹窗样式
  zoomModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  zoomModalContainer: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  zoomedImage: { width: screenWidth, height: screenWidth, maxHeight: '80%' }, // 宽度占满屏幕，高度自适应
});