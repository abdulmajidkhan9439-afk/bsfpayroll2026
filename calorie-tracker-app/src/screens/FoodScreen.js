import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, ScrollView,
  Modal, StyleSheet, Dimensions, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { FOOD_DB } from '../data/foodDatabase';

const { height: SH } = Dimensions.get('window');

const MEAL_OPTS = [
  { key: 'breakfast', label: 'Breakfast', urdu: 'ناشتہ' },
  { key: 'lunch',     label: 'Lunch',     urdu: 'دوپہر' },
  { key: 'dinner',    label: 'Dinner',    urdu: 'رات' },
  { key: 'snack',     label: 'Snack',     urdu: 'ہلکا' },
];

function calColor(cal) {
  if (cal < 100) return '#4CAF50';
  if (cal < 300) return '#8BC34A';
  if (cal < 500) return '#FF9800';
  if (cal < 700) return '#FF5722';
  return '#F44336';
}

function MacroTag({ label, value, color }) {
  return (
    <View style={[styles.macroTag, { borderColor: color }]}>
      <Text style={[styles.macroTagText, { color }]}>{label}: {value}g</Text>
    </View>
  );
}

export default function FoodScreen() {
  const nav = useNavigation();
  const route = useRoute();
  const { addFood, today } = useApp();

  const initialMeal = route.params?.mealType || 'lunch';
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedFood, setSelectedFood] = useState(null);
  const [servings, setServings] = useState(1);
  const [activeMeal, setActiveMeal] = useState(initialMeal);
  const [modalVisible, setModalVisible] = useState(false);

  const allFoods = useMemo(() => {
    if (!FOOD_DB) return [];
    if (Array.isArray(FOOD_DB)) return FOOD_DB;
    // If FOOD_DB is an object keyed by category
    return Object.values(FOOD_DB).flat();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set();
    allFoods.forEach(f => { if (f.category) cats.add(f.category); });
    return ['All', ...Array.from(cats)];
  }, [allFoods]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allFoods.filter(f => {
      const matchCat = category === 'All' || f.category === category;
      const matchSearch = !q || f.name?.toLowerCase().includes(q) || f.urdu?.includes(q);
      return matchCat && matchSearch;
    });
  }, [allFoods, category, search]);

  const openFood = useCallback((food) => {
    setSelectedFood(food);
    setServings(1);
    setActiveMeal(route.params?.mealType || 'lunch');
    setModalVisible(true);
  }, [route.params?.mealType]);

  const handleAdd = useCallback(() => {
    if (!selectedFood) return;
    const entry = {
      ...selectedFood,
      calories: Math.round(selectedFood.calories * servings),
      protein:  Math.round((selectedFood.protein || 0) * servings),
      carbs:    Math.round((selectedFood.carbs || 0) * servings),
      fat:      Math.round((selectedFood.fat || 0) * servings),
      serving:  `${servings}x ${selectedFood.serving || '1 serving'}`,
    };
    const todayKey = today ? today() : new Date().toISOString().split('T')[0];
    addFood && addFood(todayKey, activeMeal, entry);
    setModalVisible(false);
    nav.navigate('Home');
  }, [selectedFood, servings, activeMeal, addFood, today, nav]);

  const renderFood = useCallback(({ item }) => (
    <TouchableOpacity style={styles.foodCard} onPress={() => openFood(item)} activeOpacity={0.8}>
      <View style={styles.foodCardTop}>
        <Text style={styles.foodEmoji}>{item.emoji || '🍽️'}</Text>
        <View style={styles.foodMeta}>
          <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
          {item.urdu && <Text style={styles.foodUrdu} numberOfLines={1}>{item.urdu}</Text>}
          <Text style={styles.foodServing}>{item.serving || '1 serving'}</Text>
        </View>
        <View style={[styles.calBadge, { backgroundColor: calColor(item.calories) }]}>
          <Text style={styles.calBadgeText}>{item.calories}</Text>
          <Text style={styles.calBadgeUnit}>kcal</Text>
        </View>
      </View>
      <View style={styles.macroRow}>
        <MacroTag label="P" value={item.protein || 0} color="#4CAF50" />
        <MacroTag label="C" value={item.carbs || 0}   color="#2196F3" />
        <MacroTag label="F" value={item.fat || 0}     color="#FF9800" />
        <TouchableOpacity style={styles.plusBtn} onPress={() => openFood(item)}>
          <Text style={styles.plusBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  ), [openFood]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>کھانا تلاش کریں</Text>
        <Text style={styles.headerSub}>
          {MEAL_OPTS.find(m => m.key === (route.params?.mealType || 'lunch'))?.label || 'Lunch'}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search food..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={styles.chipsContent}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, category === cat && styles.chipActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Count */}
      <Text style={styles.resultCount}>{filtered.length} items found</Text>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderFood}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      />

      {/* Detail Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
            {selectedFood && (
              <ScrollView>
                <View style={styles.sheetHandle} />
                {/* Food header */}
                <Text style={styles.sheetEmoji}>{selectedFood.emoji || '🍽️'}</Text>
                <Text style={styles.sheetName}>{selectedFood.name}</Text>
                {selectedFood.urdu && <Text style={styles.sheetUrdu}>{selectedFood.urdu}</Text>}

                {/* Nutrition grid */}
                <View style={styles.nutritionGrid}>
                  {[
                    { label: 'Calories', value: Math.round(selectedFood.calories * servings), unit: 'kcal', color: '#FF5722' },
                    { label: 'Protein',  value: Math.round((selectedFood.protein || 0) * servings), unit: 'g', color: '#4CAF50' },
                    { label: 'Carbs',    value: Math.round((selectedFood.carbs || 0) * servings),   unit: 'g', color: '#2196F3' },
                    { label: 'Fat',      value: Math.round((selectedFood.fat || 0) * servings),     unit: 'g', color: '#FF9800' },
                  ].map(n => (
                    <View key={n.label} style={styles.nutritionCell}>
                      <Text style={[styles.nutritionValue, { color: n.color }]}>{n.value}</Text>
                      <Text style={styles.nutritionUnit}>{n.unit}</Text>
                      <Text style={styles.nutritionLabel}>{n.label}</Text>
                    </View>
                  ))}
                </View>

                {/* Serving selector */}
                <Text style={styles.sectionLabel}>Serving Size</Text>
                <View style={styles.servingRow}>
                  <TouchableOpacity
                    style={styles.servingBtn}
                    onPress={() => setServings(s => Math.max(0.5, Math.round((s - 0.5) * 10) / 10))}
                  >
                    <Text style={styles.servingBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.servingVal}>{servings}x</Text>
                  <TouchableOpacity
                    style={styles.servingBtn}
                    onPress={() => setServings(s => Math.round((s + 0.5) * 10) / 10)}
                  >
                    <Text style={styles.servingBtnText}>+</Text>
                  </TouchableOpacity>
                  <Text style={styles.servingDesc}>{selectedFood.serving || '1 serving'}</Text>
                </View>

                {/* Meal selector */}
                <Text style={styles.sectionLabel}>Select Meal</Text>
                <View style={styles.mealRow}>
                  {MEAL_OPTS.map(m => (
                    <TouchableOpacity
                      key={m.key}
                      style={[styles.mealChip, activeMeal === m.key && styles.mealChipActive]}
                      onPress={() => setActiveMeal(m.key)}
                    >
                      <Text style={[styles.mealChipText, activeMeal === m.key && styles.mealChipTextActive]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Add button */}
                <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
                  <Text style={styles.addButtonText}>Add to {MEAL_OPTS.find(m => m.key === activeMeal)?.label}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { backgroundColor: '#1a1a2e', paddingTop: 48, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  headerSub: { color: '#aaa', fontSize: 13, textAlign: 'center', marginTop: 4 },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: 12, backgroundColor: '#fff', borderRadius: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, paddingHorizontal: 12 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: '#1a1a2e' },
  clearBtn: { padding: 8 },
  clearBtnText: { color: '#aaa', fontSize: 16 },
  chips: { maxHeight: 48 },
  chipsContent: { paddingHorizontal: 12, gap: 8, paddingVertical: 6 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  chipActive: { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
  chipText: { color: '#555', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  resultCount: { marginHorizontal: 16, marginBottom: 6, color: '#888', fontSize: 12 },
  listContent: { paddingHorizontal: 12, paddingBottom: 32 },
  foodCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  foodCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  foodEmoji: { fontSize: 26, width: 40 },
  foodMeta: { flex: 1 },
  foodName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  foodUrdu: { fontSize: 12, color: '#888', marginTop: 1 },
  foodServing: { fontSize: 11, color: '#aaa', marginTop: 1 },
  calBadge: { borderRadius: 8, padding: 6, alignItems: 'center', minWidth: 52 },
  calBadgeText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  calBadgeUnit: { color: '#fff', fontSize: 9 },
  macroRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  macroTag: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  macroTagText: { fontSize: 11, fontWeight: '600' },
  plusBtn: { marginLeft: 'auto', backgroundColor: '#4CAF50', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  plusBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 24 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: SH * 0.85, padding: 20 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetEmoji: { fontSize: 48, textAlign: 'center' },
  sheetName: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', textAlign: 'center', marginTop: 8 },
  sheetUrdu: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 4 },
  nutritionGrid: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#f0f2f5', borderRadius: 12, padding: 16, marginVertical: 16 },
  nutritionCell: { alignItems: 'center' },
  nutritionValue: { fontSize: 22, fontWeight: '800' },
  nutritionUnit: { fontSize: 11, color: '#888' },
  nutritionLabel: { fontSize: 11, color: '#555', marginTop: 2 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginBottom: 10 },
  servingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  servingBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' },
  servingBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 26 },
  servingVal: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', minWidth: 36, textAlign: 'center' },
  servingDesc: { fontSize: 13, color: '#888' },
  mealRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 20 },
  mealChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f2f5', borderWidth: 1.5, borderColor: '#ddd' },
  mealChipActive: { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
  mealChipText: { fontSize: 13, color: '#555' },
  mealChipTextActive: { color: '#fff', fontWeight: '700' },
  addButton: { backgroundColor: '#4CAF50', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', padding: 10, marginBottom: 12 },
  cancelBtnText: { color: '#888', fontSize: 15 },
});
