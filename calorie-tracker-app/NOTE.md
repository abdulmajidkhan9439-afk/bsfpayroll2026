# 📱 Calorie Tracker Pakistan — APK Banane ka Tarika

Yeh note un ke liye hai jo computer par is project ka APK build karenge.

---

## Yeh App Kya Hai?

Android ke liye ek **Calorie Tracker app** jisme:
- Pakistani food (Biryani, Nihari, Halwa Puri, etc.), KFC, McDonald's, Subway ka food database
- **Health Connect se real sync** — Samsung Health, Google Fit ka data seedha aata hai
- BMI Calculator, Calendar, Weekly/Monthly report
- 5 tabs: Home, Food, Calendar, BMI, Profile

---

## Computer Par Kya Kya Chahiye?

1. **Node.js** — https://nodejs.org (LTS version download karo)
2. **Git** — https://git-scm.com
3. **Expo account (free)** — https://expo.dev par sign up karo

---

## Step-by-Step: APK Banao

### Step 1 — Code download karo (Git se)
```
git clone https://github.com/abdulmajidkhan9439-afk/bsfpayroll2026.git
cd bsfpayroll2026
git checkout claude/calorie-tracker-app-42Uwl
cd calorie-tracker-app
```

### Step 2 — Dependencies install karo
```
npm install
```
*(internet chahiye, 2-3 minute lagenge)*

### Step 3 — EAS CLI install karo
```
npm install -g eas-cli
```

### Step 4 — Expo account se login karo
```
eas login
```
*(expo.dev wala email aur password dalo)*

### Step 5 — Project ID set karo
```
eas init
```
*(ek baar poochega "Link to existing project?" — No dabao, new project banao)*

### Step 6 — APK build karo
```
eas build -p android --profile preview
```
- Internet se build hoga (EAS ke server par)
- 10-15 minute lagenge
- End par ek **download link** milega
- Us link se `.apk` file download karo
- Phone par bhejo aur install karo

---

## Phone Par Install Hone Ke Baad

1. App kholo
2. **Profile tab** par jao
3. **"❤️ Health Connect se Connect Karen"** button dabao
4. Samsung Health, Google Fit — sab ka data automatic aana shuru ho jayega

---

## Agar Koi Error Aaye

| Error | Solution |
|-------|----------|
| `npm install` fail | Internet check karo |
| `eas login` fail | expo.dev par account banao |
| `eas build` fail | `eas.json` mein `projectId` check karo |
| Health Connect nahi chalta | Phone Android 9+ hona chahiye, Google Play Services updated hona chahiye |

---

## Files Ki List

```
calorie-tracker-app/
├── App.js                    ← Main app (5 tabs)
├── app.json                  ← App settings + Health Connect plugin
├── package.json              ← Dependencies
├── eas.json                  ← APK build settings
├── babel.config.js           ← Build config
├── src/
│   ├── data/
│   │   └── foodDatabase.js   ← 80+ food items (Pakistani, KFC, etc.)
│   ├── context/
│   │   └── AppContext.js     ← App ka data management
│   └── screens/
│       ├── HomeScreen.js     ← Home (calorie ring, meals)
│       ├── FoodScreen.js     ← Food search + add
│       ├── CalendarScreen.js ← Monthly calendar
│       ├── BMIScreen.js      ← BMI + profile setup
│       └── ProfileScreen.js  ← Health Connect sync
```

---

## Health Connect Kaise Kaam Karta Hai

```
Samsung Health
      ↓  (automatically syncs)
Health Connect (Android)
      ↓  (hamari app read karti hai)
Calorie Tracker App
      ↓
Steps, Heart Rate, Calories Burned, Sleep — sab show hota hai
```

---

*Koi problem ho toh developer se poochho.*
