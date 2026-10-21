# B2B Lead Pro - Android App (Cordova Setup & Build Guide)

This project is fully configured to be built and run as an **Android App (.apk / .aab)** using **Apache Cordova**.

---

## 🚀 Quick Start (3 Steps to Build the Android APK)

### Prerequisites
Make sure you have installed:
1. **Node.js** (v18+)
2. **Java JDK 17+**
3. **Android Studio** (with Android SDK & Build Tools)
4. Cordova CLI:
   ```bash
   npm install -g cordova
   ```

---

### Step 1: Build the Web Assets for Cordova
In your project root, run:
```bash
npm run build:cordova
```
This generates the optimized production bundle inside the `www/` folder with relative paths (`./assets/...`) required by the Android WebView.

---

### Step 2: Add the Android Platform
```bash
cordova platform add android@13
```
This initializes the native Android Gradle project under `platforms/android/`.

---

### Step 3: Compile the Android APK
For Debug APK (for instant testing on device or emulator):
```bash
cordova build android
```
The generated APK will be located at:
`platforms/android/app/build/outputs/apk/debug/app-debug.apk`

To install directly to a connected Android phone via USB:
```bash
cordova run android
```

---

## 📱 Release APK / Google Play Store (Production .AAB)
To generate an optimized release APK:
```bash
cordova build android --release -- --packageType=apk
```
Or for Google Play Store Android App Bundle (.aab):
```bash
cordova build android --release -- --packageType=bundle
```

---

## ☁️ Zero-Setup Option: Free GitHub Actions Auto-Build
If you don't have Android SDK installed on your computer:
1. Push this repository to GitHub.
2. The included `.github/workflows/build-android-apk.yml` automatically builds the Android APK in the cloud.
3. Download the ready-to-install `.apk` directly from GitHub Actions **Artifacts**!

---

## 🛠 Included Cordova Plugins in `config.xml`:
* `cordova-plugin-whitelist`: Security and network access control.
* `cordova-plugin-statusbar`: Native Android status bar color and style.
* `cordova-plugin-splashscreen`: Smooth launch screen.
* `cordova-plugin-file`: Native file system storage for downloaded Excel (.xlsx) and vCard (.vcf) files.
* `cordova-plugin-network-information`: Offline and online connectivity monitoring.
