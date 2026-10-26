const mongoose = require('mongoose');

const ChatSessionSchema = new mongoose.Schema({
  name: { type: String, trim: true, maxlength: 120, default: 'New chat' },

  // SHA-256 hash of the anonymous visitor's random cookie token.
  ownerId: { type: String, required: true, index: true },

  createdAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

// MongoDB removes expired sessions asynchronously.
// API routes also check expiresAt.
ChatSessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports = mongoose.model('ChatSession', ChatSessionSchema);