
const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const router = express.Router();

const ChatSession = require('../models/ChatSession');

const COOKIE_NAME = 'visitorId';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === 'production';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Identify each browser using an anonymous, HTTP-only cookie.
function getVisitorId(req, res) {
  let token = req.cookies?.[COOKIE_NAME];

  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    token = crypto.randomBytes(32).toString('hex');
  }

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: SEVEN_DAYS_MS,
    path: '/'
  });

  return hashToken(token);
}

function validObjectId(id) {
  return typeof id === 'string' &&
    mongoose.Types.ObjectId.isValid(id);
}

// List only this browser's active sessions.
router.get('/sessions', async (req, res) => {
  try {
    const ownerId = getVisitorId(req, res);

    const sessions = await ChatSession.find({
      ownerId,
      expiresAt: { $gt: new Date() }
    })
      .select('name createdAt lastActivityAt expiresAt')
      .sort({ lastActivityAt: -1 });

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error.message);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Create a new session for this browser.
router.post('/session', async (req, res) => {
  try {
    const ownerId = getVisitorId(req, res);
    const name = typeof req.body.name === 'string'
      ? req.body.name.trim().slice(0, 120)
      : '';

    if (!name) {
      return res.status(400).json({
        error: 'Session name is required'
      });
    }

    const now = new Date();

    const session = await ChatSession.create({
      name,
      ownerId,
      createdAt: now,
      lastActivityAt: now,
      expiresAt: new Date(now.getTime() + SEVEN_DAYS_MS)
    });

    const result = session.toObject();
    delete result.ownerId;

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating session:', error.message);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Verify ownership and renew the session's seven-day expiration.
async function getOwnedActiveSession(sessionId, ownerId) {
  if (!validObjectId(sessionId)) {
    return null;
  }

  const now = new Date();

  return ChatSession.findOneAndUpdate(
    {
      _id: sessionId,
      ownerId,
      expiresAt: { $gt: now }
    },
    {
      $set: {
        lastActivityAt: now,
        expiresAt: new Date(now.getTime() + SEVEN_DAYS_MS)
      }
    },
    { new: true }
  );
}

// Messages are no longer read from MongoDB.
// The frontend loads them from localStorage instead.
router.get('/messages/:sessionId', async (req, res) => {
  try {
    const ownerId = getVisitorId(req, res);

    const session = await getOwnedActiveSession(
      req.params.sessionId,
      ownerId
    );

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    return res.json([]);
  } catch (error) {
    console.error('Error checking session:', error.message);
    res.status(500).json({ error: 'Failed to check session' });
  }
});

// Generate a response without storing either message in MongoDB.
router.post('/message', async (req, res) => {
  try {
    const ownerId = getVisitorId(req, res);
    const { sessionId, content } = req.body;

    if (
      !validObjectId(sessionId) ||
      typeof content !== 'string' ||
      !content.trim()
    ) {
      return res.status(400).json({
        error: 'Valid sessionId and content are required'
      });
    }

    const session = await getOwnedActiveSession(
      sessionId,
      ownerId
    );

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    const cleanContent = content.trim().slice(0, 10000);
    const lower = cleanContent.toLowerCase();

    let reply = "Sorry, I didn't understand that.";

    if (lower.includes('hello') || lower.includes('hi')) {
      reply = 'Hi there! How can I help you today?';
    } else if (lower.includes('how are you')) {
      reply = "I'm just a bot, but I'm doing great!";
    } else if (lower.includes('bye')) {
      reply = 'Goodbye! Have a nice day!';
    } else if (lower.includes('help')) {
      reply = 'You can ask me basic questions like greetings or status.';
    }

    // No ChatMessage.create() calls: message content is not saved.
    return res.json({ reply });
  } catch (error) {
    console.error('Error processing message:', error.message);
    return res.status(500).json({
      error: 'Failed to generate a response'
    });
  }
});

// Delete a session belonging to this browser.
router.delete('/session/:sessionId', async (req, res) => {
  try {
    const ownerId = getVisitorId(req, res);

    if (!validObjectId(req.params.sessionId)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = await ChatSession.findOneAndDelete({
      _id: req.params.sessionId,
      ownerId,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session deleted' });
  } catch (error) {
    console.error('Error deleting session:', error.message);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

module.exports = router;
