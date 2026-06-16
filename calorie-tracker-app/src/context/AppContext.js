import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext(null);

const today = () => new Date().toISOString().split('T')[0];

const DEFAULT_PROF = {
  name: '', uid: '', w: 70, h: 170, age: 25, g: 'male', act: 'moderate', goal: 'maintain'
};

export function AppProvider({ children }) {
  const [logs, setLogs]     = useState({});
  const [prof, setProf]     = useState(DEFAULT_PROF);
  const [water, setWater]   = useState(0);
  const [steps, setSteps]   = useState(0);
  const [health, setHealth] = useState({});
  const [hcConnected, setHcConnected] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('ct_data').then(raw => {
      if (!raw) return;
      try {
        const d = JSON.parse(raw);
        if (d.logs)       setLogs(d.logs);
        if (d.prof)       setProf({ ...DEFAULT_PROF, ...d.prof });
        if (d.water != null) setWater(d.water);
        if (d.steps != null) setSteps(d.steps);
        if (d.health)     setHealth(d.health);
        if (d.hcConnected != null) setHcConnected(d.hcConnected);
      } catch {}
    });
  }, []);

  const save = (patch) => {
    const next = { logs, prof, water, steps, health, hcConnected, ...patch };
    AsyncStorage.setItem('ct_data', JSON.stringify(next));
  };

  const addFood = (food, meal, servings, date = today()) => {
    const entry = {
      id: Date.now().toString(), meal,
      n: food.n, u: food.u, e: food.e, s: food.s, srv: servings,
      cal: Math.round(food.cal * servings),
      p:   Math.round(food.p   * servings),
      c:   Math.round(food.c   * servings),
      f:   Math.round(food.f   * servings),
    };
    const updated = { ...logs, [date]: [...(logs[date] || []), entry] };
    setLogs(updated);
    save({ logs: updated });
    return entry;
  };

  const removeFood = (entryId, date = today()) => {
    const updated = { ...logs, [date]: (logs[date] || []).filter(e => e.id !== entryId) };
    setLogs(updated);
    save({ logs: updated });
  };

  const updateProf = (p) => {
    const updated = { ...prof, ...p };
    setProf(updated);
    save({ prof: updated });
  };

  const updateWater = (n) => {
    const w = Math.max(0, water + n);
    setWater(w);
    save({ water: w });
  };

  const updateHealth = (h) => {
    if (h.steps != null) setSteps(h.steps);
    const nh = { ...health, ...h };
    setHealth(nh);
    setHcConnected(true);
    save({ health: nh, steps: h.steps ?? steps, hcConnected: true });
  };

  const getGoal = () => {
    const { w, h, age, g, act, goal } = prof;
    let bmr = g === 'male' ? 10*w + 6.25*h - 5*age + 5 : 10*w + 6.25*h - 5*age - 161;
    const mult = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, veryActive:1.9 };
    let tdee = bmr * (mult[act] || 1.55);
    if (goal === 'lose') tdee -= 500;
    else if (goal === 'gain') tdee += 500;
    return Math.round(tdee);
  };

  const getTodayCal = (date = today()) =>
    (logs[date] || []).reduce((s, e) => s + e.cal, 0);

  const getTodayMac = (date = today()) =>
    (logs[date] || []).reduce((a, e) => ({ p: a.p+e.p, c: a.c+e.c, f: a.f+e.f }), {p:0,c:0,f:0});

  return (
    <AppContext.Provider value={{
      logs, prof, water, steps, health, hcConnected,
      addFood, removeFood, updateProf, updateWater, updateHealth,
      getGoal, getTodayCal, getTodayMac, today,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
