import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabase';

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<any[]>([]);
  const router = useRouter();

  const [isModalVisible, setModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');

  // 👈 新增：管理页面是否处于“整理模式”
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

    const { error } = await supabase
      .from('categories')
      .insert([
        {
          name: newCategoryName,
          icon: newCategoryIcon.trim() || '📦', 
          is_default: false
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

  // 抽出删除数据库的独立函数
  const deleteCategoryFromDB = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) fetchData();
    else {
      if (Platform.OS === 'web') window.alert('删除失败: ' + error.message);
      else Alert.alert('删除失败', error.message);
    }
  };

  // 👈 智能分发：Web 端用浏览器自带弹窗，手机端用原生 Alert
  const handleDeleteCategory = (item: any) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`🗑️ 丢弃收纳盒\n\n确定要扔掉 "${item.name}" 吗？里面的物品也会被一起清理掉哦！`);
      if (confirmed) {
        deleteCategoryFromDB(item.id);
      }
    } else {
      Alert.alert(
        '🗑️ 丢弃收纳盒',
        `确定要扔掉 "${item.name}" 吗？里面的物品也会被一起清理掉哦！`,
        [
          { text: '保留', style: 'cancel' },
          { 
            text: '扔掉', 
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
            params: { id: item.id, name: item.name }
          });
        }
      }}
      onLongPress={() => {
        if (!isEditing) handleDeleteCategory(item);
      }}
      activeOpacity={0.7}
    >
      {/* 👈 小红点代码放在这里，它会乖乖待在卡片内部 */}
      {isEditing && (
        <View style={styles.deleteBadge}>
          <Text style={styles.deleteBadgeText}>-</Text>
        </View>
      )}
      
      <Text style={styles.cardIcon}>{item.icon || '📦'}</Text>
      <Text style={styles.cardTitle}>{item.name}</Text>
    </TouchableOpacity>
  );


  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>My Backpack 🏕️</Text>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🗂️ 我的收纳</Text>
          
          {/* 👈 右侧操作区：加入了“整理”按钮 */}
          <View style={styles.headerActions}>
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

      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <Text style={styles.modalTitle}>✨ 打造新收纳盒</Text>
            
            <Text style={styles.modalLabel}>盒子名称</Text>
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
              placeholder="📦"
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
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// 样式部分
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6E3' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#8D6E63', marginTop: 20, marginBottom: 15, textAlign: 'center' },
  section: { flex: 1, paddingHorizontal: 20 },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#5D4037' },
  
  // 👈 新增按钮组排版
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  
  // 👈 新增“整理”按钮的样式
  editBtn: { backgroundColor: '#EFEBE0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  editBtnActive: { backgroundColor: '#EF5350' }, // 激活时变成亮眼提示色
  editBtnText: { color: '#8D6E63', fontWeight: 'bold', fontSize: 14 },
  editBtnTextActive: { color: '#FFFFFF' },

  addIconBtn: { backgroundColor: '#78C8A0', width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  addIconText: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', lineHeight: 26, textAlign: 'center' },

row: { justifyContent: 'space-between', marginBottom: 15 },
  
  // 👈 还原为一个干净的卡片样式
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
    position: 'relative' // 确保内部的绝对定位生效
  },
  
  cardIcon: { fontSize: 36, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#8D6E63' },
  
  // 👈 核心修复：把 top 和 right 从 -8 改成 10 (正数)，把它拉回卡片内部！
  deleteBadge: { 
    position: 'absolute', 
    top: 10,     // 距离顶部 10 像素
    right: 10,   // 距离右边 10 像素
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