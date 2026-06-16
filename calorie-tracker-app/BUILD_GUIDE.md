# APK Build Guide — Calorie Tracker Pakistan

## Apne PC ya Laptop par yeh steps follow karein:

### Step 1: Requirements Install karein
```bash
# Node.js install karein (nodejs.org se)
# Phir run karein:
npm install -g expo-cli eas-cli
```

### Step 2: Project setup
```bash
cd calorie-tracker-app
npm install
```

### Step 3: Expo account banao
- expo.dev par free account banao
- Terminal mein:
```bash
eas login
```

### Step 4: APK build karein
```bash
# APK (install karne ke liye)
eas build -p android --profile preview

# Ya AAB (Play Store ke liye)
eas build -p android --profile production
```

### Step 5: Download karein
- Build complete hone par ek download link milega
- APK file download karein aur phone par install karein

---

## Health Connect Features:
- Samsung Health ka data automatically sync hoga
- Steps, Heart Rate, Calories Burned, Sleep sab
- App install hone ke baad Health Connect permissions grant karein
