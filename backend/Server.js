const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const chatRoutes = require('./routes/chat');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 6001;

app.use(cors({
  origin: 'https://session-based-authentication-chatbot.vercel.app', // your frontend
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key', // better to use env
  resave: false,
  saveUninitialized: true, // ✅ allow cookie creation even before session is modified
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI || 'mongodb+srv://janvibehal2:UeZdGO2k6YePMxs7@chatbot.0z1myak.mongodb.net/?retryWrites=true&w=majority&appName=chatbot'
  }),
  cookie: {
    httpOnly: true,
    secure: true, // ✅ needed for cross-origin HTTPS
    sameSite: 'none', // ✅ required for cross-site cookies (Vercel ↔ Render)
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Optional: A quick test to confirm session creation
app.post('/api/chat/session', (req, res) => {
  req.session.user = 'dummy'; // ✅ force session creation
  req.session.save(() => {
    console.log("✅ Session created with ID:", req.sessionID);
    res.status(200).json({ sessionId: req.sessionID });
  });
});

app.use('/api/chat', chatRoutes);

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://janvibehal2:UeZdGO2k6YePMxs7@chatbot.0z1myak.mongodb.net/?retryWrites=true&w=majority&appName=chatbot', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});
