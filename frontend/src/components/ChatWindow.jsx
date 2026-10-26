import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:6001/api/chat';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

// Single source of truth for backend URL
const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:6001';

const ChatWindow = ({ session }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!session?._id) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`http://localhost:6001/api/chat/messages/${session._id}`);
        setMessages(res.data || []);
      } catch (err) {
        console.error(
          'Failed to fetch messages:',
          err.response?.status,
          err.response?.data || err.message
        );
      }
    };

    fetchMessages();

    return () => {
      cancelled = true;
    };
  }, [session?._id]);

  useEffect(() => {
    inputRef.current?.focus();
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, session?._id]);

  const sendMessage = async () => {
    const content = input.trim();

    if (!content || !session?._id || loading) return;

    setLoading(true);

    try {
      await axios.post('http://localhost:6001/api/chat/message', {
        sessionId: session._id,
        ...userMessage
      });

      setInput('');
      setTimeout(async () => {
        const res = await axios.get(`http://localhost:6001/api/chat/messages/${session._id}`);
        setMessages(res.data || []);
        setLoading(false);
      }, 1500);
    } catch (err) {
      console.error(
        'Failed to send message:',
        err.response?.status,
        err.response?.data || err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="chat-window">
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {session ? (
        <div className="input-area">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()}>
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