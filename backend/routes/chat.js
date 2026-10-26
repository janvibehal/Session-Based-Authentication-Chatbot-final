const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');

const router = express.Router();

const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');

const COOKIE_NAME = 'visitorId';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === 'production';

function hashToken(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

// A random anonymous browser identity.
// No login or personal information required.
function getVisitorId(req, res) {
  let token = req.cookies && req.cookies[COOKIE_NAME];

  if (
    !token ||
    typeof token !== 'string' ||
    token.length < 32 ||
    token.length > 200
  ) {
    token = crypto.randomBytes(32).toString('hex');
  }

  // Renew the cookie on activity.
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
  return mongoose.Types.ObjectId.isValid(id);
}

// Fetch only sessions owned by the current visitor.
router.get('/sessions', async (req, res) => {
  try {
    const ownerId = getVisitorId(req, res);
    const now = new Date();

    const sessions = await ChatSession.find({
      ownerId,
      expiresAt: { $gt: now }
    })
      .select('name createdAt lastActivityAt expiresAt')
      .sort({ lastActivityAt: -1 });

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);

    res.status(500).json({
      error: 'Failed to fetch sessions'
    });
  }
});

// Create a new chat session for the current visitor.
router.post('/session', async (req, res) => {
  try {
    const ownerId = getVisitorId(req, res);

    const name =
      typeof req.body.name === 'string'
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

    const safeSession = session.toObject();
    delete safeSession.ownerId;

    res.status(201).json(safeSession);
  } catch (error) {
    console.error('Error creating session:', error);

    res.status(500).json({
      error: 'Failed to create session'
    });
  }
});

// Verify ownership and extend inactivity expiry.
async function getOwnedActiveSession(sessionId, ownerId) {
  if (!validObjectId(sessionId)) {
    return null;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + SEVEN_DAYS_MS);

  const session = await ChatSession.findOneAndUpdate(
    {
      _id: sessionId,
      ownerId,
      expiresAt: { $gt: now }
    },
    {
      $set: {
        lastActivityAt: now,
        expiresAt
      }
    },
    { new: true }
  );

  if (session) {
    await ChatMessage.updateMany(
      { sessionId: session._id },
      { $set: { expiresAt } }
    );
  }

  return session;
}

// Fetch messages only from an owned session.
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

    const messages = await ChatMessage.find({
      sessionId: session._id
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);

    res.status(500).json({
      error: 'Failed to fetch messages'
    });
  }
});

// Save a user message and generate a bot response.
router.post('/message', async (req, res) => {
  try {
    const ownerId = getVisitorId(req, res);
    const { sessionId, content } = req.body;

    if (
      !sessionId ||
      typeof content !== 'string' ||
      !content.trim()
    ) {
      return res.status(400).json({
        error: 'Valid sessionId and content are required'
      });
    }

    const cleanContent = content.trim().slice(0, 10000);

    const session = await getOwnedActiveSession(
      sessionId,
      ownerId
    );

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    const expiresAt = session.expiresAt;

    await ChatMessage.create({
      sessionId: session._id,
      role: 'user',
      content: cleanContent,
      expiresAt
    });

    // Rule-based chatbot replies.
    let reply = 'Sorry, I didn’t understand that.';

    const lower = cleanContent.toLowerCase();

    if (lower.includes('hello')) {
      reply = 'Hi there! How can I help you today?';
    } else if (lower.includes('how are you')) {
      reply = 'I’m just a bot, but I’m doing great!';
    } else if (lower.includes('bye')) {
      reply = 'Goodbye! Have a nice day!';
    } else if (lower.includes('help')) {
      reply = 'You can ask me basic questions like greetings or status.';
    }

    const botMessage = await ChatMessage.create({
      sessionId: session._id,
      role: 'bot',
      content: reply,
      expiresAt
    });

    setTimeout(() => {
      res.status(200).json(botMessage);
    }, 1500);

  } catch (error) {
    console.error('Error sending message:', error);

    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to send message'
      });
    }
  }
});

// Delete only a session owned by the current visitor.
router.delete('/session/:sessionId', async (req, res) => {
  try {
    const ownerId = getVisitorId(req, res);

    if (!validObjectId(req.params.sessionId)) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    const session = await ChatSession.findOneAndDelete({
      _id: req.params.sessionId,
      ownerId,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    await ChatMessage.deleteMany({
      sessionId: session._id
    });

    res.json({
      message: 'Session and messages deleted'
    });

  } catch (error) {
    console.error('Error deleting session:', error);

    res.status(500).json({
      error: 'Failed to delete session'
    });
  }
});

module.exports = router;