# B2B Lead PRO - Commercial Database, Spreadsheet & VCF Exporter

A modern, high-performance, full-stack B2B lead generation, spreadsheet export, and vCard (VCF 3.0) mobile contact packaging application.

Designed with Google 4-Color minimal aesthetic:
- **Blue**: `#4285F4` (Primary actions, Google Places search, focus rings)
- **Red**: `#EA4335` (Step 3 vCard contact cards, alert indicators)
- **Yellow**: `#FBBC05` (Applied Tag system, notes, highlights)
- **Green**: `#34A853` (Spreadsheet export, WhatsApp badges, live status)

Strict **Light Mode** styling with smooth playful animations and responsive layout across all device viewports.

---

## 🚀 Quick Deploy to Vercel

### Option 1: 1-Click Import from GitHub
1. Push this repository to your GitHub account (see instructions below).
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..."** → **"Project"**.
3. Import your GitHub repository (`b2b-lead-pro`).
4. In **Environment Variables**, add:
   - `VITE_GOOGLE_MAPS_API_KEY`: Your Google Maps / Places API key
   - `GEMINI_API_KEY`: Your Gemini API key (optional)
5. Click **"Deploy"**. Vercel will build the Vite frontend and route `/api/*` to the serverless backend.

### Option 2: Deploy with Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to your Vercel account
vercel login

# Deploy from repository root
vercel

# Deploy to production
vercel --prod
```

---

## 🐙 Push to GitHub

From the root of this project:

```bash
# 1. Initialize git (if not already initialized)
git init
git branch -M main

# 2. Stage all project files
git add .

# 3. Commit the codebase
git commit -m "feat: B2B Lead PRO full-stack application"

# 4. Link your GitHub repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/b2b-lead-pro.git

# 5. Push to GitHub
git push -u origin main
```

---

## 🛠 Local Development

```bash
# Install dependencies
npm install

# Run full-stack dev server (Express + Vite on port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

---

## 📋 Features

- **Step 1: Live Lead Search**: City/area search with Google Places API autocomplete, proximity GPS radius mode, and dedicated **Tag** field.
- **Step 2: Leads Database & Multi-Sheet Spreadsheet**: Categorized sheets (All Leads + category sheets), WhatsApp direct links, search filter.
- **Step 3: VCF Contact Card Packager**: Formats vCard 3.0 with:
  - `First Name`: [Business Name]
  - `Middle Name`: [Short Location]
  - `Last Name`: [Category] - [Tag]
  - `Phone`: [Public Number]
  - `Email`: [Email Address]
  - `Address`: [Full Address]
  - `Website`: [Website URL]
  - `Note`: [Tag]
  - `Tag`: [Tag]
- **Android Cordova APK Build**: Ready-to-build Cordova bundle with `config.xml`.
