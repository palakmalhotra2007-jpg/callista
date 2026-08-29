import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import { reminderRouter, birthdayRouter, analyticsRouter, tagRouter } from './routes/otherRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://callista-sigma.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());

// API Routes
app.use('/api/auth',      authRoutes);
app.use('/api/contacts',  contactRoutes);
app.use('/api/reminders', reminderRouter);
app.use('/api/birthdays', birthdayRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/tags',      tagRouter);

// Serve static frontend build in production if available
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'), err => {
    if (err) next();
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Callista Server running at: http://localhost:${PORT}`);
});
