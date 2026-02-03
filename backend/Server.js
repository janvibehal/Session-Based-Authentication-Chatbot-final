const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const chatRoutes = require('./routes/chat');
require('dotenv').config();

const app = express();

// 🔴 NEVER hardcode port in production
const PORT = process.env.PORT || 6001;

// 🔴 NEVER hardcode MongoDB localhost in production
const MONGO_URI = process.env.MONGO_URI;

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use('/api/chat', chatRoutes);

// 🔴 Fail fast if env is missing
if (!MONGO_URI) {
  console.error('❌ MONGO_URI not defined');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
