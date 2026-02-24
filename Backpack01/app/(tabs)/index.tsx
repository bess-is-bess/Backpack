import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { supabase } from '../../supabase';

const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('确定要退出当前账号吗？');
      if (confirmed) await supabase.auth.signOut();
    } else {
      Alert.alert('退出登录', '确定要退出当前账号吗？', [
        { text: '取消', style: 'cancel' },
        { text: '退出', style: 'destructive', onPress: async () => await supabase.auth.signOut() }
      ]);
    }
};

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<any[]>([]);
  const router = useRouter();

  // 添加博物馆的状态
  const [isModalVisible, setModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');

  // 🚀 新增：编辑博物馆的状态
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryIcon, setEditCategoryIcon] = useState('');

  // 管理页面是否处于“整理模式”
  const [isEditing, setIsEditing] = useState(false);

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
      if (Platform.OS === 'web') window.alert('❌ 无法读取分类: ' + catError.message);
      else Alert.alert('❌ 数据库拦截', '无法读取分类: ' + catError.message);
    } else if (categoryData) {
      setCategories(categoryData);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (Platform.OS === 'web') window.alert('登录状态已失效，请重新登录');
      else Alert.alert('错误', '登录状态已失效，请重新登录');
      return;
    }

    const { error } = await supabase
      .from('categories')
      .insert([
        {
          name: newCategoryName,
          icon: newCategoryIcon.trim() || '🏛️', 
          is_default: false,
          user_id: user.id 
        }
      ]);

    if (!error) {
      setNewCategoryName('');
      setNewCategoryIcon('');
      setModalVisible(false); 
      fetchData(); 
    } else {
      if (Platform.OS === 'web') window.alert('添加失败: ' + error.message);
      else Alert.alert('添加失败', error.message);
    }
  };

  // 🚀 新增：打开编辑弹窗
  const openEditCategoryModal = (item: any) => {
    setEditingCategory(item);
    setEditCategoryName(item.name);
    setEditCategoryIcon(item.icon || '🏛️');
    setEditModalVisible(true);
  };

  // 🚀 新增：保存博物馆修改
  const handleSaveEditCategory = async () => {
    if (!editCategoryName.trim() || !editingCategory) return;
    
    const { error } = await supabase
      .from('categories')
      .update({
        name: editCategoryName,
        icon: editCategoryIcon.trim() || '🏛️'
      })
      .eq('id', editingCategory.id);

    if (!error) {
      setEditModalVisible(false);
      setEditingCategory(null);
      fetchData();
    } else {
      if (Platform.OS === 'web') window.alert('保存失败: ' + error.message);
      else Alert.alert('保存失败', error.message);
    }
  };

  const deleteCategoryFromDB = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) fetchData();
    else {
      if (Platform.OS === 'web') window.alert('删除失败: ' + error.message);
      else Alert.alert('删除失败', error.message);
    }
  };

  const handleDeleteCategory = (item: any) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`🗑️ 丢弃博物馆\n\n确定要拆掉 "${item.name}" 吗？里面的藏品也会被一起清理掉哦！`);
      if (confirmed) {
        deleteCategoryFromDB(item.id);
      }
    } else {
      Alert.alert(
        '🗑️ 拆掉博物馆',
        `确定要拆掉 "${item.name}" 吗？里面的藏品也会被一起清理掉哦！`,
        [
          { text: '保留', style: 'cancel' },
          { 
            text: '拆掉', 
            style: 'destructive', 
            onPress: () => deleteCategoryFromDB(item.id) 
          }
        ]
      );
    }
  };

 const renderCategory = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => {
        if (isEditing) {
          handleDeleteCategory(item); 
        } else {
          router.push({
            pathname: '/category/[id]' as any,
            params: { id: item.id, name: item.name, icon: item.icon }
          });
        }
      }}
      onLongPress={() => {
        // 🚀 修改：平常模式下长按变成“修改名称”，不再是删除
        if (!isEditing) {
          openEditCategoryModal(item);
        }
      }}
      activeOpacity={0.7}
    >
      {isEditing && (
        <View style={styles.deleteBadge}>
          <Text style={styles.deleteBadgeText}>-</Text>
        </View>
      )}
      
      <Text style={styles.cardIcon}>{item.icon || '🏛️'}</Text>
      <Text style={styles.cardTitle}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>My Backpack 🏕️</Text>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          {/* 🚀 提示文案更新 */}
          <Text style={styles.sectionTitle}>我的陈列(长按修改)</Text>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>登出</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.editBtn, isEditing && styles.editBtnActive]} 
              onPress={() => setIsEditing(!isEditing)}
            >
              <Text style={[styles.editBtnText, isEditing && styles.editBtnTextActive]}>
                {isEditing ? '完成' : '整理'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.addIconBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.addIconText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item: any) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>

      {/* 打造新博物馆弹窗 */}
      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={Platform.OS === 'web' ? undefined : Keyboard.dismiss}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <TouchableWithoutFeedback onPress={Platform.OS === 'web' ? undefined : Keyboard.dismiss}>
              <View style={{ width: '100%' }}>
                <Text style={styles.modalTitle}>✨ 打造新博物馆</Text>
                
                <Text style={styles.modalLabel}>博物馆名称</Text>
                <TextInput 
                  style={styles.modalInput} 
                  placeholder="例如: 办公用品"
                  placeholderTextColor="#D7CCC8"
                  value={newCategoryName} 
                  onChangeText={setNewCategoryName} 
                />
                
                <Text style={styles.modalLabel}>专属 Emoji (可选)</Text>
                <TextInput 
                  style={[styles.modalInput, { textAlign: 'center', fontSize: 24 }]} 
                  placeholder="🏛️"
                  placeholderTextColor="#D7CCC8"
                  value={newCategoryIcon} 
                  onChangeText={setNewCategoryIcon} 
                  maxLength={2} 
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                    <Text style={styles.modalCancelText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddCategory}>
                    <Text style={styles.modalSaveText}>创建</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* 🚀 新增：修改博物馆信息的弹窗 */}
      <Modal visible={isEditModalVisible} transparent={true} animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={Platform.OS === 'web' ? undefined : Keyboard.dismiss}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <TouchableWithoutFeedback onPress={Platform.OS === 'web' ? undefined : Keyboard.dismiss}>
              <View style={{ width: '100%' }}>
                <Text style={styles.modalTitle}>✏️ 修改博物馆信息</Text>
                
                <Text style={styles.modalLabel}>博物馆名称</Text>
                <TextInput 
                  style={styles.modalInput} 
                  value={editCategoryName} 
                  onChangeText={setEditCategoryName} 
                />
                
                <Text style={styles.modalLabel}>更换 Emoji (可选)</Text>
                <TextInput 
                  style={[styles.modalInput, { textAlign: 'center', fontSize: 24 }]} 
                  value={editCategoryIcon} 
                  onChangeText={setEditCategoryIcon} 
                  maxLength={2} 
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditModalVisible(false)}>
                    <Text style={styles.modalCancelText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveEditCategory}>
                    <Text style={styles.modalSaveText}>保存</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

