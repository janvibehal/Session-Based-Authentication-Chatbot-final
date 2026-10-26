
const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatSession',
    required: true,
    index: true
  },

  role: {
    type: String,
    enum: ['user', 'bot'],
    required: true
  },

  content: {
    type: String,
    required: true,
    maxlength: 10000
  },

  timestamp: {
    type: Date,
    default: Date.now
  },

  expiresAt: {
    type: Date,
    required: true
  }
});

ChatMessageSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
