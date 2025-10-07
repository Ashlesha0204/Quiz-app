// server.js - Main Express Server
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static images
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Configure multer for file uploads (for admin features)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// In-memory storage for sessions (use Redis/Database in production)
const sessions = new Map();
const leaderboards = new Map();

// Quiz data with proper image paths
const quizData = {
  treasure: {
    name: "Treasure Hunt",
    theme: "adventure",
    backgroundImage: "/images/backgrounds/treasurebg.jpg",
    icon: "/images/icons/treasure.jpg",
    description: "Solve riddles and find the hidden treasure!",
    questions: [
      {
        id: 1,
        difficulty: 'easy',
        question: "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?",
        options: [
          { id: 'a', text: 'Water', image: '/images/treasure/water.avif', correct: false },
          { id: 'b', text: 'Echo', image: '/images/treasure/echo.jpg', correct: true },
          { id: 'c', text: 'Fire', image: '/images/treasure/fire.avif', correct: false }
        ],
        explanation: "An echo has no physical form but can 'speak' (repeat sounds) and comes alive with wind carrying sound waves."
      },
      {
        id: 2,
        difficulty: 'medium',
        question: "The more of me you take, the more you leave behind. What am I?",
        options: [
          { id: 'a', text: 'Time', image: '/images/treasure/time.jpg', correct: false },
          { id: 'b', text: 'Shadow', image: '/images/treasure/shadow.jpg', correct: false },
          { id: 'c', text: 'Footsteps', image: '/images/treasure/footsteps.jpg', correct: true }
        ],
        explanation: "The more steps you take, the more footprints you leave behind you."
      },
      {
        id: 3,
        difficulty: 'hard',
        question: "The person who makes it, sells it. The person who buys it never uses it. The person who uses it never knows they're using it. What is it?",
        options: [
          { id: 'a', text: 'Coffin', image: '/images/treasure/coffin.jpg', correct: true },
          { id: 'b', text: 'Mirror', image: '/images/treasure/mirror.jpg', correct: false },
          { id: 'c', text: 'Clock', image: '/images/treasure/clock.jpg', correct: false }
        ],
        explanation: "A coffin maker sells it, relatives buy it, but the deceased person using it is unaware."
      },
      {
        id: 4,
        difficulty: 'medium',
        question: "I have cities but no houses, forests but no trees, and rivers but no water. What am I?",
        options: [
          { id: 'a', text: 'Book', image: '/images/treasure/book.jpg', correct: false },
          { id: 'b', text: 'Painting', image: '/images/treasure/painting.jpg', correct: false },
          { id: 'c', text: 'Map', image: '/images/treasure/map.jpg', correct: true }
        ],
        explanation: "A map shows cities, forests, and rivers but contains none of the actual physical elements."
      }
    ]
  },
  programming: {
    name: "Programming Quiz",
    theme: "tech",
    backgroundImage: "linear-gradient(45deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)",
    icon: "/images/icons/programming.jpg",
    description: "Test your coding knowledge and skills!",
    questions: [
      {
        id: 1,
        question: "Which of the following is the correct way to declare a variable in C?",
        codeExample: "// Variable declaration in C",
        options: [
          { id: 'a', text: 'int x = 5;', code: true, correct: false },
          { id: 'b', text: 'x int;', code: true, correct: false },
          { id: 'c', text: 'int x;', code: true, correct: true },
          { id: 'd', text: 'integer x;', code: true, correct: false }
        ],
        explanation: "'int x;' is the correct declaration syntax. 'int x = 5;' is declaration with initialization."
      },
      {
        id: 2,
        question: "What is the correct HTML tag for inserting an image?",
        options: [
          { id: 'a', text: '<img src="image.jpg">', code: true, correct: true },
          { id: 'b', text: '<image src="image.jpg">', code: true, correct: false },
          { id: 'c', text: '<picture src="image.jpg">', code: true, correct: false },
          { id: 'd', text: '<img href="image.jpg">', code: true, correct: false }
        ],
        explanation: "The <img> tag with src attribute is the standard way to insert images in HTML."
      },
      {
        id: 3,
        question: "Which CSS property controls the text color?",
        options: [
          { id: 'a', text: 'text-color', code: true, correct: false },
          { id: 'b', text: 'color', code: true, correct: true },
          { id: 'c', text: 'font-color', code: true, correct: false },
          { id: 'd', text: 'text-style', code: true, correct: false }
        ],
        explanation: "The 'color' property is used to set the text color in CSS."
      },
      {
        id: 4,
        question: "What is the correct syntax to write a main function in C?",
        options: [
          { id: 'a', text: 'int main() {}', code: true, correct: true },
          { id: 'b', text: 'void main() {}', code: true, correct: false },
          { id: 'c', text: 'main() {}', code: true, correct: false },
          { id: 'd', text: 'int main[] {}', code: true, correct: false }
        ],
        explanation: "'int main()' is the standard entry point function in C programs."
      }
    ]
  },
  mythology: {
    name: "Indian Mythology",
    theme: "traditional",
    backgroundImage: "/images/backgrounds/mythologybg.jpg",
    icon: "/images/icons/mythology.jpg",
    description: "Explore the wisdom of ancient Indian epics!",
    questions: [
      {
        id: 1,
        question: "Who carried Lord Rama and Lakshmana to Lanka on his back?",
        sanskritQuote: "धर्मो रक्षति रक्षितः।",
        translation: "Dharma protects those who protect it.",
        options: [
          { id: 'a', text: 'Hanuman', image: '/images/mythology/hanuman.jpg', correct: true },
          { id: 'b', text: 'Vibhishana', image: '/images/mythology/vibhishana.jpg', correct: false },
          { id: 'c', text: 'Jatayu', image: '/images/mythology/jatayu.jpg', correct: false },
          { id: 'd', text: 'Garuda', image: '/images/mythology/garuda.jpg', correct: false }
        ],
        explanation: "Hanuman, the devoted follower of Rama, carried both brothers to Lanka during their mission to rescue Sita."
      },
      {
        id: 2,
        question: "Who was the guru of the Pandavas and Kauravas in archery?",
        sanskritQuote: "सर्वं ज्ञानं मयि स्थितं।",
        translation: "All knowledge resides within me.",
        options: [
          { id: 'a', text: 'Kripacharya', image: '/images/mythology/kripacharya.jpg', correct: false },
          { id: 'b', text: 'Dronacharya', image: '/images/mythology/dronacharya.jpg', correct: true },
          { id: 'c', text: 'Bhishma', image: '/images/mythology/bhishma.jpg', correct: false },
          { id: 'd', text: 'Karna', image: '/images/mythology/karna.jpg', correct: false }
        ],
        explanation: "Dronacharya was the master archer who taught both the Pandavas and Kauravas the art of archery."
      },
      {
        id: 3,
        question: "Who broke Lord Shiva's bow to marry Sita?",
        sanskritQuote: "न हि ज्ञानेन सदृशं पवित्रमिह विद्यते।",
        translation: "There is nothing more purifying in this world than knowledge.",
        options: [
          { id: 'a', text: 'King Bharata', image: '/images/mythology/bharata.jpg', correct: false },
          { id: 'b', text: 'Ravana', image: '/images/mythology/ravana.jpg', correct: false },
          { id: 'c', text: 'Lord Rama', image: '/images/mythology/rama.jpg', correct: true },
          { id: 'd', text: 'Vishwamitra', image: '/images/mythology/vishwamitra.jpg', correct: false }
        ],
        explanation: "Lord Rama broke the Pinaka (Shiva's bow) in Janaka's court to win Sita's hand in marriage."
      },
      {
        id: 4,
        question: "Who was the charioteer of Arjuna in the Mahabharata?",
        sanskritQuote: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।",
        translation: "You have the right to perform your duty, but not to expect the fruits of your actions.",
        options: [
          { id: 'a', text: 'Bhishma', image: '/images/mythology/bhishma.jpg', correct: false },
          { id: 'b', text: 'Dronacharya', image: '/images/mythology/dronacharya.jpg', correct: false },
          { id: 'c', text: 'Krishna', image: '/images/mythology/krishna.jpg', correct: true },
          { id: 'd', text: 'Karna', image: '/images/mythology/karna.jpg', correct: false }
        ],
        explanation: "Lord Krishna served as Arjuna's charioteer and delivered the Bhagavad Gita during the Kurukshetra war."
      }
    ]
  }
};

