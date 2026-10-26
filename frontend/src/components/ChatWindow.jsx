
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_ORIGIN = (
  process.env.REACT_APP_API_URL || 'http://localhost:6001'
).replace(/\/$/, '');

const api = axios.create({
  baseURL: `${API_ORIGIN}/api/chat`,
  withCredentials: true
});

const ChatWindow = ({ session }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    if (!session?._id) {
      setMessages([]);
      return undefined;
    }

    (async () => {
      try {
        const res = await api.get(`/messages/${session._id}`);

        if (!cancelled) {
          setMessages(res.data || []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            'Failed to fetch messages:',
            error.response?.status,
            error.response?.data || error.message
          );
          setMessages([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?._id]);

  useEffect(() => {
    if (session?._id) {
      inputRef.current?.focus();
    }

    bottomRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages, session?._id]);

  const sendMessage = async () => {
    const content = input.trim();

    if (!content || !session?._id || loading) return;

    setLoading(true);

    try {
      await api.post('/message', {
        sessionId: session._id,
        content
      });

      setInput('');

      const res = await api.get(`/messages/${session._id}`);
      setMessages(res.data || []);
    } catch (error) {
      console.error(
        'Failed to send message:',
        error.response?.status,
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={message._id || index}
            className={`message ${message.role}`}
          >
            <strong>
              {message.role === 'user' ? 'You' : 'Bot'}:
            </strong>{' '}
            {message.content}
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
