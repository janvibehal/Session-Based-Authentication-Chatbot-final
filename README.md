# MERN Chatbot App

A session-based chatbot built with the MERN stack.
Working demo:- https://drive.google.com/file/d/1Qh6Ch6lvr4j31xs5jY9iGMIyZfHmN1U6/view?usp=sharing

## 📦 Tech Stack
- **Frontend:** React, Axios
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose

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
│   │   ├── ChatMessage.js      # Mongoose schema for individual chat messages
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
