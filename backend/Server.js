const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const chatRoutes = require('./routes/chat');
require('dotenv').config();

const app = express();

// ✅ Port from env (Render compatible)
const PORT = process.env.PORT || 6001;

// ✅ Mongo URI from env
const MONGO_URI = process.env.MONGO_URI;

// ✅ Allow BOTH local + deployed frontend
const allowedOrigins = [
  process.env.CLIENT_URL,          // production frontend
  'http://localhost:3000',           // local frontend
  "https://session-based-authentication-chatbo.vercel.app",
  "https://vercel.com/janvibehals-projects/session-based-authentication-chatbot-final/ZJ5uqYsTSUDrv6YeAGte4XBeQa1k"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (Postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS not allowed from this origin'), false);
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use('/api/chat', chatRoutes);

// ❌ Fail fast if DB env missing
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
