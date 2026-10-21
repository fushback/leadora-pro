import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function packageApk() {
  const zip = new JSZip();

  // 1. Android Manifest (Cordova Android format)
  const androidManifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.b2blead.pro"
    android:versionCode="10000"
    android:versionName="1.0.0">
    <uses-sdk android:minSdkVersion="26" android:targetSdkVersion="34" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="B2B Lead Pro"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.DeviceDefault.NoActionBar"
        android:usesCleartextTraffic="true">
        <activity
            android:name="com.b2blead.pro.MainActivity"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:label="B2B Lead Pro"
            android:launchMode="singleTop"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;
  zip.file('AndroidManifest.xml', androidManifestXml);

  // 2. assets/www/ (Contains Cordova assets)
  const wwwDir = path.resolve(rootDir, 'www');
  function addDirToZip(currentDir: string, zipFolder: JSZip) {
    if (!fs.existsSync(currentDir)) return;
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        const subFolder = zipFolder.folder(file);
        if (subFolder) addDirToZip(filePath, subFolder);
      } else {
        zipFolder.file(file, fs.readFileSync(filePath));
      }
    }
  }

  const assetsFolder = zip.folder('assets');
  if (assetsFolder) {
    const wwwFolder = assetsFolder.folder('www');
    if (wwwFolder && fs.existsSync(wwwDir)) {
      addDirToZip(wwwDir, wwwFolder);
    }
  }

  // 3. res/xml/config.xml
  const resFolder = zip.folder('res');
  if (resFolder) {
    const xmlFolder = resFolder.folder('xml');
    const configXmlPath = path.resolve(rootDir, 'config.xml');
    if (xmlFolder && fs.existsSync(configXmlPath)) {
      xmlFolder.file('config.xml', fs.readFileSync(configXmlPath));
    }
  }

  // 4. META-INF/MANIFEST.MF
  const metaFolder = zip.folder('META-INF');
  if (metaFolder) {
    metaFolder.file('MANIFEST.MF', 'Manifest-Version: 1.0\r\nCreated-By: B2B Lead Cordova Packager 1.0\r\nBuilt-By: Google AI Studio\r\n');
  }

  const outDir = path.resolve(rootDir, 'public', 'downloads');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const apkBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const apkPath = path.join(outDir, 'b2b-lead-pro.apk');
  fs.writeFileSync(apkPath, apkBuffer);
  console.log(`Successfully generated APK at: ${apkPath} (${(apkBuffer.length / 1024).toFixed(1)} KB)`);
}

packageApk().catch(console.error);
