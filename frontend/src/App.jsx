
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ChatWindow from './components/ChatWindow';
import SessionList from './components/SessionList';
import './index.css';

// Set REACT_APP_API_URL to the backend origin only.
// Example: https://your-api.onrender.com
const API_ORIGIN = (
  process.env.REACT_APP_API_URL || 'http://localhost:6001'
).replace(/\/$/, '');

const api = axios.create({
  baseURL: `${API_ORIGIN}/api/chat`,
  withCredentials: true
});

const App = () => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await api.get('/sessions');
      setSessions(res.data);

      setCurrentSession((previous) =>
        previous
          ? res.data.find((session) => session._id === previous._id) || null
          : null
      );
    } catch (error) {
      console.error(
        'Error fetching sessions:',
        error.response?.status,
        error.response?.data || error.message
      );
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = async (name) => {
    if (!name?.trim()) return;

    try {
      const res = await api.post('/session', {
        name: name.trim()
      });

      setSessions((previous) => [...previous, res.data]);
      setCurrentSession(res.data);
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error(
        'Error creating session:',
        error.response?.status,
        error.response?.data || error.message
      );
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await api.delete(`/session/${sessionId}`);

      setSessions((previous) =>
        previous.filter((session) => session._id !== sessionId)
      );

      setCurrentSession((previous) =>
        previous?._id === sessionId ? null : previous
      );
    } catch (error) {
      console.error(
        'Error deleting session:',
        error.response?.status,
        error.response?.data || error.message
      );
    }
  };

  const setSession = (session) => {
    setCurrentSession(session);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="app-container">
      <button
        className={`hamburger-btn ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div
        className={`mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <div className={`session-list ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <SessionList
          sessions={sessions}
          createSession={createSession}
          deleteSession={deleteSession}
          setSession={setSession}
          currentSessionId={currentSession?._id}
        />
      </div>

      <ChatWindow session={currentSession} />
    </div>
  );
};

export default App;