// 样式部分（保持你的优秀设计不变）
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6E3' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#8D6E63', marginTop: 20, marginBottom: 15, textAlign: 'center' },
  section: { flex: 1, paddingHorizontal: 20 },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#5D4037' },
  
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  logoutBtn: { backgroundColor: '#FDF6E3', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#D7CCC8' },
  logoutBtnText: { color: '#8D6E63', fontWeight: 'bold', fontSize: 13 },
  
  editBtn: { backgroundColor: '#EFEBE0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  editBtnActive: { backgroundColor: '#EF5350' }, 
  editBtnText: { color: '#8D6E63', fontWeight: 'bold', fontSize: 14 },
  editBtnTextActive: { color: '#FFFFFF' },

  addIconBtn: { backgroundColor: '#78C8A0', width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  addIconText: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', lineHeight: 26, textAlign: 'center' },

  row: { justifyContent: 'space-between', marginBottom: 15 },
  
  card: { 
    backgroundColor: '#FFFFFF', 
    width: '47%', 
    padding: 25, 
    borderRadius: 24, 
    alignItems: 'center', 
    shadowColor: '#78C8A0', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 3, 
    borderWidth: 2, 
    borderColor: '#EFEBE0',
    position: 'relative' 
  },
  
  cardIcon: { fontSize: 36, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#8D6E63' },
  
  deleteBadge: { 
    position: 'absolute', 
    top: 10,     
    right: 10,   
    backgroundColor: '#EF5350', 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 10, 
  },
  deleteBadgeText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', lineHeight: 20, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FDF6E3', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#5D4037', marginBottom: 20, textAlign: 'center' },
  modalLabel: { fontSize: 15, fontWeight: 'bold', color: '#8D6E63', marginBottom: 8, marginTop: 10 },
  modalInput: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, color: '#5D4037', fontWeight: '600', borderWidth: 1, borderColor: '#EFEBE0', fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, marginBottom: Platform.OS === 'ios' ? 20 : 0 },
  modalCancelBtn: { flex: 1, backgroundColor: '#EFEBE0', padding: 16, borderRadius: 16, marginRight: 10, alignItems: 'center' },
  modalCancelText: { color: '#8D6E63', fontWeight: 'bold', fontSize: 16 },
  modalSaveBtn: { flex: 1, backgroundColor: '#78C8A0', padding: 16, borderRadius: 16, marginLeft: 10, alignItems: 'center' },
  modalSaveText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }
});