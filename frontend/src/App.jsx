
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ChatWindow from './components/ChatWindow';
import SessionList from './components/SessionList';
import './index.css';

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
      const activeSessions = res.data || [];
      const activeIds = new Set(
        activeSessions.map((session) => session._id)
      );

      // Remove browser-stored messages for sessions no longer active.
      Object.keys(localStorage).forEach((key) => {
        if (!key.startsWith('chat_messages_')) return;

        const sessionId = key.slice('chat_messages_'.length);

        if (!activeIds.has(sessionId)) {
          localStorage.removeItem(key);
        }
      });

      setSessions(activeSessions);

      setCurrentSession((previous) => {
        if (!previous) return null;

        return activeSessions.find(
          (session) => session._id === previous._id
        ) || null;
      });
    } catch (error) {
      // Keep the current UI if the network temporarily fails.
      console.error(
        'Error fetching sessions:',
        error.response?.data || error.message
      );
    }
  }, []);

  // Fetch on startup and poll so expired tabs disappear.
  useEffect(() => {
    fetchSessions();

    const interval = setInterval(fetchSessions, 5000);

    return () => clearInterval(interval);
  }, [fetchSessions]);

  const createSession = async (name) => {
    if (!name?.trim()) return;

    try {
      const res = await api.post('/session', {
        name: name.trim()
      });

      setSessions((previous) => [
        res.data,
        ...previous.filter((item) => item._id !== res.data._id)
      ]);

      setCurrentSession(res.data);
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error(
        'Error creating session:',
        error.response?.data || error.message
      );
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await api.delete(`/session/${sessionId}`);

      localStorage.removeItem(`chat_messages_${sessionId}`);

      setSessions((previous) =>
        previous.filter((session) => session._id !== sessionId)
      );

      setCurrentSession((previous) =>
        previous?._id === sessionId ? null : previous
      );
    } catch (error) {
      console.error(
        'Error deleting session:',
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

      <ChatWindow
        session={currentSession}
        onSessionExpired={fetchSessions}
      />
    </div>
  );
};

export default App;
