import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import ChatWindow from './components/ChatWindow';
import SessionList from './components/SessionList';
import './index.css';

// ONE source of truth for backend URL
const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:6001';

const App = () => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/chat/sessions`,
        { withCredentials: true }
      );
      setSessions(res.data);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  };

  const createSession = async (name) => {
    if (!name) return;

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/chat/session`,
        { name },
        { withCredentials: true }
      );
      setSessions([...sessions, res.data]);
      setCurrentSession(res.data);
      setIsMobileMenuOpen(false);
    } catch (err) {
      console.error('Error creating session:', err);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/chat/session/${sessionId}`,
        { withCredentials: true }
      );
      setSessions(sessions.filter((s) => s._id !== sessionId));
      if (currentSession?._id === sessionId) {
        setCurrentSession(null);
      }
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  const setSession = (session) => {
    setCurrentSession(session);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="app-container">
      {/* Mobile hamburger */}
      <button
        className={`hamburger-btn ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile overlay */}
      <div
        className={`mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* Session list */}
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
