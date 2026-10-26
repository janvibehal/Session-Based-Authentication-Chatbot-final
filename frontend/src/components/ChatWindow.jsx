
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_ORIGIN = (
  process.env.REACT_APP_API_URL || 'http://localhost:6001'
).replace(/\/$/, '');

const api = axios.create({
  baseURL: `${API_ORIGIN}/api/chat`,
  withCredentials: true
});

function storageKey(sessionId) {
  return `chat_messages_${sessionId}`;
}

function readMessages(sessionId) {
  try {
    const saved = localStorage.getItem(storageKey(sessionId));

    if (!saved) return [];

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Could not read saved messages:', error);
    return [];
  }
}

const ChatWindow = ({ session }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  // Load messages from this browser, not MongoDB.
  useEffect(() => {
    if (!session?._id) {
      setMessages([]);
      return;
    }

    setMessages(readMessages(session._id));
    inputRef.current?.focus();
  }, [session?._id]);

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
      console.error('Could not save messages in browser:', error);

      alert(
        'Could not save this conversation in your browser. ' +
        'Check your browser storage settings or available space.'
      );

      return false;
    }
  }

  async function sendMessage() {
    const content = input.trim();

    if (!content || !session?._id || loading) return;

    const sessionId = session._id;

    const userMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMessage];

    // Save the user's message locally before making the request.
    if (!saveMessages(sessionId, updatedMessages)) {
      return;
    }

    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/message', {
        sessionId,
        content
      });

      const botMessage = {
        id: `${Date.now()}-bot`,
        role: 'bot',
        content: response.data.reply,
        timestamp: new Date().toISOString()
      };

      saveMessages(sessionId, [...updatedMessages, botMessage]);
    } catch (error) {
      console.error(
        'Failed to get bot reply:',
        error.response?.data || error.message
      );

      // Keep the user's message locally if the API fails.
      const errorMessage = {
        id: `${Date.now()}-error`,
        role: 'bot',
        content: 'Sorry, I could not get a response. Please try again.',
        timestamp: new Date().toISOString()
      };

      saveMessages(sessionId, [...updatedMessages, errorMessage]);
    } finally {
      setLoading(false);
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
          <div className="message bot">Bot is typing...</div>
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
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            {loading ? 'Sending...' : 'Send'}
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
