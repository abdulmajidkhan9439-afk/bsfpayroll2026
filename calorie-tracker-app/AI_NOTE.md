# AI ke liye Note — Calorie Tracker APK Build

## Kya Karna Hai?

User ke liye ek Android APK build karni hai. Code already tayyar hai. Sirf build aur deliver karna hai.

---

## Project Ki Information

- **Repository:** https://github.com/abdulmajidkhan9439-afk/bsfpayroll2026
- **Branch:** `claude/calorie-tracker-app-42Uwl`
- **App folder:** `calorie-tracker-app/`
- **App name:** Calorie Tracker Pakistan
- **Package:** `com.bsf.calorietracker`
- **Tech:** React Native + Expo SDK 51

---

## Tera Kaam — Step by Step

### 1. Expo Account Setup
- `expo.dev` par user ka account banao ya existing account use karo
- `expo.dev/settings/access-tokens` se ek **Access Token** generate karo
- Yeh token save kar lo

### 2. GitHub Secret Add Karo
- GitHub repository: `abdulmajidkhan9439-afk/bsfpayroll2026`
- Settings → Secrets and variables → Actions → New repository secret
- Name: `EXPO_TOKEN`
- Value: (upar wala token)

### 3. EAS Project ID Set Karo
- Terminal mein:
  ```
  cd calorie-tracker-app
  npm install
  eas login
  eas init
  ```
- Jo `projectId` mile woh `app.json` mein `extra.eas.projectId` mein dalo
- Commit aur push karo branch par

### 4. APK Build Trigger Karo
- GitHub Actions tab kholo
- "Build Android APK" workflow manually run karo (workflow_dispatch)
- Ya koi bhi commit push karo branch par — automatically start ho jayega

### 5. APK Download Karo
- Actions → Build complete hone par → Artifacts section
- `calorie-tracker-pakistan.apk` download karo
- User ko do ya direct phone par bhejo

---

## Agar EAS Nahi Chal Raha

Local build karo:
```bash
cd calorie-tracker-app
npm install
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```
APK milegi: `android/app/build/outputs/apk/release/app-release.apk`

---

## App Ki Features (jo already code mein hain)

- Pakistani food database (80+ items: Biryani, KFC, McDonald's, etc.)
- **Health Connect real sync** — Samsung Health ka steps, heart rate, sleep
- BMI Calculator
- Calendar (monthly view)
- Calorie tracking with macros
- User profile with auto-generated ID from name

---

## Health Connect Permission (already configured hai)

`app.json` mein plugin already set hai:
```json
"plugins": [["react-native-health-connect", {"healthConnectVersion": "1.1.0"}]]
```

AndroidManifest mein permissions automatically add ho jaate hain build ke waqt.

---

## Important Files

| File | Kya Karta Hai |
|------|---------------|
| `App.js` | Main navigation (5 tabs) |
| `app.json` | App config + Health Connect plugin |
| `eas.json` | APK build profile |
| `src/screens/ProfileScreen.js` | Health Connect sync code |
| `src/data/foodDatabase.js` | 80+ food items |
| `src/context/AppContext.js` | State management |
| `.github/workflows/build-apk.yml` | GitHub Actions workflow |

---

## User Ko Deliver Karna Hai

Ek `.apk` file jo:
1. Android phone par directly install ho sake
2. Health Connect se connect ho sake
3. Samsung Health ka data sync kare