// Routes

// Get all available quizzes with their metadata
app.get('/api/quizzes', (req, res) => {
  const quizList = Object.entries(quizData).map(([key, quiz]) => ({
    id: key,
    name: quiz.name,
    theme: quiz.theme,
    description: quiz.description,
    icon: quiz.icon,
    backgroundImage: quiz.backgroundImage,
    questionCount: quiz.questions.length
  }));
  res.json(quizList);
});

// Start a new quiz session
app.post('/api/session/start', (req, res) => {
  const { quizType } = req.body;
  
  if (!quizData[quizType]) {
    return res.status(400).json({ error: 'Invalid quiz type' });
  }

  const sessionId = uuidv4();
  const session = {
    id: sessionId,
    quizType,
    currentQuestion: 0,
    score: 0,
    startTime: Date.now(),
    answers: [],
    isCompleted: false
  };

  sessions.set(sessionId, session);
  
  res.json({
    sessionId,
    quiz: {
      name: quizData[quizType].name,
      theme: quizData[quizType].theme,
      backgroundImage: quizData[quizType].backgroundImage,
      totalQuestions: quizData[quizType].questions.length
    }
  });
});

// Utility function for adaptive question selection
const getAdaptiveQuestion = (quiz, session) => {
  // Calculate user performance
  const correctAnswers = session.answers.filter(a => a.isCorrect).length;
  const totalAnswered = session.answers.length;
  const accuracy = totalAnswered > 0 ? correctAnswers / totalAnswered : 0.5;
  
  // Determine preferred difficulty based on performance
  let preferredDifficulty;
  if (accuracy >= 0.8) preferredDifficulty = 'hard';
  else if (accuracy >= 0.5) preferredDifficulty = 'medium';
  else preferredDifficulty = 'easy';
  
  // Get unanswered questions
  const answeredIds = session.answers.map(a => a.questionId);
  const availableQuestions = quiz.questions.filter(q => !answeredIds.includes(q.id));
  
  if (availableQuestions.length === 0) return null;
  
  // Try to find question matching preferred difficulty
  let selectedQuestion = availableQuestions.find(q => q.difficulty === preferredDifficulty);
  
  // If no preferred difficulty available, pick any available question
  if (!selectedQuestion) {
    selectedQuestion = availableQuestions[0];
  }
  
  return selectedQuestion;
};

