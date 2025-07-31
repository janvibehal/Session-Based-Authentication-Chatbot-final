import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ChatWindow = ({ session }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const bottomRef = useRef(null); // Add scroll ref

  useEffect(() => {
    if (!session?._id) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`http://localhost:6001/api/chat/messages/${session._id}`);
        setMessages(res.data || []);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    };

    fetchMessages();
  }, [session]);

  // Focus input and scroll to bottom when messages or session change
  useEffect(() => {
    if (session?._id && inputRef.current) {
      inputRef.current.focus();
    }
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, session]);

  const sendMessage = async () => {
    if (!input.trim() || !session?._id) return;

    setLoading(true);
    const userMessage = { role: 'user', content: input };

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
      console.error('Failed to send message:', err);
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.content}
          </div>
        ))}
        <div ref={bottomRef} /> {/* Scroll target */}
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
          <button onClick={sendMessage} disabled={loading}>
            {loading ? '...' : ''}
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
