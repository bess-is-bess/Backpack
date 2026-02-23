import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabase';

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<any[]>([]);
  const router = useRouter();

  // 控制新建分类弹窗的状态
  const [isModalVisible, setModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');

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
      Alert.alert('❌ 数据库拦截', '无法读取分类: ' + catError.message);
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
          icon: newCategoryIcon.trim() || '📦', // 如果没填，给个默认纸箱
          is_default: false
        }
      ]);

    if (!error) {
      setNewCategoryName('');
      setNewCategoryIcon('');
      setModalVisible(false); // 成功后关闭弹窗
      fetchData(); 
    } else {
      Alert.alert('添加失败', error.message);
    }
  };

  const handleDeleteCategory = (item: any) => {
    Alert.alert(
      '🗑️ 丢弃收纳盒',
      `确定要扔掉 "${item.name}" 吗？里面的物品也会被一起清理掉哦！`,
      [
        { text: '保留', style: 'cancel' },
        { 
          text: '扔掉', 
          style: 'destructive', 
          onPress: async () => {
            const { error } = await supabase.from('categories').delete().eq('id', item.id);
            if (!error) fetchData();
            else Alert.alert('删除失败', error.message);
          } 
        }
      ]
    );
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
      onLongPress={() => handleDeleteCategory(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.cardIcon}>{item.icon || '📦'}</Text>
      <Text style={styles.cardTitle}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>My Backpack 🏕️</Text>
      
      <View style={styles.section}>
        {/* 👈 重点修改：带有 + 号的标题栏 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🗂️ 我的收纳 (长按可删除)</Text>
          <TouchableOpacity style={styles.addIconBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addIconText}>+</Text>
          </TouchableOpacity>
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

      {/* 👈 重点修改：全新设计的滑动弹窗 Modal */}
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
  
  // 👈 新增：标题栏排版样式
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#5D4037' },
  addIconBtn: { backgroundColor: '#78C8A0', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  addIconText: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', lineHeight: 26, textAlign: 'center' },

  row: { justifyContent: 'space-between', marginBottom: 15 },
  card: { backgroundColor: '#FFFFFF', width: '47%', padding: 25, borderRadius: 24, alignItems: 'center', shadowColor: '#78C8A0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, borderWidth: 2, borderColor: '#EFEBE0' },
  cardIcon: { fontSize: 36, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#8D6E63' },
  
  // 👈 新增：弹窗专属样式
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