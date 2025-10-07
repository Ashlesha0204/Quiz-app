# Quiz App - WPD Microproject

A full-stack interactive quiz application featuring three different quiz types: Treasure Hunt, Programming Quiz, and Indian Mythology. Built with React frontend and Express.js backend.

## 🎮 Features

### Three Quiz Types:
1. **Treasure Hunt** - Adventure-themed riddles with visual options
2. **Programming Quiz** - Technical questions about coding concepts  
3. **Indian Mythology** - Questions about ancient epics with Sanskrit quotes

### Core Features:
- ✅ Session-based quiz management
- ✅ Real-time scoring and timer
- ✅ Beautiful themed UI for each quiz type
- ✅ Image-based question options
- ✅ Victory and game over screens
- ✅ Leaderboard system
- ✅ Statistics tracking
- ✅ Responsive design with Tailwind CSS

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm

### Backend Setup
```bash
cd backend
npm install
npm start
```
Server runs on: http://localhost:5000

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: http://localhost:3000

## 📁 Project Structure

```
quiz-app/
├── backend/
│   ├── server.js           # Express server
│   ├── package.json        # Backend dependencies
│   └── public/
│       └── images/         # All quiz images organized by category
│           ├── backgrounds/
│           ├── icons/
│           ├── treasure/
│           └── mythology/
└── frontend/
    ├── src/
    │   ├── App.jsx         # Main React application
    │   ├── main.jsx        # React entry point
    │   └── index.css       # Tailwind CSS styles
    ├── index.html          # HTML template
    ├── package.json        # Frontend dependencies
    ├── vite.config.js      # Vite configuration
    └── tailwind.config.js  # Tailwind configuration
```

## 🎯 API Endpoints

### Quiz Management
- `GET /api/quizzes` - Get all available quizzes
- `POST /api/session/start` - Start a new quiz session
- `GET /api/session/:sessionId/question` - Get current question
- `POST /api/session/:sessionId/answer` - Submit answer

### Statistics & Leaderboard
- `GET /api/session/:sessionId/results` - Get session results
- `GET /api/leaderboard/:quizType` - Get leaderboard
- `GET /api/stats/:quizType` - Get quiz statistics

### Admin Features
- `POST /api/admin/images/upload` - Upload new images
- `GET /api/images/:category` - Get images by category

## 🎨 Quiz Themes

Each quiz has its own visual theme:
- **Adventure**: Amber/gold colors with treasure imagery
- **Tech**: Dark theme with green accents and monospace fonts
- **Traditional**: Purple/yellow theme with Sanskrit elements

## 🏆 Game Rules

- Answer questions correctly to progress
- One wrong answer ends the quiz (except for completing all questions)
- Complete all questions to achieve victory
- Track your time and compete on leaderboards

## 🔧 Technologies Used

### Backend:
- Express.js
- CORS for cross-origin requests
- Multer for file uploads
- UUID for session management

### Frontend:
- React 18
- Vite (build tool)
- Tailwind CSS
- Lucide React (icons)

## 📊 Project Status: COMPLETE ✅

The quiz app is fully functional with:
- ✅ Working backend API
- ✅ Responsive React frontend
- ✅ All quiz types implemented
- ✅ Complete image assets
- ✅ Session management
- ✅ Themed UI components

## 🎯 Future Enhancements (Optional)

- User authentication and profiles
- Database integration (currently uses in-memory storage)
- Admin panel for quiz management
- More quiz categories
- Multiplayer features
- Progressive Web App (PWA) support

---

**Note**: This is a microproject demonstrating full-stack web development skills with modern technologies.