// Get current question for a session
app.get('/api/session/:sessionId/question', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.isCompleted) {
    return res.status(400).json({ error: 'Quiz already completed' });
  }

  const quiz = quizData[session.quizType];
  
  // Use adaptive question selection instead of sequential
  const question = getAdaptiveQuestion(quiz, session);

  if (!question) {
    return res.status(404).json({ error: 'No more questions available' });
  }

  // Return question with all image paths and difficulty info
  res.json({
    questionNumber: session.answers.length + 1,
    totalQuestions: quiz.questions.length,
    question: {
      id: question.id,
      difficulty: question.difficulty,
      question: question.question,
      sanskritQuote: question.sanskritQuote || null,
      translation: question.translation || null,
      codeExample: question.codeExample || null,
      options: question.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        image: opt.image || null, // Image path for visual options
        code: opt.code || false   // Flag for code-style formatting
      }))
    },
    theme: quiz.theme,
    backgroundImage: quiz.backgroundImage
  });
});

// Submit answer for current question
app.post('/api/session/:sessionId/answer', (req, res) => {
  const { sessionId } = req.params;
  const { optionId } = req.body;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const quiz = quizData[session.quizType];
  // Find the question by ID from the current session's answered questions
  const currentQuestion = getAdaptiveQuestion(quiz, session);
  const selectedOption = currentQuestion.options.find(opt => opt.id === optionId);

  if (!selectedOption) {
    return res.status(400).json({ error: 'Invalid option' });
  }

  // Record the answer
  session.answers.push({
    questionId: currentQuestion.id,
    selectedOption: optionId,
    isCorrect: selectedOption.correct,
    timestamp: Date.now()
  });

  const isCorrect = selectedOption.correct;
  
  if (isCorrect) {
    session.score++;
    
    // Check if quiz is completed (all questions answered)
    if (session.answers.length >= quiz.questions.length) {
      session.isCompleted = true;
      session.endTime = Date.now();
      session.totalTime = session.endTime - session.startTime;
      
      // Add to leaderboard
      const leaderboard = leaderboards.get(session.quizType) || [];
      leaderboard.push({
        sessionId,
        score: session.score,
        totalTime: session.totalTime,
        timestamp: Date.now()
      });
      leaderboard.sort((a, b) => b.score - a.score || a.totalTime - b.totalTime);
      leaderboards.set(session.quizType, leaderboard.slice(0, 10)); // Keep top 10
    }
  } else {
    session.isCompleted = true;
    session.endTime = Date.now();
    session.totalTime = session.endTime - session.startTime;
  }

  res.json({
    isCorrect,
    explanation: currentQuestion.explanation,
    isCompleted: session.isCompleted,
    isVictory: session.isCompleted && session.score === quiz.questions.length,
    currentScore: session.score,
    totalQuestions: quiz.questions.length,
    nextQuestionAvailable: !session.isCompleted && session.answers.length < quiz.questions.length
  });
});

