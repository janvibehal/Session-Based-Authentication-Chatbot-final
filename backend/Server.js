
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 6001;
const MONGO_URI = process.env.MONGO_URI;

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'https://session-based-authentication-chatbo.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests without an Origin header, e.g. curl.
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(
      new Error(`CORS not allowed from this origin: ${origin}`)
    );
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Chatbot backend is running' });
});

app.use('/api/chat', chatRoutes);

if (!MONGO_URI) {
  console.error('MONGO_URI not defined');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
