import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');
const RING_SIZE = 180;
const RING_STROKE = 18;

const URDU_DAYS = ['اتوار','پیر','منگل','بدھ','جمعرات','جمعہ','ہفتہ'];
const URDU_MONTHS = ['جنوری','فروری','مارچ','اپریل','مئی','جون','جولائی','اگست','ستمبر','اکتوبر','نومبر','دسمبر'];
const MEAL_LABELS = [
  { key: 'breakfast', label: 'Breakfast', urdu: 'ناشتہ' },
  { key: 'lunch',     label: 'Lunch',     urdu: 'دوپہر کا کھانا' },
  { key: 'dinner',    label: 'Dinner',    urdu: 'رات کا کھانا' },
  { key: 'snack',     label: 'Snack',     urdu: 'ہلکا ناشتہ' },
];

function CalorieRing({ consumed, goal }) {
  const pct = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const color = consumed > goal ? '#F44336' : pct >= 0.8 ? '#FF9800' : '#4CAF50';
  const r = (RING_SIZE - RING_STROKE) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <View style={styles.ringWrapper}>
      <View style={[styles.ringTrack, { width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2, borderWidth: RING_STROKE, borderColor: '#e0e0e0' }]} />
      <View style={[styles.ringProgress, { width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2, borderWidth: RING_STROKE, borderColor: color, borderTopColor: 'transparent', transform: [{ rotate: `${pct * 360 - 90}deg` }] }]} />
      <View style={styles.ringCenter}>
        <Text style={[styles.ringCal, { color }]}>{Math.round(consumed)}</Text>
        <Text style={styles.ringLabel}>calories</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const nav = useNavigation();
  const { logs, steps, water, getGoal, getTodayCal, getTodayMac, today, addFood, removeFood, updateWater } = useApp();
  const [, setRefresh] = useState(0);

  useFocusEffect(useCallback(() => { setRefresh(r => r + 1); }, []));

  const dateObj = new Date();
  const urduDate = `${dateObj.getDate()} ${URDU_MONTHS[dateObj.getMonth()]} ${dateObj.getFullYear()} - ${URDU_DAYS[dateObj.getDay()]}`;

  const goal = getGoal ? getGoal() : 2000;
  const consumed = getTodayCal ? getTodayCal() : 0;
  const macros = getTodayMac ? getTodayMac() : { protein: 0, carbs: 0, fat: 0 };
  const burned = Math.round((steps || 0) * 0.04);
  const remaining = Math.max(goal - consumed + burned, 0);
  const todayKey = today ? today() : new Date().toISOString().split('T')[0];
  const todayLog = (logs || {})[todayKey] || {};
  const waterGlasses = water || 0;

  const pct = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const ringColor = consumed > goal ? '#F44336' : pct >= 0.8 ? '#FF9800' : '#4CAF50';

  const macroGoals = { protein: 150, carbs: 250, fat: 65 };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSub}>آج کا دن</Text>
        <Text style={styles.headerDate}>{urduDate}</Text>
      </View>

      {/* Ring */}
      <View style={styles.card}>
        <CalorieRing consumed={consumed} goal={goal} />
        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: ringColor }]} />
        </View>
        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Goal', value: goal },
            { label: 'Remaining', value: remaining },
            { label: 'Burned', value: burned },
          ].map(s => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Macros */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Macros</Text>
        {[
          { key: 'protein', label: 'Protein', color: '#4CAF50', unit: 'g' },
          { key: 'carbs',   label: 'Carbs',   color: '#2196F3', unit: 'g' },
          { key: 'fat',     label: 'Fat',     color: '#FF9800', unit: 'g' },
        ].map(m => {
          const val = macros[m.key] || 0;
          const gPct = Math.min(val / macroGoals[m.key], 1);
          return (
            <View key={m.key} style={styles.macroRow}>
              <Text style={styles.macroLabel}>{m.label}</Text>
              <View style={styles.macroBarTrack}>
                <View style={[styles.macroBarFill, { width: `${gPct * 100}%`, backgroundColor: m.color }]} />
              </View>
              <Text style={styles.macroVal}>{Math.round(val)}{m.unit}</Text>
            </View>
          );
        })}
      </View>

      {/* Water */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Water  پانی</Text>
        <View style={styles.waterRow}>
          <TouchableOpacity style={styles.waterBtn} onPress={() => updateWater && updateWater(Math.max(0, waterGlasses - 1))}>
            <Text style={styles.waterBtnText}>−</Text>
          </TouchableOpacity>
          <View style={styles.waterGlasses}>
            {Array.from({ length: 8 }).map((_, i) => (
              <View key={i} style={[styles.glass, { backgroundColor: i < waterGlasses ? '#2196F3' : '#e0e0e0' }]} />
            ))}
          </View>
          <TouchableOpacity style={styles.waterBtn} onPress={() => updateWater && updateWater(Math.min(8, waterGlasses + 1))}>
            <Text style={styles.waterBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.waterCount}>{waterGlasses} / 8 glasses</Text>
      </View>

      {/* Meals */}
      {MEAL_LABELS.map(meal => {
        const entries = todayLog[meal.key] || [];
        const mealCal = entries.reduce((s, f) => s + (f.calories || 0), 0);
        return (
          <View key={meal.key} style={styles.card}>
            <View style={styles.mealHeader}>
              <View>
                <Text style={styles.mealTitle}>{meal.label}</Text>
                <Text style={styles.mealUrdu}>{meal.urdu}</Text>
              </View>
              <View style={styles.mealRight}>
                <Text style={styles.mealCal}>{Math.round(mealCal)} kcal</Text>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => nav.navigate('Food', { mealType: meal.key })}
                >
                  <Text style={styles.addBtnText}>+ Add</Text>
                </TouchableOpacity>
              </View>
            </View>
            {entries.map((food, idx) => (
              <View key={idx} style={styles.foodEntry}>
                <Text style={styles.foodEmoji}>{food.emoji || '🍽️'}</Text>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <Text style={styles.foodDetail}>{Math.round(food.calories)} kcal · {food.serving || '1 serving'}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert('Remove', `Remove ${food.name}?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => removeFood && removeFood(todayKey, meal.key, idx) },
                    ]);
                  }}
                >
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {entries.length === 0 && (
              <Text style={styles.emptyMeal}>No food added yet</Text>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f0f2f5' },
  content: { paddingBottom: 32 },
  header: { backgroundColor: '#1a1a2e', padding: 20, paddingTop: 48 },
  headerSub: { color: '#aaa', fontSize: 13, textAlign: 'center' },
  headerDate: { color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  card: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 12, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  ringWrapper: { alignSelf: 'center', width: RING_SIZE, height: RING_SIZE, justifyContent: 'center', alignItems: 'center', marginVertical: 8 },
  ringTrack: { position: 'absolute' },
  ringProgress: { position: 'absolute' },
  ringCenter: { alignItems: 'center' },
  ringCal: { fontSize: 36, fontWeight: '800' },
  ringLabel: { fontSize: 12, color: '#888' },
  progressTrack: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, marginVertical: 12, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  macroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  macroLabel: { width: 60, fontSize: 13, color: '#555' },
  macroBarTrack: { flex: 1, height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden', marginHorizontal: 8 },
  macroBarFill: { height: '100%', borderRadius: 4 },
  macroVal: { width: 44, fontSize: 12, color: '#555', textAlign: 'right' },
  waterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 },
  waterBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2196F3', justifyContent: 'center', alignItems: 'center' },
  waterBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 24 },
  waterGlasses: { flexDirection: 'row', gap: 6 },
  glass: { width: 20, height: 28, borderRadius: 4 },
  waterCount: { textAlign: 'center', color: '#888', fontSize: 13 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  mealTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  mealUrdu: { fontSize: 12, color: '#888', marginTop: 2 },
  mealRight: { alignItems: 'flex-end' },
  mealCal: { fontSize: 13, color: '#4CAF50', fontWeight: '600', marginBottom: 4 },
  addBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  foodEntry: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f0f2f5' },
  foodEmoji: { fontSize: 22, width: 36 },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  foodDetail: { fontSize: 12, color: '#888', marginTop: 2 },
  deleteBtn: { color: '#F44336', fontSize: 16, paddingHorizontal: 8 },
  emptyMeal: { color: '#bbb', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
});
