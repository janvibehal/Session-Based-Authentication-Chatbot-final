# MERN Chatbot App

A session-based chatbot built with the MERN stack.
Working demo:- https://drive.google.com/file/d/1Qh6Ch6lvr4j31xs5jY9iGMIyZfHmN1U6/view?usp=sharing

# iChat — Session-Based Anonymous Chatbot

Take a look:- https://session-based-authentication-chatbo.vercel.app/

## Overview

iChat is a web-based chatbot application that allows users to interact without creating an account or logging in. It uses anonymous, browser-specific sessions to keep conversations separate between users while providing a simple and responsive chat interface.

The application is built using the MERN stack. Session metadata is stored in MongoDB Atlas, while chat messages are stored locally in the browser using `localStorage`. This design allows conversations to persist across page refreshes without storing new message content in the database.

## Features

- **Anonymous access:** Chat without registration or login.
- **Browser-specific sessions:** Each browser maintains its own anonymous identity and conversations.
- **Session management:** Create, select, and delete chat sessions.
- **Local message storage:** Messages are saved in browser `localStorage` rather than MongoDB.
- **Refresh persistence:** Conversations remain available after refreshing the page in the same browser.
- **Session isolation:** Backend ownership checks help prevent one browser from accessing another browser's sessions.
- **Automatic expiration:** Inactive sessions and locally stored conversations can expire according to the configured timeout.
- **Responsive interface:** A clean chat interface with session navigation and message input.
- **Cloud deployment:** Frontend hosted on Vercel, backend hosted on Render, and session metadata stored in MongoDB Atlas.

## Tech Stack

**Frontend**
- React.js
- JavaScript
- CSS
- Axios
- Browser `localStorage`

**Backend**
- Node.js
- Express.js
- MongoDB and Mongoose
- Cookie-based anonymous identification
- CORS and cookie-parser

**Deployment**
- Vercel — Frontend
- Render — Backend
- MongoDB Atlas — Database

## How It Works

1. A user opens the chatbot without signing in.
2. The backend assigns an anonymous browser identity using an HTTP-only cookie.
3. The backend associates sessions with a hashed visitor identifier and verifies ownership when sessions are accessed.
4. Session metadata is stored in MongoDB Atlas.
5. When a user sends a message, the backend generates a response without saving the message content to MongoDB.
6. The browser stores the conversation in `localStorage`, allowing it to persist across refreshes.
7. Inactive sessions and their locally stored messages are removed according to the configured expiration logic.

## Privacy and Data Storage

The application is designed to minimize server-side retention of conversation content. New messages are stored in the browser rather than in MongoDB. MongoDB stores session metadata, including session identifiers, names, ownership hashes, and timestamps.

Browser storage is specific to the browser profile and website origin. Clearing site data can make locally stored conversations inaccessible. Browser `localStorage` is not encrypted by default, and messages are still transmitted to the backend to generate responses.

## Getting Started

1. Clone the repository.
2. Install the backend and frontend dependencies.
3. Configure the required environment variables for MongoDB Atlas, the backend, and the frontend API URL.
4. Start the backend and frontend development servers.
5. Open the frontend in your browser and create a session to begin chatting.

## Future Improvements

- Integrate an AI-powered conversational model.
- Add configurable session expiration and cleanup.
- Improve error handling and loading states.
- Strengthen production network access restrictions and security controls.
- Add optional conversation export and recovery features.

## Purpose

The goal of iChat is to demonstrate anonymous session management, browser-level conversation isolation, client-side message persistence, and full-stack web application deployment without requiring user registration.


## 🚀 How to Run
### 0. first change both package_frontend and backend files name to package.json and put them in their respective folders according to the file structure which is provided at the end of the readme file, firstly open the mongo compass on ur system and click on connect, run the command mongod 
### 1. Backend:- open other terminal and run the following commands
```bash
cd backend
npm install cookie-parser
npm run dev

### 2. frontend:- open another terminal and run the following commands
```bash
cd frontend
npm install js-cookie
npm start

## 3. folder structure
Session-Based Chatbot/
├── backend/
│   ├── models/
│   │   └── ChatSession.js      # Mongoose schema for chat sessions
│   ├── routes/
│   │   └── chat.js             # Express routes to handle chat/session API
│   ├── node_modules/           # Backend dependencies
│   ├── .env                    # Environment config (PORT, MONGO_URI, etc.)
│   ├── package.json            # Backend dependency list and scripts
│   ├── package-lock.json       # Backend lockfile for dependencies
│   └── Server.js               # Entry point - sets up Express server
│
├── frontend/
│   ├── node_modules/           # Frontend dependencies
│   ├── public/
│   │   └── index.html          # Base HTML template
│   ├── src/
│   │   ├── App.jsx             # Root React component
│   │   ├── index.css           # Global CSS styling
│   │   ├── index.js            # React entry point rendering App.jsx
│   │   └── components/
│   │       ├── ChatWindow.jsx  # Component for chat UI and messages
│   │       └── SessionList.jsx # Component listing previous chat sessions
│   ├── package.json            # Frontend dependency list and scripts
│   └── package-lock.json       # Frontend lockfile for dependencies
│
├── .gitignore                  # Specifies files to ignore in git commits
└── README.md                   # Project documentation
