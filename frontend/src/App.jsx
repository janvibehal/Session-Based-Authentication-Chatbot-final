import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ChatWindow from './components/ChatWindow';
import SessionList from './components/SessionList';
import './index.css';

const api = axios.create({
  baseURL: 'http://localhost:6001/api/chat',
  withCredentials: true
});

// ONE source of truth for backend URL
const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:6001';

const App = () => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:6001/api/chat/sessions');
      setSessions(res.data);

      setCurrentSession((previous) => {
        if (!previous) return null;

        return res.data.find((s) => s._id === previous._id) || null;
      });
    } catch (err) {
      console.error(
        'Error fetching sessions:',
        err.response?.status,
        err.response?.data || err.message
      );
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = async (name) => {
    if (!name?.trim()) return;

    try {
      const res = await axios.post('http://localhost:6001/api/chat/session', { name }, { withCredentials: true });
      setSessions([...sessions, res.data]);
      setCurrentSession(res.data);
      setIsMobileMenuOpen(false);
    } catch (err) {
      console.error(
        'Error creating session:',
        err.response?.status,
        err.response?.data || err.message
      );
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await axios.delete(`http://localhost:6001/api/chat/session/${sessionId}`);
      setSessions(sessions.filter((s) => s._id !== sessionId));
      if (currentSession && currentSession._id === sessionId) {
        setCurrentSession(null);
      }
    } catch (err) {
      console.error(
        'Error deleting session:',
        err.response?.status,
        err.response?.data || err.message
      );
    }
  };

  const setSession = (session) => {
    setCurrentSession(session);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="app-container">
      {/*Only visible on mobile*/}
      <button 
        className={`hamburger-btn ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile Overlay */}
      <div className={`mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>

      {/* Session List - Desktop always visible, Mobile sliding panel */}
      <div className={`session-list ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <SessionList
          sessions={sessions}
          createSession={createSession}
          deleteSession={deleteSession}
          setSession={setSession}
          currentSessionId={currentSession?._id}
        />
      </div>

      {/* Chat window */}
      <ChatWindow session={currentSession} />
    </div>
  );
};

export default App;
