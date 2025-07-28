import React, { useState } from 'react';
import '../index.css';

function SessionList({ sessions, createSession, deleteSession, setSession, currentSessionId }) {
  const [sessionName, setSessionName] = useState('');

  const handleCreate = () => {
    if (sessionName.trim()) {
      createSession(sessionName);
      setSessionName('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
  };

  return (
    <div className="session-list-content">
      <h2>Chatbot</h2>

      <div className="session-input">
        <input
          type="text"
          placeholder="New session name"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button onClick={handleCreate}>Create</button>
      </div>

      <div className="session-items">
        {sessions.map((s) => (
          <div
            key={s._id}
            className={`session-item ${currentSessionId === s._id ? 'active' : ''}`}
            onClick={() => setSession(s)}
          >
            <span>{s.name}</span>
            <span
              className="delete"
              title="Delete session"
              onClick={(e) => {
                e.stopPropagation();
                deleteSession(s._id);
              }}
            >
              ✖
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SessionList;