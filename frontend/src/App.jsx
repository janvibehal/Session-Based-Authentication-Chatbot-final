import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import ChatWindow from './components/ChatWindow';
import SessionList from './components/SessionList';
import './index.css';

const App = () => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await axios.get('https://session-based-authentication-chatbot.onrender.com/');
      setSessions(res.data);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  };

  const createSession = async (name) => {
    if (!name) return;

    try {
      const res = await axios.post('http://localhost:6001/api/chat/session', { name }, { withCredentials: true });
      setSessions([...sessions, res.data]);
      setCurrentSession(res.data);
      setIsMobileMenuOpen(false); // Close menu after creating session
    } catch (err) {
      console.error('Error creating session:', err);
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
      console.error('Error deleting session:', err);
    }
  };

  const setSession = (session) => {
    setCurrentSession(session);
    setIsMobileMenuOpen(false); // Close menu when session is selected
  };

  return (
    <div className="app-container">
      {/* Hamburger Button - Only visible on mobile */}
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

      <ChatWindow session={currentSession} />
    </div>
  );
};

export default App;