require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const connectDB = require('./src/config/db');

const authRoutes    = require('./src/routes/authRoutes');
const contactRoutes = require('./src/routes/contactRoutes');
const { reminderRouter, birthdayRouter, analyticsRouter, tagRouter } = require('./src/routes/otherRoutes');

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://callista-sigma.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

app.use('/api/auth',      authRoutes);
app.use('/api/contacts',  contactRoutes);
app.use('/api/reminders', reminderRouter);
app.use('/api/birthdays', birthdayRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/tags',      tagRouter);

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log('🚀 Server: http://localhost:' + PORT));
});
