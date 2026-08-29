/**
 * Vercel Serverless Function entrypoint.
 *
 * Vercel looks for files inside /api and turns them into serverless functions.
 * This file imports the Express app from server/server.js and exports it as
 * the default handler — Vercel calls it for every request matching /api/*.
 *
 * The vercel.json rewrite rule sends all /api/:path* traffic here.
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import authRoutes    from '../server/routes/authRoutes.js';
import contactRoutes from '../server/routes/contactRoutes.js';
import { reminderRouter, birthdayRouter, analyticsRouter, tagRouter } from '../server/routes/otherRoutes.js';

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    const allowed =
      origin === 'http://localhost:3000' ||
      origin === 'http://localhost:5173' ||
      // Production domain
      origin === 'https://callista-sigma.vercel.app' ||
      // All Vercel preview deployment URLs
      /^https:\/\/callista-.*\.vercel\.app$/.test(origin);
    callback(allowed ? null : new Error('CORS: origin not allowed'), allowed);
  },
  credentials: true,
}));

app.use(express.json());

// Mount all API routes — paths are relative to /api because of the rewrite,
// but the Express router still sees the full path so we keep the /api prefix.
app.use('/api/auth',      authRoutes);
app.use('/api/contacts',  contactRoutes);
app.use('/api/reminders', reminderRouter);
app.use('/api/birthdays', birthdayRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/tags',      tagRouter);

// Catch-all: anything that falls through returns 404 JSON (not the SPA).
// The SPA is served from public/ by Vercel's CDN, not by Express.
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

export default app;
