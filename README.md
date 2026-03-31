# 📱 PhoneBook Pro — Vite Edition

This version uses **Vite** instead of Create React App.
- ✅ Works with Node.js 16, 18, 20, 21, 22
- ✅ No AJV/ajv errors
- ✅ Starts in under 1 second
- ✅ Hot reload is instant

---

## ⚠️ FIRST: Set up MongoDB (if not done yet)

Your backend needs a database. Use free MongoDB Atlas (no install):

1. Go to: **https://www.mongodb.com/atlas/database**
2. Sign up free → Create project → **Build a Database → Free M0**
3. Set username + password (e.g. user: `pankaj`, pass: `phonebook123`)
4. **Network Access** → Add IP Address → **"Allow Access from Anywhere"** (0.0.0.0/0)
5. **Database** → Connect → Drivers → Copy the connection string
6. Open `backend/.env` in Notepad and replace the MONGODB_URI line:
   ```
   MONGODB_URI=mongodb+srv://pankaj:phonebook123@cluster0.xxxxx.mongodb.net/phonebook
   ```

---

## 🚀 How to Run

### Terminal 1 — Backend
```powershell
cd backend
npm install
npm start
```
✅ You should see: `✅ MongoDB connected` and `🚀 Server: http://localhost:5000`

### Terminal 2 — Frontend (Vite)
```powershell
cd frontend
npm install
npm run dev
```
✅ Open browser at **http://localhost:3000**

---

## 📁 Structure

```
phonebook-pro/
├── backend/
│   ├── server.js
│   ├── .env              ← PUT YOUR MONGODB_URI HERE
│   ├── package.json
│   └── src/
│       ├── config/db.js
│       ├── middleware/authMiddleware.js
│       ├── models/User.js + Contact.js
│       └── routes/ (auth, contacts, reminders, birthdays, analytics, tags)
│
├── frontend/
│   ├── index.html        ← Vite entry point
│   ├── vite.config.js    ← Proxies /api → localhost:5000
│   ├── package.json      ← Modern deps, no react-scripts
│   └── src/
│       ├── main.jsx      ← React entry
│       ├── App.jsx
│       ├── index.css     ← Edit CSS variables here to change colours
│       ├── services/api.js
│       ├── context/AuthContext.jsx
│       ├── components/   ← All .jsx components
│       └── pages/        ← Login, Analytics, Reminders, Settings
│
└── package.json
```

---

## ✏️ Customise Colours

Open `frontend/src/index.css` and edit at the top:
```css
--accent:     #1c4e8a;   /* change blue to any colour */
--bg-sidebar: #18243a;   /* dark sidebar colour */
--gold:       #d97706;   /* gold highlights */
```

---

## ✅ Features
- 🔐 Login / Register with JWT
- 🗺️ Google Maps embed in contact detail
- 🎂 Birthday notifications (in-app + browser push)
- ⏰ Reminders with overdue warnings
- 💬 Follow-up notes
- 📊 Analytics dashboard
- 📥 CSV Import / 📄 PDF Export
- 🔒 PIN-protected private contacts
- ⭐ Favourites, 🏷️ Tags, 🔍 Smart search
