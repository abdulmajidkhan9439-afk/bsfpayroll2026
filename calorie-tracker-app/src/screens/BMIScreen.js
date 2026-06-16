import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';

const ACTIVITY_LEVELS = [
  { key: 'sedentary',  label: 'Sedentary',   urdu: 'بیٹھا رہنا',    factor: 1.2 },
  { key: 'light',      label: 'Light',        urdu: 'ہلکی ورزش',     factor: 1.375 },
  { key: 'moderate',   label: 'Moderate',     urdu: 'معتدل',          factor: 1.55 },
  { key: 'active',     label: 'Active',       urdu: 'فعال',           factor: 1.725 },
  { key: 'very_active',label: 'Very Active',  urdu: 'بہت فعال',       factor: 1.9 },
];

const GOALS = [
  { key: 'lose',     label: 'Lose Weight',    urdu: 'وزن کم کریں',    adj: -500 },
  { key: 'maintain', label: 'Maintain',       urdu: 'برقرار رکھیں',   adj: 0 },
  { key: 'gain',     label: 'Gain Weight',    urdu: 'وزن بڑھائیں',    adj: +500 },
];

function bmiCategory(bmi) {
  if (bmi < 18.5) return { label: 'Underweight',   color: '#2196F3' };
  if (bmi < 25)   return { label: 'Normal',         color: '#4CAF50' };
  if (bmi < 30)   return { label: 'Overweight',     color: '#FF9800' };
  return              { label: 'Obese',              color: '#F44336' };
}

function generateId(firstName, lastName) {
  const f = (firstName || '').replace(/\s/g, '').toUpperCase().slice(0, 3);
  const l = (lastName  || '').replace(/\s/g, '').toUpperCase().slice(0, 2);
  const hash = Math.abs(
    [...(firstName + lastName + Date.now().toString())].reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0)
  ) % 10000;
  return `${f}${l}${String(hash).padStart(4, '0')}`;
}

function calcBMR(weight, heightCm, age, gender) {
  if (gender === 'male') {
    return 88.362 + 13.397 * weight + 4.799 * heightCm - 5.677 * age;
  }
  return 447.593 + 9.247 * weight + 3.098 * heightCm - 4.330 * age;
}

function idealWeightRange(heightCm, gender) {
  // Devine formula
  const inchesOver5ft = (heightCm / 2.54) - 60;
  const base = gender === 'male' ? 50 : 45.5;
  const ideal = base + 2.3 * inchesOver5ft;
  return { min: Math.round(ideal * 0.9), max: Math.round(ideal * 1.1) };
}