// Get session results
app.get('/api/session/:sessionId/results', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const quiz = quizData[session.quizType];
  const totalTime = session.totalTime || (Date.now() - session.startTime);
  
  res.json({
    sessionId,
    quizName: quiz.name,
    theme: quiz.theme,
    score: session.score,
    totalQuestions: quiz.questions.length,
    totalTime,
    isCompleted: session.isCompleted,
    answers: session.answers,
    percentage: Math.round((session.score / quiz.questions.length) * 100)
  });
});

// Get leaderboard for a quiz type
app.get('/api/leaderboard/:quizType', (req, res) => {
  const { quizType } = req.params;
  const leaderboard = leaderboards.get(quizType) || [];
  
  res.json({
    quizType,
    entries: leaderboard.map((entry, index) => ({
      rank: index + 1,
      score: entry.score,
      totalTime: entry.totalTime,
      timeAgo: Date.now() - entry.timestamp
    }))
  });
});

// Get quiz statistics
app.get('/api/stats/:quizType', (req, res) => {
  const { quizType } = req.params;
  const quiz = quizData[quizType];
  
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  // Calculate statistics from all sessions
  const quizSessions = Array.from(sessions.values()).filter(s => s.quizType === quizType);
  const completedSessions = quizSessions.filter(s => s.isCompleted);
  
  const stats = {
    totalAttempts: quizSessions.length,
    completedAttempts: completedSessions.length,
    averageScore: completedSessions.length > 0 
      ? completedSessions.reduce((sum, s) => sum + s.score, 0) / completedSessions.length 
      : 0,
    averageTime: completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.totalTime || 0), 0) / completedSessions.length
      : 0,
    perfectScores: completedSessions.filter(s => s.score === quiz.questions.length).length
  };

  res.json(stats);
});

// Image upload endpoint (for admin)
app.post('/api/admin/images/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }

  res.json({
    filename: req.file.filename,
    path: `/images/${req.file.filename}`,
    size: req.file.size
  });
});

// Get all images in a category
app.get('/api/images/:category', async (req, res) => {
  const { category } = req.params;
  const imagesPath = path.join(__dirname, 'public/images');
  
  try {
    const files = await fs.readdir(imagesPath);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(file)
    );
    
    const images = imageFiles.map(file => ({
      filename: file,
      path: `/images/${file}`,
      category: category // You can implement category-based filtering
    }));
    
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: 'Unable to read images directory' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    activeSessions: sessions.size 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Quiz Server running on port ${PORT}`);
  console.log(`📁 Serving images from: ${path.join(__dirname, 'public/images')}`);
  console.log(`🎮 Quiz types available: ${Object.keys(quizData).join(', ')}`);
});

// Export for testing
module.exports = app;

/*
Package.json for the backend:

{
  "name": "quiz-backend",
  "version": "1.0.0",
  "description": "Backend server for enhanced quiz game",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.5.0"
  }
}

Directory structure for images:
public/
└── images/
    ├── backgrounds/
    │   ├── background.avif
    │   ├── treasurebg.jpg
    │   ├── mythologybg.jpg
    │   └── programmingbg.jpg (optional)
    ├── icons/
    │   ├── treasure.jpg
    │   ├── programming.jpg
    │   └── mythology.jpg
    ├── treasure/
    │   ├── water.avif
    │   ├── echo.jpg
    │   ├── fire.avif
    │   ├── time.jpg
    │   ├── shadow.jpg
    │   ├── footsteps.jpg
    │   ├── coffin.jpg
    │   ├── mirror.jpg
    │   ├── clock.jpg
    │   ├── book.jpg
    │   ├── painting.jpg
    │   ├── map.jpg
    │   └── treasurechest.jpg
    └── mythology/
        ├── hanuman.jpg
        ├── vibhishana.jpg
        ├── jatayu.jpg
        ├── garuda.jpg
        ├── kripacharya.jpg
        ├── dronacharya.jpg
        ├── bhishma.jpg
        ├── karna.jpg
        ├── bharata.jpg
        ├── ravana.jpg
        ├── rama.jpg
        ├── vishwamitra.jpg
        └── krishna.jpg
*/