
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_ORIGIN = (
  process.env.REACT_APP_API_URL || 'http://localhost:6001'
).replace(/\/$/, '');

const api = axios.create({
  baseURL: `${API_ORIGIN}/api/chat`,
  withCredentials: true
});

// Seven days of inactivity.
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function storageKey(sessionId) {
  return `chat_messages_${sessionId}`;
}

function readMessages(sessionId) {
  try {
    const key = storageKey(sessionId);
    const saved = localStorage.getItem(key);

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.removeItem(key);
      return [];
    }

    const timestamps = parsed.map((message) =>
      Date.parse(message.timestamp)
    );

    if (timestamps.some((timestamp) => !Number.isFinite(timestamp))) {
      localStorage.removeItem(key);
      return [];
    }

    const latestTimestamp = Math.max(...timestamps);

    if (Date.now() - latestTimestamp >= SESSION_EXPIRY_MS) {
      localStorage.removeItem(key);
      return [];
    }

    return parsed;
  } catch (error) {
    console.error('Could not read local messages:', error);
    return [];
  }
}

const ChatWindow = ({ session, onSessionExpired }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const sessionIdRef = useRef(session?._id);

  // Keep track of the currently selected session.
  useEffect(() => {
    sessionIdRef.current = session?._id;

    if (!session?._id) {
      setMessages([]);
      return;
    }

    setMessages(readMessages(session._id));
    inputRef.current?.focus();
  }, [session?._id]);

  // Check expiration independently for the selected session.
  useEffect(() => {
    if (!session?._id) return;

    const sessionId = session._id;

    const interval = setInterval(() => {
      if (sessionIdRef.current !== sessionId) return;

      const saved = localStorage.getItem(storageKey(sessionId));

      if (!saved) {
        setMessages([]);
        return;
      }

      const updatedMessages = readMessages(sessionId);
      setMessages(updatedMessages);

      if (updatedMessages.length === 0) {
        onSessionExpired?.();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [session?._id, onSessionExpired]);

  // Keep the latest messages visible.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages, loading]);

  function saveMessages(sessionId, updatedMessages) {
    try {
      localStorage.setItem(
        storageKey(sessionId),
        JSON.stringify(updatedMessages)
      );

      setMessages(updatedMessages);
      return true;
    } catch (error) {
      console.error('Could not save local messages:', error);
      alert('Could not save this conversation in browser storage.');
      return false;
    }
  }

  async function sendMessage() {
    const content = input.trim();
    const sessionId = session?._id;

    if (!content || !sessionId || loading) return;

    const userMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    // Use any unexpired messages already stored for this session.
    const existingMessages = readMessages(sessionId);
    const updatedMessages = [...existingMessages, userMessage];

    if (!saveMessages(sessionId, updatedMessages)) return;

    setInput('');
    setLoading(true);

    try {
      const [response] = await Promise.all([
  api.post('/message', {
    sessionId,
    content
  }),
  new Promise((resolve) => setTimeout(resolve, 800))
]);

      const botMessage = {
        id: `${Date.now()}-bot`,
        role: 'bot',
        content: response.data.reply,
        timestamp: new Date().toISOString()
      };

      // Do not update a different session if the user switched chats.
      if (sessionIdRef.current === sessionId) {
        saveMessages(sessionId, [...updatedMessages, botMessage]);
      } else {
        // Still save the response to the session that sent the request.
        localStorage.setItem(
          storageKey(sessionId),
          JSON.stringify([...updatedMessages, botMessage])
        );
      }
    } catch (error) {
      console.error(
        'Could not get a bot reply:',
        error.response?.data || error.message
      );

      if (error.response?.status === 404) {
        localStorage.removeItem(storageKey(sessionId));

        if (sessionIdRef.current === sessionId) {
          setMessages([]);
          onSessionExpired?.();
        }
      } else {
        const errorMessage = {
          id: `${Date.now()}-error`,
          role: 'bot',
          content: 'Sorry, I could not get a response. Please try again.',
          timestamp: new Date().toISOString()
        };

        const messagesWithError = [...updatedMessages, errorMessage];

        if (sessionIdRef.current === sessionId) {
          saveMessages(sessionId, messagesWithError);
        } else {
          localStorage.setItem(
            storageKey(sessionId),
            JSON.stringify(messagesWithError)
          );
        }
      }
    } finally {
      setLoading(false);

      // Return focus to the input after React re-enables it.
      requestAnimationFrame(() => {
        if (sessionIdRef.current === sessionId) {
          inputRef.current?.focus();
        }
      });
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="chat-window">
      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.role}`}
          >
            <strong>
              {message.role === 'user' ? 'You' : 'Bot'}:
            </strong>{' '}
            {message.content}
          </div>
        ))}

        
        {loading && (
          <div className="message bot typing-indicator">
          <span className="typing-dots">
          <span className="typing-dot"></span>
          <span className="typing-dot"></span>
          <span className="typing-dot"></span>
          </span>
          </div>
        )}


        <div ref={bottomRef} />
      </div>

      {session ? (
        <div className="input-area">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />

          <button
            type="button"
            className="send-button"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            title="Send message"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 2 11 13" />
              <path d="m22 2-7 20-4-9-9-4 20-7Z" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="empty-chat">
          <p>Please select or create a session</p>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