export default function BMIScreen() {
  const { prof, updateProf } = useApp();

  const [firstName, setFirstName] = useState(prof?.firstName || '');
  const [lastName,  setLastName]  = useState(prof?.lastName  || '');
  const [gender,    setGender]    = useState(prof?.gender    || 'male');
  const [weight,    setWeight]    = useState(String(prof?.weight || ''));
  const [height,    setHeight]    = useState(String(prof?.height || ''));
  const [age,       setAge]       = useState(String(prof?.age    || ''));
  const [activity,  setActivity]  = useState(prof?.activity || 'moderate');
  const [goal,      setGoal]      = useState(prof?.goal     || 'maintain');
  const [result,    setResult]    = useState(null);

  const generatedId = generateId(firstName, lastName);

  const calculate = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age, 10);
    if (!w || !h || !a || w <= 0 || h <= 0 || a <= 0) {
      Alert.alert('Incomplete', 'Please fill in weight, height, and age.');
      return;
    }
    const bmi = w / ((h / 100) ** 2);
    const bmr = calcBMR(w, h, a, gender);
    const actFactor = ACTIVITY_LEVELS.find(al => al.key === activity)?.factor || 1.55;
    const tdee = bmr * actFactor;
    const goalAdj = GOALS.find(g => g.key === goal)?.adj || 0;
    const ideal = idealWeightRange(h, gender);

    const res = {
      bmi: Math.round(bmi * 10) / 10,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      ideal,
      recommendations: [
        { label: 'Fast Loss',   kcal: Math.round(tdee - 1000), color: '#F44336' },
        { label: 'Loss',        kcal: Math.round(tdee - 500),  color: '#FF9800' },
        { label: 'Maintain',    kcal: Math.round(tdee),         color: '#4CAF50' },
        { label: 'Gain',        kcal: Math.round(tdee + 500),  color: '#2196F3' },
      ],
      dailyGoal: Math.round(tdee + goalAdj),
    };

    setResult(res);

    const profData = {
      id: generatedId,
      firstName, lastName, gender,
      weight: w, height: h, age: a,
      activity, goal,
      dailyGoal: res.dailyGoal,
    };
    updateProf && updateProf(profData);
  };

  const cat = result ? bmiCategory(result.bmi) : null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BMI Calculator</Text>
        <Text style={styles.headerSub}>باڈی ماس انڈیکس</Text>
      </View>

      {/* Form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Info</Text>

        {/* Name row */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>First Name</Text>
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First" placeholderTextColor="#bbb" />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>Last Name</Text>
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last" placeholderTextColor="#bbb" />
          </View>
        </View>

        {/* ID preview */}
        {(firstName || lastName) && (
          <Text style={styles.idPreview}>ID: {generatedId}</Text>
        )}

        {/* Gender */}
        <Text style={styles.fieldLabel}>Gender</Text>
        <View style={styles.btnGroup}>
          {[{ key: 'male', label: 'Male', urdu: 'مرد' }, { key: 'female', label: 'Female', urdu: 'عورت' }].map(g => (
            <TouchableOpacity
              key={g.key}
              style={[styles.optBtn, gender === g.key && styles.optBtnActive]}
              onPress={() => setGender(g.key)}
            >
              <Text style={[styles.optBtnText, gender === g.key && styles.optBtnTextActive]}>{g.label}</Text>
              <Text style={[styles.optBtnUrdu, gender === g.key && styles.optBtnTextActive]}>{g.urdu}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weight / Height / Age */}
        <View style={styles.row}>
          <View style={styles.thirdField}>
            <Text style={styles.fieldLabel}>Weight (kg)</Text>
            <TextInput style={styles.input} value={weight} onChangeText={setWeight} placeholder="70" keyboardType="decimal-pad" placeholderTextColor="#bbb" />
          </View>
          <View style={styles.thirdField}>
            <Text style={styles.fieldLabel}>Height (cm)</Text>
            <TextInput style={styles.input} value={height} onChangeText={setHeight} placeholder="170" keyboardType="decimal-pad" placeholderTextColor="#bbb" />
          </View>
          <View style={styles.thirdField}>
            <Text style={styles.fieldLabel}>Age</Text>
            <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="25" keyboardType="number-pad" placeholderTextColor="#bbb" />
          </View>
        </View>

        {/* Activity */}
        <Text style={styles.fieldLabel}>Activity Level</Text>
        <View style={styles.btnGroup}>
          {ACTIVITY_LEVELS.map(al => (
            <TouchableOpacity
              key={al.key}
              style={[styles.actBtn, activity === al.key && styles.optBtnActive]}
              onPress={() => setActivity(al.key)}
            >
              <Text style={[styles.actBtnText, activity === al.key && styles.optBtnTextActive]}>{al.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Goal */}
        <Text style={styles.fieldLabel}>Goal</Text>
        <View style={styles.btnGroup}>
          {GOALS.map(g => (
            <TouchableOpacity
              key={g.key}
              style={[styles.optBtn, goal === g.key && styles.optBtnActive]}
              onPress={() => setGoal(g.key)}
            >
              <Text style={[styles.optBtnText, goal === g.key && styles.optBtnTextActive]}>{g.label}</Text>
              <Text style={[styles.optBtnUrdu, goal === g.key && styles.optBtnTextActive]}>{g.urdu}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Calculate */}
        <TouchableOpacity style={styles.calcBtn} onPress={calculate}>
          <Text style={styles.calcBtnText}>Calculate حساب لگائیں</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {result && cat && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Results  نتیجہ</Text>

          {/* BMI value */}
          <View style={styles.bmiRow}>
            <View style={styles.bmiCircle}>
              <Text style={[styles.bmiValue, { color: cat.color }]}>{result.bmi}</Text>
              <Text style={styles.bmiUnit}>BMI</Text>
            </View>
            <View style={styles.bmiInfo}>
              <View style={[styles.catBadge, { backgroundColor: cat.color }]}>
                <Text style={styles.catBadgeText}>{cat.label}</Text>
              </View>
              <Text style={styles.idealLabel}>Ideal weight</Text>
              <Text style={styles.idealRange}>{result.ideal.min} – {result.ideal.max} kg</Text>
              <Text style={styles.bmrText}>BMR: {result.bmr} kcal/day</Text>
              <Text style={styles.bmrText}>TDEE: {result.tdee} kcal/day</Text>
            </View>
          </View>

          {/* Calorie recommendations */}
          <Text style={[styles.fieldLabel, { marginTop: 16, marginBottom: 8 }]}>Calorie Recommendations</Text>
          {result.recommendations.map(rec => (
            <View key={rec.label} style={styles.recRow}>
              <View style={[styles.recDot, { backgroundColor: rec.color }]} />
              <Text style={styles.recLabel}>{rec.label}</Text>
              <View style={styles.recBarTrack}>
                <View style={[styles.recBarFill, {
                  width: `${Math.min(rec.kcal / 4000, 1) * 100}%`,
                  backgroundColor: rec.color,
                }]} />
              </View>
              <Text style={[styles.recKcal, { color: rec.color }]}>{rec.kcal} kcal</Text>
            </View>
          ))}

          <View style={[styles.dailyGoalBanner, { borderColor: cat.color }]}>
            <Text style={styles.dailyGoalLabel}>Your Daily Goal</Text>
            <Text style={[styles.dailyGoalVal, { color: cat.color }]}>{result.dailyGoal} kcal</Text>
            <Text style={styles.dailyGoalSub}>Saved to your profile</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f0f2f5' },
  content: { paddingBottom: 40 },
  header: { backgroundColor: '#1a1a2e', paddingTop: 48, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  headerSub: { color: '#aaa', fontSize: 14, textAlign: 'center', marginTop: 4 },
  card: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 12, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#1a1a2e', marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  halfField: { flex: 1 },
  thirdField: { flex: 1 },
  input: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, padding: 10, fontSize: 15, color: '#1a1a2e', backgroundColor: '#fafafa' },
  idPreview: { fontSize: 12, color: '#888', marginBottom: 12, fontFamily: 'monospace' },
  btnGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  optBtn: { flex: 1, minWidth: 80, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10, padding: 10, alignItems: 'center', backgroundColor: '#fafafa' },
  optBtnActive: { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
  optBtnText: { fontSize: 13, fontWeight: '700', color: '#555' },
  optBtnUrdu: { fontSize: 11, color: '#888', marginTop: 2 },
  optBtnTextActive: { color: '#fff' },
  actBtn: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10, backgroundColor: '#fafafa' },
  actBtnText: { fontSize: 12, fontWeight: '600', color: '#555' },
  calcBtn: { backgroundColor: '#4CAF50', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 6 },
  calcBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // Results
  bmiRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
  bmiCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f2f5', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#e0e0e0' },
  bmiValue: { fontSize: 32, fontWeight: '900' },
  bmiUnit: { fontSize: 12, color: '#888' },
  bmiInfo: { flex: 1 },
  catBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8 },
  catBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  idealLabel: { fontSize: 11, color: '#888' },
  idealRange: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  bmrText: { fontSize: 11, color: '#888', marginTop: 2 },
  recRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  recDot: { width: 10, height: 10, borderRadius: 5 },
  recLabel: { width: 68, fontSize: 12, color: '#555', fontWeight: '600' },
  recBarTrack: { flex: 1, height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' },
  recBarFill: { height: '100%', borderRadius: 4 },
  recKcal: { width: 72, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  dailyGoalBanner: { borderWidth: 2, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  dailyGoalLabel: { fontSize: 13, color: '#888' },
  dailyGoalVal: { fontSize: 28, fontWeight: '900', marginVertical: 4 },
  dailyGoalSub: { fontSize: 11, color: '#aaa' },
});
