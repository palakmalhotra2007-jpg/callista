# 📱 Callista

A modern, full-stack Contact Management Application built with React, Vite, Express, and **Firebase (Cloud Firestore)**.

---

## ⚡ Quick Start (Single Command)

You can run both the frontend and backend simultaneously with **one single command**:

```bash
# 1. Install dependencies
npm install

# 2. Run both Backend API and Frontend Dev Server concurrently
npm run dev
```

- 🌐 **Frontend**: [http://localhost:3000](http://localhost:3000)
- 🚀 **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 🔥 Firebase Setup (1-Minute Guide)

1. Go to [https://console.firebase.google.com/](https://console.firebase.google.com/) and create a project (or select an existing one).
2. Go to **Build** → **Firestore Database** → **Create Database** (choose *Start in production mode* or *test mode*).
3. Generate your service account key:
   - Click the ⚙️ gear icon (Project Settings) → **Service Accounts** tab.
   - Click **Generate new private key**.
   - A `.json` file will download.
4. Rename or place that file as `serviceAccountKey.json` in the root folder of this project (it is already in `.gitignore` so it won't be pushed to git).
5. In your [`.env`](./.env) file:
   ```env
   PORT=5000
   JWT_SECRET=your_jwt_secret_key_here
   FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
   ```

*(Alternative: You can also pass `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` directly in `.env`)*

---

## 🔄 Migrate Existing Data from MongoDB to Firebase

If you have existing contacts in MongoDB that you want to copy into Firebase Firestore:

1. Add your `MONGO_URI` to [`.env`](./.env):
   ```env
   MONGO_URI=mongodb+srv://...
   ```
2. Run the automated migration script:
   ```bash
   npm run migrate:firebase
   ```
   This will automatically copy all users, passwords, PINs, contacts, reminders, follow-ups, and tags directly into Firestore.

---

## 📁 Unified Project Structure

```
Callista/
├── index.html            ← Vite frontend HTML root
├── vite.config.js        ← Vite config with API proxy
├── package.json          ← Unified scripts & dependencies
├── serviceAccountKey.json← (Optional) Firebase private key
├── .env                  ← Environment variables
├── .env.example          ← Sample environment template
│
├── src/                  ← Frontend React Source
│   ├── main.jsx          ← React entry point
│   ├── App.jsx           ← Main application
│   ├── index.css         ← Global CSS tokens & themes
│   ├── components/       ← UI components
│   ├── pages/            ← Login, Analytics, Reminders, Settings
│   ├── context/          ← AuthContext
│   └── services/         ← API client (Axios)
│
├── server/               ← Backend Express Server
│   ├── server.js         ← API server entrypoint & static serve
│   ├── config/
│   │   └── firebase.js   ← Firebase Admin & Firestore init
│   ├── middleware/
│   │   └── authMiddleware.js ← JWT authentication
│   └── routes/
│       ├── authRoutes.js     ← Auth & PIN endpoints (Firestore)
│       ├── contactRoutes.js  ← Contacts CRUD, CSV import, PDF export
│       └── otherRoutes.js    ← Reminders, birthdays, analytics, tags
│
└── scripts/
    └── migrate-to-firebase.js ← MongoDB to Firebase migration tool
```

---

## 🛠️ Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Runs both backend (Express on 5000) and frontend (Vite on 3000) concurrently |
| `npm run server:dev` | Runs backend only with nodemon auto-restart |
| `npm run client:dev` | Runs frontend only with Vite |
| `npm run build` | Builds optimized frontend bundle into `dist/` |
| `npm start` | Runs Express production server (serves API & `dist/`) |
| `npm run migrate:firebase` | Migrates MongoDB users & contacts to Firebase Firestore |

---

## ✨ Features
- ⚡ **Single-command runtime**: Concurrently run client + server with `npm run dev`
- 🔥 **Firebase Firestore**: Scalable cloud NoSQL database
- 🔐 **Authentication**: Secure bcrypt password hashing + JWT tokens + 4-digit PIN lock
- 🗺️ **Interactive Details**: Google Maps integration, quick actions, call/email links
- 🎂 **Birthday Tracker**: Upcoming 30-day birthday widget and reminders
- ⏰ **Smart Reminders**: Overdue alerts, call reminders, one-click completion
- 💬 **Follow-Up History**: Timestamped conversation logs
- 📊 **Analytics Dashboard**: Distribution charts and top contact metrics
- 📥 **CSV Import & 📄 PDF Export**: Fast batch import and printable directory export
- 🏷️ **Smart Organization**: Categories, custom tags, and full-text search
