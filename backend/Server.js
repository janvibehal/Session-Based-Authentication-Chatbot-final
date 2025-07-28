const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const chatRoutes = require('./routes/chat');
require('dotenv').config();

const app = express();
const PORT = 6001;

app.use(cors({
  origin: 'https://session-based-authentication-chatbo.vercel.app',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: 'mongodb+srv://janvibehal2:UeZdGO2k6YePMxs7@chatbot.0z1myak.mongodb.net/?retryWrites=true&w=majority&appName=chatbot'
  }),
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.get('/', (req, res) => {
  res.send('Backend is running!');
});
app.use('/api/chat', chatRoutes);

mongoose.connect('mongodb+srv://janvibehal2:UeZdGO2k6YePMxs7@chatbot.0z1myak.mongodb.net/?retryWrites=true&w=majority&appName=chatbot', {
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
