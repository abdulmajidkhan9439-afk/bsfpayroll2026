import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal,
  StyleSheet, Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';

const { height: SH } = Dimensions.get('window');
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function dayColor(consumed, goal) {
  if (!consumed || consumed === 0) return '#e0e0e0';
  const r = consumed / goal;
  if (r <= 0.9)  return '#2196F3';   // under
  if (r <= 1.05) return '#4CAF50';   // on-track
  if (r <= 1.2)  return '#FF9800';   // slightly over
  return '#F44336';                   // way over
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  // Monday=0 index
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function buildGrid(year, month) {
  const days = getDaysInMonth(year, month);
  const startOffset = getFirstDayOfMonth(year, month);
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function padTwo(n) { return String(n).padStart(2, '0'); }

export default function CalendarScreen() {
  const nav = useNavigation();
  const { logs, getGoal, today } = useApp();
  const todayKey = today ? today() : new Date().toISOString().split('T')[0];

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const goal = getGoal ? getGoal() : 2000;
  const logsData = logs || {};

  const grid = useMemo(() => buildGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const monthStats = useMemo(() => {
    let total = 0, tracked = 0;
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${viewYear}-${padTwo(viewMonth + 1)}-${padTwo(d)}`;
      const dayLog = logsData[key];
      if (dayLog) {
        const cal = Object.values(dayLog).flat().reduce((s, f) => s + (f.calories || 0), 0);
        if (cal > 0) { total += cal; tracked++; }
      }
    }
    return { total: Math.round(total), avg: tracked > 0 ? Math.round(total / tracked) : 0, tracked };
  }, [logsData, viewYear, viewMonth]);

  const getDayData = useCallback((d) => {
    if (!d) return null;
    const key = `${viewYear}-${padTwo(viewMonth + 1)}-${padTwo(d)}`;
    const dayLog = logsData[key];
    if (!dayLog) return { key, cal: 0, meals: {} };
    const meals = {};
    let cal = 0;
    Object.entries(dayLog).forEach(([meal, foods]) => {
      const arr = Array.isArray(foods) ? foods : [];
      const mealCal = arr.reduce((s, f) => s + (f.calories || 0), 0);
      if (arr.length > 0) meals[meal] = { foods: arr, cal: Math.round(mealCal) };
      cal += mealCal;
    });
    return { key, cal: Math.round(cal), meals };
  }, [logsData, viewYear, viewMonth]);

  const navMonth = (dir) => {
    setViewMonth(m => {
      let nm = m + dir;
      if (nm < 0) { setViewYear(y => y - 1); return 11; }
      if (nm > 11) { setViewYear(y => y + 1); return 0; }
      return nm;
    });
  };

  const openDay = (d) => {
    if (!d) return;
    setSelectedDay(d);
    setModalVisible(true);
  };

  const selectedData = selectedDay ? getDayData(selectedDay) : null;

  const CELL_W = Math.floor((Dimensions.get('window').width - 24) / 7);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Calendar  کیلنڈر</Text>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => navMonth(-1)} style={styles.navBtn}>
              <Text style={styles.navBtnText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={() => navMonth(1)} style={styles.navBtn}>
              <Text style={styles.navBtnText}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Month Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total Cal', value: monthStats.total.toLocaleString() },
            { label: 'Avg/Day',   value: monthStats.avg.toLocaleString() },
            { label: 'Days',      value: monthStats.tracked },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Calendar */}
        <View style={styles.calendarCard}>
          {/* Day names row */}
          <View style={styles.dayNamesRow}>
            {DAY_NAMES.map(d => (
              <Text key={d} style={[styles.dayName, { width: CELL_W }]}>{d}</Text>
            ))}
          </View>
          {/* Grid */}
          <View style={styles.grid}>
            {grid.map((d, i) => {
              const data = getDayData(d);
              const color = d ? dayColor(data?.cal || 0, goal) : 'transparent';
              const key2 = d ? `${viewYear}-${padTwo(viewMonth + 1)}-${padTwo(d)}` : null;
              const isToday = key2 === todayKey;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => openDay(d)}
                  disabled={!d}
                  style={[
                    styles.cell,
                    { width: CELL_W, height: CELL_W + 8, backgroundColor: d ? color : 'transparent' },
                    isToday && styles.todayCell,
                  ]}
                >
                  {d && (
                    <>
                      <Text style={[styles.cellDay, { color: color === '#e0e0e0' ? '#bbb' : '#fff' }]}>{d}</Text>
                      {data?.cal > 0 && (
                        <Text style={[styles.cellCal, { color: color === '#e0e0e0' ? '#bbb' : '#fff' }]}>{data.cal}</Text>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          {/* Legend */}
          <View style={styles.legend}>
            {[
              { color: '#2196F3', label: 'Under' },
              { color: '#4CAF50', label: 'On track' },
              { color: '#FF9800', label: 'Slightly over' },
              { color: '#F44336', label: 'Over' },
              { color: '#e0e0e0', label: 'No data' },
            ].map(l => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={styles.legendLabel}>{l.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Day Detail Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            {selectedData && (
              <>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>
                    {selectedDay} {MONTH_NAMES[viewMonth]} {viewYear}
                  </Text>
                  <Text style={styles.sheetCal}>{selectedData.cal} kcal total</Text>
                </View>
                <ScrollView style={styles.sheetScroll}>
                  {Object.keys(selectedData.meals).length === 0 ? (
                    <Text style={styles.emptyDay}>No meals logged for this day</Text>
                  ) : (
                    Object.entries(selectedData.meals).map(([meal, data]) => (
                      <View key={meal} style={styles.mealSection}>
                        <Text style={styles.mealTitle}>
                          {meal.charAt(0).toUpperCase() + meal.slice(1)}
                          <Text style={styles.mealCal}> · {data.cal} kcal</Text>
                        </Text>
                        {data.foods.map((food, fi) => (
                          <View key={fi} style={styles.foodRow}>
                            <Text style={styles.foodEmoji}>{food.emoji || '🍽️'}</Text>
                            <View style={styles.foodInfo}>
                              <Text style={styles.foodName}>{food.name}</Text>
                              <Text style={styles.foodCal}>{food.calories} kcal · {food.serving}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    ))
                  )}
                  <TouchableOpacity
                    style={styles.addDayBtn}
                    onPress={() => {
                      setModalVisible(false);
                      nav.navigate('Food', { mealType: 'lunch' });
                    }}
                  >
                    <Text style={styles.addDayBtnText}>+ Add food for this date</Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  content: { paddingBottom: 32 },
  header: { backgroundColor: '#1a1a2e', paddingTop: 48, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 24 },
  navBtn: { padding: 6 },
  navBtnText: { color: '#fff', fontSize: 26, fontWeight: '300' },
  monthLabel: { color: '#fff', fontSize: 16, fontWeight: '700', minWidth: 160, textAlign: 'center' },
  statsRow: { flexDirection: 'row', margin: 12, gap: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  statVal: { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  calendarCard: { backgroundColor: '#fff', margin: 12, marginTop: 0, borderRadius: 12, padding: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  dayNamesRow: { flexDirection: 'row', marginBottom: 4 },
  dayName: { textAlign: 'center', fontSize: 11, color: '#888', fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { justifyContent: 'center', alignItems: 'center', borderRadius: 6, margin: 1 },
  todayCell: { borderWidth: 2, borderColor: '#1a1a2e' },
  cellDay: { fontSize: 13, fontWeight: '700' },
  cellCal: { fontSize: 9, marginTop: 1 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 10, color: '#666' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: SH * 0.75, padding: 20 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
  sheetCal: { fontSize: 14, color: '#4CAF50', marginTop: 4, fontWeight: '600' },
  sheetScroll: { maxHeight: SH * 0.45 },
  emptyDay: { color: '#bbb', textAlign: 'center', paddingVertical: 24, fontSize: 14 },
  mealSection: { marginBottom: 16 },
  mealTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  mealCal: { color: '#4CAF50', fontWeight: '400' },
  foodRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#f0f2f5' },
  foodEmoji: { fontSize: 20, width: 32 },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  foodCal: { fontSize: 12, color: '#888', marginTop: 1 },
  addDayBtn: { backgroundColor: '#4CAF50', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8, marginBottom: 4 },
  addDayBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  closeBtn: { alignItems: 'center', padding: 12, marginTop: 4 },
  closeBtnText: { color: '#888', fontSize: 15 },
});
