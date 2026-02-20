import { useRouter } from 'expo-router'; // 👈 新增：引入路由功能
import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabase';

export default function App() {
  const [categories, setCategories] = useState<any[]>([]);
  const [shoppingList, setShoppingList] = useState<any[]>([]);
  
  const router = useRouter(); // 👈 新增：初始化 router，用于页面跳转

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // 1. 获取所有分类
    let { data: categoryData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true }); // 按创建时间排序，保持顺序稳定
    
    if (categoryData) setCategories(categoryData);

    // 2. 获取待买清单 (当前数量小于目标数量的物品)
    let { data: itemsData, error: itemError } = await supabase
      .from('items')
      .select('*, categories(name)')
      .lt('quantity', 'target_quantity');
      
    if (itemsData) setShoppingList(itemsData);
  };

  // 👈 修改：给卡片加上了 onPress 点击事件
  const renderCategory = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => {
        // 跳转到对应的分类详情页，并把 id 和 name 传过去
        router.push({
          pathname: '/category/[id]' as any,
          params: { id: item.id, name: item.name }
        });
      }}
    >
      <Text style={styles.cardIcon}>{item.icon || '📦'}</Text>
      <Text style={styles.cardTitle}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>My Backpack 🏕️</Text>
      
      {/* 待买清单区块 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 待买清单 (Shopping List)</Text>
        {shoppingList.map((item: any) => (
          <View key={item.id} style={styles.shoppingItem}>
            <Text style={styles.itemText}>{item.name}</Text>
            <Text style={styles.itemTag}>缺 {item.target_quantity - item.quantity} 个</Text>
          </View>
        ))}
      </View>

      {/* 分类区块 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🗂️ 我的收纳 (Categories)</Text>
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item: any) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
        />
      </View>
    </SafeAreaView>
  );
}

// 动森风专属样式 (保持不变)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF6E3',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8D6E63',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5D4037',
    marginBottom: 15,
    marginLeft: 5,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '47%',
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#78C8A0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#EFEBE0',
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8D6E63',
  },
  shoppingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
  },
  itemText: {
    fontSize: 16,
    color: '#388E3C',
    fontWeight: '500',
  },
  itemTag: {
    fontSize: 14,
    color: '#8D6E63',
    backgroundColor: '#FDF6E3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  }
});