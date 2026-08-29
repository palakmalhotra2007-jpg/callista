# 📱 Callista PhoneBook Pro — Unified Architecture & Supabase Edition

A modern, full-stack Contact Management Application built with React, Vite, Express, and **Supabase (PostgreSQL)**.

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

## 🗄️ Supabase Setup (1-Minute Guide)

1. Go to [https://supabase.com](https://supabase.com) and create a free project.
2. Open the **SQL Editor** in your Supabase Dashboard:
   - Copy the contents of [`supabase/schema.sql`](./supabase/schema.sql) and paste it into the editor.
   - Click **Run** to create the `users` and `contacts` tables, indexes, and triggers.
3. Open your Supabase **Project Settings** → **API**:
   - Copy `Project URL` and `anon` / `service_role` key.
4. Add them to your `.env` file in the project root:
   ```env
   PORT=5000
   JWT_SECRET=your_jwt_secret_key_here
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_KEY=your-supabase-anon-or-service-role-key
   ```

---

## 🔄 Migrate Existing Data from MongoDB to Supabase

If you have existing contacts in MongoDB that you want to transfer into Supabase:

1. Add your `MONGO_URI` to `.env`:
   ```env
   MONGO_URI=mongodb+srv://...
   ```
2. Run the automated migration script:
   ```bash
   npm run migrate:supabase
   ```
   This will automatically copy all users, passwords, PINs, contacts, reminders, follow-ups, and tags into Supabase.

---

## 📁 Unified Project Structure

```
Callista/
├── index.html            ← Vite frontend HTML root
├── vite.config.js        ← Vite config with API proxy
├── package.json          ← Unified scripts & dependencies
├── .env                  ← Environment variables (Supabase, JWT, Port)
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
│   │   └── supabase.js   ← Supabase client & shape mappers
│   ├── middleware/
│   │   └── authMiddleware.js ← JWT authentication
│   └── routes/
│       ├── authRoutes.js     ← Auth & PIN endpoints
│       ├── contactRoutes.js  ← Contacts CRUD, CSV import, PDF export
│       └── otherRoutes.js    ← Reminders, birthdays, analytics, tags
│
├── supabase/
│   └── schema.sql        ← PostgreSQL table definitions & indexes
│
└── scripts/
    └── migrate-mongo-to-supabase.js ← MongoDB to Supabase migration tool
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
| `npm run migrate:supabase` | Migrates MongoDB users & contacts to Supabase |

---

## ✨ Features
- ⚡ **Single-command runtime**: Concurrently run client + server with `npm run dev`
- 🗄️ **Supabase Database**: Fast PostgreSQL storage with JSONB support
- 🔐 **Authentication**: Secure bcrypt password hashing + JWT tokens + 4-digit PIN lock
- 🗺️ **Interactive Details**: Google Maps integration, quick actions, call/email links
- 🎂 **Birthday Tracker**: Upcoming 30-day birthday widget and reminders
- ⏰ **Smart Reminders**: Overdue alerts, call reminders, one-click completion
- 💬 **Follow-Up History**: Timestamped conversation logs
- 📊 **Analytics Dashboard**: Distribution charts and top contact metrics
- 📥 **CSV Import & 📄 PDF Export**: Fast batch import and printable directory export
- 🏷️ **Smart Organization**: Categories, custom tags, and full-text search
