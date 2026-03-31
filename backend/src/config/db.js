// 🔥 FIX DNS ISSUE (VERY IMPORTANT)
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const mongoose = require('mongoose');

const connectDB = async () => {
  // ✅ Match your .env (use MONGO_URI)
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/phonebook';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('\n❌ MongoDB Connection Failed!\n');
    console.error('─────────────────────────────────────────────');

    if (uri.includes('localhost')) {
      console.error('MongoDB is not running on your PC.\n');
      console.error('Use MongoDB Atlas instead (recommended).');
    } else {
      console.error('Error: ' + err.message);
    }

    console.error('─────────────────────────────────────────────\n');
    process.exit(1);
  }
};

module.exports = connectDB;