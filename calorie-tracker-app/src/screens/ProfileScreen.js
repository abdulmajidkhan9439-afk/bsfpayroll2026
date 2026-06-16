import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  initialize,
  requestPermission,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';
import { useApp } from '../context/AppContext';

const C = {
  bg: '#f0f2f5', card: '#fff', dark: '#1a1a2e',
  green: '#4CAF50', orange: '#FF9800', red: '#F44336',
};

export default function ProfileScreen({ navigation }) {
  const { prof, steps, health, hcConnected, updateHealth, getGoal, getTodayCal } = useApp();
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState('');

  useFocusEffect(useCallback(() => { setStatus(''); }, []));

  const connectHealthConnect = async () => {
    setSyncing(true);
    setStatus('⏳ Health Connect سے connect ہو رہا ہے...');
    try {
      // Check if Health Connect is available
      const sdkStatus = await getSdkStatus();
      if (sdkStatus !== SdkAvailabilityStatus.SDK_AVAILABLE) {
        Alert.alert(
          'Health Connect دستیاب نہیں',
          'براہ کرم Google Play سے Health Connect app install کریں',
          [{ text: 'ٹھیک ہے' }]
        );
        setSyncing(false);
        return;
      }

      // Initialize
      const initialized = await initialize();
      if (!initialized) throw new Error('Initialization failed');

      // Request permissions
      const permissions = await requestPermission([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'HeartRate' },
        { accessType: 'read', recordType: 'TotalCaloriesBurned' },
        { accessType: 'read', recordType: 'SleepSession' },
        { accessType: 'read', recordType: 'Weight' },
      ]);

      if (!permissions || permissions.length === 0) {
        setStatus('❌ Permission نہیں ملی — Health Connect settings check کریں');
        setSyncing(false);
        return;
      }

      await fetchHealthData();
    } catch (e) {
      setStatus('❌ Error: ' + (e.message || 'دوبارہ کوشش کریں'));
      setSyncing(false);
    }
  };

  const fetchHealthData = async () => {
    setStatus('⏳ Data fetch ہو رہا ہے...');
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const timeRange = {
      operator: 'between',
      startTime: startOfDay.toISOString(),
      endTime: now.toISOString(),
    };

    try {
      // Steps
      const stepsData = await readRecords('Steps', { timeRangeFilter: timeRange });
      const totalSteps = stepsData.reduce((s, r) => s + (r.count || 0), 0);

      // Calories burned
      let calBurned = 0;
      try {
        const calData = await readRecords('TotalCaloriesBurned', { timeRangeFilter: timeRange });
        calBurned = Math.round(calData.reduce((s, r) => s + (r.energy?.inKilocalories || 0), 0));
      } catch {}

      // Heart rate
      let heartRate = 0;
      try {
        const hrData = await readRecords('HeartRate', { timeRangeFilter: timeRange });
        if (hrData.length > 0) {
          const last = hrData[hrData.length - 1];
          heartRate = Math.round(last.samples?.[0]?.beatsPerMinute || 0);
        }
      } catch {}

      // Sleep (last night)
      let sleepHours = 0;
      try {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(18, 0, 0, 0);
        const sleepData = await readRecords('SleepSession', {
          timeRangeFilter: { operator: 'between', startTime: yesterday.toISOString(), endTime: now.toISOString() },
        });
        if (sleepData.length > 0) {
          const last = sleepData[sleepData.length - 1];
          const ms = new Date(last.endTime) - new Date(last.startTime);
          sleepHours = Math.round(ms / 3600000 * 10) / 10;
        }
      } catch {}

      // Weight
      let weight = prof.w;
      try {
        const wtData = await readRecords('Weight', { timeRangeFilter: timeRange });
        if (wtData.length > 0) weight = Math.round(wtData[wtData.length - 1].weight.inKilograms * 10) / 10;
      } catch {}

      updateHealth({
        steps: totalSteps,
        calBurned,
        hr: heartRate || undefined,
        sleep: sleepHours || undefined,
        weight: weight !== prof.w ? weight : undefined,
        lastSync: now.toLocaleTimeString('ur-PK', { hour: '2-digit', minute: '2-digit' }),
        source: 'Health Connect',
      });

      setStatus(`✅ Sync ہو گئی! ${totalSteps.toLocaleString()} steps | ${calBurned} cal جلی | HR: ${heartRate || '--'} bpm`);
    } catch (e) {
      setStatus('❌ Data fetch error: ' + (e.message || 'retry'));
    }
    setSyncing(false);
  };

  const bmi = +(prof.w / ((prof.h / 100) ** 2)).toFixed(1);
  const bmiColor = bmi < 18.5 ? C.orange : bmi < 25 ? C.green : bmi < 30 ? C.orange : C.red;
  const goal = getGoal();
  const todayCal = getTodayCal();

  return (
    <ScrollView style={s.screen}>
      {/* Header */}
      <View style={s.hdr}>
        <Text style={s.avt}>{prof.g === 'female' ? '👩' : '👨'}</Text>
        <Text style={s.name}>{prof.name || 'میرا پروفائل'}</Text>
        {!!prof.uid && (
          <View style={s.idBadge}>
            <Text style={s.idTxt}>🆔 {prof.uid}</Text>
          </View>
        )}
        <Text style={s.info}>{prof.age} سال | {prof.w} kg | {prof.h} cm</Text>
        <TouchableOpacity style={s.editBtn} onPress={() => navigation.navigate('BMI')}>
          <Text style={s.editTxt}>✏️ Profile Edit کریں</Text>
        </TouchableOpacity>
      </View>

      {/* Stats grid */}
      <View style={s.grid}>
        {[
          { e:'🔥', v:`${todayCal}`, l:'آج Cal', sub:`/ ${goal} goal`, c: C.green },
          { e:'⚖️', v:`${bmi}`,      l:'BMI',    sub: bmi<18.5?'کم وزن':bmi<25?'نارمل':bmi<30?'زیادہ':'موٹاپا', c: bmiColor },
          { e:'👟', v:`${steps.toLocaleString()}`, l:'Steps', sub:'/ 10,000 goal', c: C.orange },
          { e:'💧', v:`${(health.calBurned||0)}`, l:'Cal Burned', sub:'Health Connect', c:'#2196F3' },
        ].map((item, i) => (
          <View key={i} style={[s.statCard, { borderTopColor: item.c }]}>
            <Text style={s.statE}>{item.e}</Text>
            <Text style={[s.statV, { color: item.c }]}>{item.v}</Text>
            <Text style={s.statL}>{item.l}</Text>
            <Text style={s.statS}>{item.sub}</Text>
          </View>
        ))}
      </View>

      {/* Health Connect Card */}
      <View style={s.card}>
        <View style={s.cardHdr}>
          <Text style={s.cardTitle}>❤️ Health Connect</Text>
          <View style={[s.dot, hcConnected && s.dotOn]} />
        </View>
        <Text style={s.cardSub}>
          {hcConnected
            ? `✅ Connected${health.lastSync ? ' — آخری sync: ' + health.lastSync : ''}`
            : 'Samsung Health, Google Fit سب کا data real-time sync کریں'}
        </Text>

        {/* Health Metrics */}
        <View style={s.metrics}>
          {[
            { v: steps.toLocaleString(), l: '👟 Steps' },
            { v: `${health.calBurned || 0}`, l: '🔥 Cal Burned' },
            { v: health.hr ? `${health.hr} bpm` : '--', l: '❤️ Heart Rate' },
            { v: health.sleep ? `${health.sleep}h` : '--', l: '😴 Sleep' },
          ].map((m, i) => (
            <View key={i} style={s.metric}>
              <Text style={s.metricV}>{m.v}</Text>
              <Text style={s.metricL}>{m.l}</Text>
            </View>
          ))}
        </View>

        {!!status && (
          <View style={s.statusBox}>
            <Text style={s.statusTxt}>{status}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.hcBtn, syncing && s.hcBtnDim]}
          onPress={connectHealthConnect}
          disabled={syncing}
        >
          {syncing
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.hcBtnTxt}>
                {hcConnected ? '🔄 Health Connect Refresh کریں' : '❤️ Health Connect سے Connect کریں'}
              </Text>
          }
        </TouchableOpacity>

        <Text style={s.hcNote}>
          Samsung Health → Health Connect → یہ app{'\n'}
          سب کا data automatically sync ہوگا
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  hdr: { backgroundColor: C.dark, paddingTop: 52, paddingBottom: 24, alignItems: 'center', paddingHorizontal: 20 },
  avt: { fontSize: 56, marginBottom: 8 },
  name: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  idBadge: { backgroundColor: 'rgba(255,255,255,.15)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 6 },
  idTxt: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  info: { fontSize: 13, color: '#ccc', marginBottom: 12 },
  editBtn: { backgroundColor: 'rgba(255,255,255,.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,.4)', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 7 },
  editTxt: { color: '#fff', fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 8 },
  statCard: { width: '47%', backgroundColor: C.card, borderRadius: 12, padding: 13, alignItems: 'center', borderTopWidth: 3, elevation: 2 },
  statE: { fontSize: 24, marginBottom: 4 },
  statV: { fontSize: 22, fontWeight: '800' },
  statL: { fontSize: 12, color: '#888', marginTop: 2 },
  statS: { fontSize: 10, color: '#bbb', marginTop: 2 },
  card: { backgroundColor: C.card, margin: 12, borderRadius: 16, padding: 16, elevation: 2 },
  cardHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: C.dark },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF5722' },
  dotOn: { backgroundColor: C.green },
  cardSub: { fontSize: 12, color: '#888', marginBottom: 12 },
  metrics: { flexDirection: 'row', backgroundColor: '#f9f9f9', borderRadius: 12, padding: 10, marginBottom: 12 },
  metric: { flex: 1, alignItems: 'center' },
  metricV: { fontSize: 16, fontWeight: '800', color: C.dark },
  metricL: { fontSize: 9, color: '#888', marginTop: 2, textAlign: 'center' },
  statusBox: { backgroundColor: '#f0f4ff', borderRadius: 10, padding: 10, marginBottom: 10 },
  statusTxt: { fontSize: 12, color: '#1a1a2e', textAlign: 'center' },
  hcBtn: { backgroundColor: '#E91E63', borderRadius: 12, padding: 14, alignItems: 'center' },
  hcBtnDim: { opacity: 0.7 },
  hcBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
  hcNote: { fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 10, lineHeight: 18 },
});
