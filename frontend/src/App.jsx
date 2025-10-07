import React, { useState, useEffect } from 'react';
import { ChevronLeft, Home, Trophy, Clock, Star, RefreshCw, Sparkles, Award, Zap, Brain, BookOpen } from 'lucide-react';

// API base URL - uses environment variable or fallback
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Utility functions for randomization
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getDifficultyLevel = (score, totalQuestions) => {
  const accuracy = totalQuestions > 0 ? score / totalQuestions : 0;
  if (accuracy >= 0.8) return 'hard';
  if (accuracy >= 0.5) return 'medium';
  return 'easy';
};

// Main App Component with proper image integration
const QuizApp = () => {
  const [currentView, setCurrentView] = useState('welcome');
  const [quizzes, setQuizzes] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [currentQuestionData, setCurrentQuestionData] = useState(null);
  const [currentQuizType, setCurrentQuizType] = useState(null);
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questionHistory, setQuestionHistory] = useState([]);

  // Load available quizzes on component mount
  useEffect(() => {
    fetchQuizzes();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (isTimerActive) {
      interval = setInterval(() => {
        setTimeElapsed(time => time + 1);
      }, 1000);
    } else if (!isTimerActive && timeElapsed !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeElapsed]);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch(`${API_BASE}/quizzes`);
      const data = await response.json();
      setQuizzes(data);
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
      // Fallback to local data if backend is not available
      setQuizzes([
        { id: 'treasure', name: 'Treasure Hunt', theme: 'adventure', description: 'Solve riddles and find treasure!', icon: '/images/icons/treasure.jpg', backgroundImage: '/images/backgrounds/treasurebg.jpg' },
        { id: 'programming', name: 'Programming Quiz', theme: 'tech', description: 'Test your coding knowledge!', icon: '/images/icons/programming.jpg', backgroundImage: 'linear-gradient(45deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)' },
        { id: 'mythology', name: 'Indian Mythology', theme: 'traditional', description: 'Explore ancient wisdom!', icon: '/images/icons/mythology.jpg', backgroundImage: '/images/backgrounds/mythologybg.jpg' }
      ]);
    }
  };

  const startQuiz = async (quizType) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizType })
      });
      const sessionData = await response.json();
      setCurrentSession(sessionData);
      setCurrentQuizType(quizType);
      await loadCurrentQuestion(sessionData.sessionId);
      setScore(0);
      setTimeElapsed(0);
      setCurrentView('quiz');
      setIsTimerActive(true);
      // Scroll to top when quiz starts
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Failed to start quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentQuestion = async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE}/session/${sessionId}/question`);
      const questionData = await response.json();
      
      // Randomize question options
      if (questionData.question && questionData.question.options) {
        const shuffledOptions = shuffleArray(questionData.question.options);
        questionData.question.options = shuffledOptions;
      }
      
      setCurrentQuestionData(questionData);
      // Scroll to top when new question loads
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Failed to load question:', error);
    }
  };

  const handleAnswer = async (selectedOption) => {
    if (!currentSession) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/session/${currentSession.sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId: selectedOption })
      });
      const result = await response.json();
      
      // Track question performance for difficulty progression
      const questionPerformance = {
        questionId: currentQuestionData?.question?.id,
        isCorrect: result.isCorrect,
        timeSpent: timeElapsed,
        difficulty: getDifficultyLevel(score, result.currentScore || 1)
      };
      setQuestionHistory(prev => [...prev, questionPerformance]);
      
      if (result.isCorrect) {
        setScore(result.currentScore);
        if (result.isCompleted && result.isVictory) {
          setCurrentView('victory');
          setIsTimerActive(false);
        } else if (result.nextQuestionAvailable) {
          setTimeout(async () => {
            await loadCurrentQuestion(currentSession.sessionId);
          }, 1000);
        }
      } else {
        setCurrentView('gameOver');
        setIsTimerActive(false);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetQuiz = () => {
    setCurrentView('welcome');
    setCurrentSession(null);
    setCurrentQuestionData(null);
    setCurrentQuizType(null);
    setScore(0);
    setTimeElapsed(0);
    setIsTimerActive(false);
    setQuestionHistory([]);
    // Scroll to top when returning to welcome page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToQuizSelection = () => {
    setCurrentView('selection');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const restartCurrentQuiz = async () => {
    if (currentQuizType) {
      await startQuiz(currentQuizType);
    }
  };

  return (
    <div className="min-h-screen">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3 animate-fadeInScale">
            <div className="animate-smoothSpin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="animate-fadeInUp">Loading...</span>
          </div>
        </div>
      )}
      
      {currentView === 'welcome' && (
        <WelcomePage onStartQuest={goToQuizSelection} />
      )}
      {currentView === 'selection' && (
        <QuizSelection quizzes={quizzes} onSelectQuiz={startQuiz} />
      )}
      {currentView === 'quiz' && currentQuestionData && (
        <QuizGame 
          sessionData={currentSession}
          questionData={currentQuestionData}
          onAnswer={handleAnswer}
          onHome={resetQuiz}
          score={score}
          timeElapsed={timeElapsed}
          formatTime={formatTime}
        />
      )}
      {currentView === 'gameOver' && (
        <GameOver 
          theme={currentSession?.quiz?.theme}
          onRestart={restartCurrentQuiz}
          onHome={resetQuiz}
          score={score}
          timeElapsed={timeElapsed}
          formatTime={formatTime}
        />
      )}
      {currentView === 'victory' && (
        <Victory 
          theme={currentSession?.quiz?.theme}
          quizName={currentSession?.quiz?.name}
          onRestart={restartCurrentQuiz}
          onHome={resetQuiz}
          score={score}
          timeElapsed={timeElapsed}
          formatTime={formatTime}
        />
      )}
    </div>
  );
};

// Welcome Page Component - Exact Match to HTML Code
const WelcomePage = ({ onStartQuest }) => {
  const [animatedText, setAnimatedText] = useState('');
  
  const motivationalTexts = [
    'Your Epic Journey of Knowledge Begins Here',
    'Embark on a Quest for Ancient Wisdom',
    'Challenge Your Mind, Conquer New Realms',
    'Unlock the Secrets of Forgotten Lore',
    'Rise as a Champion of Knowledge',
    'Discover Treasures Hidden in Learning'
  ];

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setAnimatedText(motivationalTexts[index]);
      index = (index + 1) % motivationalTexts.length;
    }, 3000);
    
    // Set initial text
    setAnimatedText(motivationalTexts[0]);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-white" style={{ fontFamily: 'Roboto, sans-serif', overflow: 'hidden', background: '#0c0a1a' }}>
      {/* Background Video */}
      <video 
        autoPlay 
        loop 
        muted 
        className="background-video"
        poster="https://storage.googleapis.com/dnyanquest-assets/background-poster.jpg"
      >
        <source src="https://storage.googleapis.com/dnyanquest-assets/knowledge-quest-bg.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-[#0c0a1a]"></div>
        <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 w-full max-w-6xl">
          
          {/* Hero Title with Custom Fonts */}
          <h1 className="text-7xl md:text-9xl mb-4 glow-effect">
            <span className="text-yellow-400 font-devanagari">ज्ञान</span><span className="font-cinzel">Quest</span>
          </h1>
          
          <p className="text-2xl md:text-3xl text-gray-300 mb-12 tracking-widest font-light animate-fadeIn">
            {animatedText}
          </p>
          
          {/* Feature Cards with Material Icons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 w-full max-w-4xl">
            <div className="visual-card flex flex-col items-center gap-4 p-6 rounded-2xl cursor-pointer">
              <span className="material-icons text-5xl text-yellow-500">emoji_events</span>
              <h3 className="text-xl font-bold">Claim Glorious Rewards</h3>
              <p className="text-gray-400 text-sm">Conquer challenges and earn unique treasures and accolades.</p>
            </div>
            
            <div className="visual-card flex flex-col items-center gap-4 p-6 rounded-2xl cursor-pointer">
              <span className="material-icons text-5xl text-blue-400">explore</span>
              <h3 className="text-xl font-bold">Explore Lost Worlds</h3>
              <p className="text-gray-400 text-sm">Navigate through ancient realms of forgotten wisdom.</p>
            </div>
            
            <div className="visual-card flex flex-col items-center gap-4 p-6 rounded-2xl cursor-pointer">
              <span className="material-icons text-5xl text-red-500">shield</span>
              <h3 className="text-xl font-bold">Face Epic Challenges</h3>
              <p className="text-gray-400 text-sm">Test your mettle against formidable intellectual quests.</p>
            </div>
          </div>
          
          {/* Call to Action Button */}
          <button 
            onClick={onStartQuest}
            className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-black font-bold py-5 px-16 rounded-full text-2xl shadow-lg btn-pulse flex items-center gap-4"
          >
            <span className="material-icons text-3xl">rocket_launch</span>
            Begin Your Epic Journey
          </button>
        </div>
      </div>
    </div>
  );
};

// Quiz Selection Component with proper images
const QuizSelection = ({ quizzes, onSelectQuiz }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ 
          backgroundImage: "url('/images/backgrounds/background.avif')",
          filter: 'brightness(0.7)'
        }}
      ></div>
      
      {/* Content */}
      <div className="relative z-10 bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-4xl w-full animate-fadeInScale">
        <h1 className="text-5xl font-bold text-center mb-8 text-gray-800 font-serif animate-slideDown">
          🎮 Choose Your Quest
        </h1>
        
        <div className="grid md:grid-cols-3 gap-8">
          {quizzes.map((quiz, index) => (
            <div key={quiz.id} 
                 className="group cursor-pointer hover-lift animate-fadeInUp btn-press"
                 style={{ animationDelay: `${index * 150}ms` }}
                 onClick={() => onSelectQuiz(quiz.id)}>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden smooth-transition">
                {/* Quiz Icon Image */}
                <div className="h-48 relative overflow-hidden">
                  <img 
                    src={quiz.icon} 
                    alt={quiz.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      // Fallback to emoji if image fails
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-blue-400 to-purple-600">
                          ${quiz.id === 'treasure' ? '🏴‍☠️' : quiz.id === 'programming' ? '💻' : '🕉️'}
                        </div>
                      `;
                    }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{quiz.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{quiz.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                      {quiz.questionCount || 4} Questions
                    </span>
                    <span className="text-sm text-gray-500 capitalize">{quiz.theme}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Quiz Game Component with proper image integration
const QuizGame = ({ sessionData, questionData, onAnswer, onHome, score, timeElapsed, formatTime }) => {
  if (!questionData) return <div>Loading question...</div>;

  const question = questionData.question;
  const progress = (questionData.questionNumber / questionData.totalQuestions) * 100;

  const getThemeStyles = () => {
    switch (questionData.theme) {
      case 'adventure':
        return {
          container: 'bg-black bg-opacity-70 border-amber-400',
          title: 'text-amber-300',
          text: 'text-white',
          option: 'bg-amber-100 hover:bg-amber-200 text-gray-800 border-amber-300'
        };
      case 'tech':
        return {
          container: 'bg-gray-900 bg-opacity-90 border-green-400',
          title: 'text-green-400',
          text: 'text-green-100',
          option: 'bg-gray-800 hover:bg-gray-700 text-green-300 border-green-500 font-mono'
        };
      case 'traditional':
        return {
          container: 'bg-purple-900 bg-opacity-20 border-yellow-400',
          title: 'text-yellow-300',
          text: 'text-yellow-100',
          option: 'bg-yellow-50 hover:bg-yellow-100 text-purple-800 border-yellow-400'
        };
      default:
        return {
          container: 'bg-white bg-opacity-90',
          title: 'text-gray-800',
          text: 'text-gray-700',
          option: 'bg-blue-50 hover:bg-blue-100 text-blue-800'
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Theme-specific Background Image or Gradient */}
      <div 
        className={`absolute inset-0 bg-cover bg-center ${questionData.theme === 'traditional' ? 'bg-scroll' : 'bg-fixed'}`}
        style={{ 
          background: questionData.backgroundImage.startsWith('linear-gradient') 
            ? questionData.backgroundImage 
            : `url('${questionData.backgroundImage}')`,
          filter: 'brightness(0.6)'
        }}
      ></div>
      
      {/* Content */}
      <div className={`relative z-10 ${styles.container} border-2 rounded-2xl shadow-2xl p-8 max-w-4xl w-full backdrop-blur-sm animate-fadeInScale`}>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={onHome} className={`${styles.text} hover:opacity-70 transition-opacity`}>
            <Home size={24} />
          </button>
          <h1 className={`${styles.title} text-3xl font-bold`}>
            {sessionData?.quiz?.name}
          </h1>
          <div className={`${styles.text} text-sm flex items-center gap-2`}>
            <Clock size={16} />
            {formatTime(timeElapsed)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 animate-slideDown">
          <div className="flex justify-between text-sm mb-2">
            <span className={`${styles.text} animate-fadeIn`}>Question {questionData.questionNumber} of {questionData.totalQuestions}</span>
            <span className={`${styles.text} animate-fadeIn`}>Score: {score}/{questionData.totalQuestions}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div className="progress-bar h-2 rounded-full"
                 style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Sanskrit Quote (for Mythology) */}
        {questionData.theme === 'traditional' && question.sanskritQuote && (
          <div className="mb-6 text-center">
            <p className={`${styles.title} text-xl font-bold mb-2`}>
              {question.sanskritQuote}
            </p>
            <p className={`${styles.text} italic text-sm`}>
              "{question.translation}"
            </p>
          </div>
        )}

        {/* Question */}
        <div className="mb-8 text-center animate-fadeInUp">
          <h2 className={`${styles.text} text-xl font-semibold leading-relaxed animate-smoothType`}>
            {question.question}
          </h2>
        </div>

        {/* Options with Images */}
        <div className={`grid gap-4 ${questionData.theme === 'adventure' && question.options.length === 3 ? 'grid-cols-1 max-w-3xl mx-auto' : 'grid-cols-1 md:grid-cols-2'}`}>
          {question.options.map((option, index) => (
            <button
              key={option.id}
              onClick={() => onAnswer(option.id)}
              className={`${styles.option} border-2 rounded-xl hover-lift relative overflow-hidden group btn-press ${
                questionData.theme === 'adventure' && question.options.length === 3 
                  ? 'p-3 min-h-[200px]' 
                  : questionData.theme === 'traditional'
                    ? 'p-3 min-h-[220px]'
                    : 'p-4'
              } animate-fadeInUp`}
              style={{ animationDelay: `${index * 100}ms` }}>
              {/* Option with Image (for treasure hunt and mythology) */}
              {option.image ? (
                <div className={`flex items-center h-full ${
                  questionData.theme === 'adventure' && question.options.length === 3 
                    ? 'flex-row space-x-4' 
                    : 'flex-col space-y-4'
                }`}>
                  <div className={`rounded-lg overflow-hidden flex-shrink-0 ${
                    questionData.theme === 'adventure' && question.options.length === 3 
                      ? 'w-32 h-32' 
                      : questionData.theme === 'traditional' 
                        ? 'w-full h-40 flex-grow' 
                        : 'w-full h-56 flex-grow'
                  }`}>
                    <img 
                      src={option.image} 
                      alt={option.text}
                      className={`w-full h-full transition-transform duration-300 group-hover:scale-110 ${
                        questionData.theme === 'traditional' ? 'object-contain' : 'object-cover'
                      }`}
                      style={{ 
                        objectPosition: 'center center'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `
                          <div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                            ${option.text}
                          </div>
                        `;
                      }}
                    />
                  </div>
                  <span className={`font-medium text-center ${
                    questionData.theme === 'adventure' && question.options.length === 3 
                      ? 'text-base flex-grow text-left leading-relaxed' 
                      : questionData.theme === 'traditional'
                        ? 'text-base mt-2'
                        : 'text-lg'
                  }`}>{option.text}</span>
                </div>
              ) : (
                /* Text-only Option (for programming quiz) */
                <div className="flex items-center space-x-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-opacity-20 bg-current flex items-center justify-center font-bold">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className={`${option.code ? 'font-mono bg-gray-100 px-2 py-1 rounded text-gray-800' : ''}`}>
                    {option.text}
                  </span>
                </div>
              )}
              
              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 transform translate-x-full group-hover:translate-x-0"></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Game Over Component
const GameOver = ({ theme, onRestart, onHome, score, timeElapsed, formatTime }) => {
  const getThemeStyles = () => {
    switch (theme) {
      case 'adventure':
        return {
          bg: "url('/images/backgrounds/treasurebg.jpg')",
          container: 'bg-red-900 bg-opacity-80',
          title: 'text-red-300',
          text: 'text-red-100'
        };
      case 'tech':
        return {
          bg: 'linear-gradient(45deg, #2c1810 0%, #8b0000 100%)',
          container: 'bg-red-900 bg-opacity-90',
          title: 'text-red-400',
          text: 'text-red-200'
        };
      case 'traditional':
        return {
          bg: "url('/images/backgrounds/mythologybg.jpg')",
          container: 'bg-red-800 bg-opacity-80',
          title: 'text-red-300',
          text: 'text-red-100'
        };
      default:
        return {
          bg: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
          container: 'bg-red-900 bg-opacity-80',
          title: 'text-red-300',
          text: 'text-red-100'
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center" 
         style={{ backgroundImage: styles.bg, filter: 'brightness(0.7)' }}>
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      <div className={`relative z-10 ${styles.container} rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center backdrop-blur-sm animate-shakeIn`}>
        <div className="mb-6">
          <h1 className={`${styles.title} text-5xl font-bold mb-4 animate-gentleBounce`}>
            <span className="inline-block animate-gentleFloat">💔</span> Game Over!
          </h1>
          <p className={`${styles.text} text-xl mb-6`}>
            {theme === 'traditional' 
              ? "उद्यमेन हि सिद्धयन्ति कार्याणि न मनोरथैः।"
              : "Oops! Better luck next time!"
            }
          </p>
          {theme === 'traditional' && (
            <p className={`${styles.text} italic text-sm mb-4`}>
              "Success is achieved through effort, not by mere wishes."
            </p>
          )}
        </div>

        <div className="mb-8 animate-fadeInUp" style={{ animationDelay: '300ms' }}>
          <div className={`${styles.text} text-lg mb-2 animate-numberCount`}>Final Score: {score}</div>
          <div className={`${styles.text} text-lg animate-fadeIn`}>Time: {formatTime(timeElapsed)}</div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-bold transition-colors duration-300"
          >
            <RefreshCw size={20} />
            Try Again
          </button>
          <button
            onClick={onHome}
            className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-bold transition-colors duration-300"
          >
            <Home size={20} />
            Choose New Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

// Victory Component
const Victory = ({ theme, quizName, onRestart, onHome, score, timeElapsed, formatTime }) => {
  const getThemeStyles = () => {
    switch (theme) {
      case 'adventure':
        return {
          bg: "url('/images/backgrounds/treasurebg.jpg')",
          container: 'bg-yellow-900 bg-opacity-80',
          title: 'text-yellow-300',
          text: 'text-yellow-100'
        };
      case 'tech':
        return {
          bg: 'linear-gradient(45deg, #004e92 0%, #000428 100%)',
          container: 'bg-green-900 bg-opacity-90',
          title: 'text-green-400',
          text: 'text-green-200'
        };
      case 'traditional':
        return {
          bg: "url('/images/backgrounds/mythologybg.jpg')",
          container: 'bg-orange-900 bg-opacity-80',
          title: 'text-orange-300',
          text: 'text-orange-100'
        };
      default:
        return {
          bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
          container: 'bg-green-900 bg-opacity-80',
          title: 'text-green-300',
          text: 'text-green-100'
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center" 
         style={{ backgroundImage: styles.bg, filter: 'brightness(0.7)' }}>
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      <div className={`relative z-10 ${styles.container} rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center backdrop-blur-sm animate-fadeInScale`}>
        <div className="mb-6">
          <div className="text-6xl mb-4 animate-softBounce">
            {theme === 'adventure' && <span className="animate-smoothSpin inline-block">🏆</span>}
            {theme === 'tech' && <span className="animate-fadeIn inline-block">🎉</span>}
            {theme === 'traditional' && <span className="animate-gentleFloat inline-block">🙏</span>}
          </div>
          <h1 className={`${styles.title} text-5xl font-bold mb-4 animate-smoothZoom`}>
            Congratulations!
          </h1>
          <p className={`${styles.text} text-xl mb-6`}>
            {theme === 'traditional' 
              ? "सत्यमेव जयते नानृतम्।"
              : `You have successfully completed the ${quizName}!`
            }
          </p>
          {theme === 'traditional' && (
            <p className={`${styles.text} italic text-sm mb-4`}>
              "Truth alone triumphs, not falsehood."
            </p>
          )}
        </div>

        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className={`${styles.container} rounded-lg p-4 animate-fadeInUp hover:animate-pulse transition-all hover:scale-105`} style={{ animationDelay: '100ms' }}>
            <Trophy className={`${styles.title} mx-auto mb-2 animate-spin-slow`} size={24} />
            <div className={`${styles.title} text-2xl font-bold animate-countUp`}>{score}</div>
            <div className={`${styles.text} text-sm`}>Perfect Score</div>
          </div>
          <div className={`${styles.container} rounded-lg p-4 animate-fadeInUp hover:animate-pulse transition-all hover:scale-105`} style={{ animationDelay: '200ms' }}>
            <Clock className={`${styles.title} mx-auto mb-2 animate-pulse`} size={24} />
            <div className={`${styles.title} text-2xl font-bold`}>{formatTime(timeElapsed)}</div>
            <div className={`${styles.text} text-sm`}>Time Taken</div>
          </div>
          <div className={`${styles.container} rounded-lg p-4 animate-fadeInUp hover:animate-pulse transition-all hover:scale-105`} style={{ animationDelay: '300ms' }}>
            <Star className={`${styles.title} mx-auto mb-2 animate-float`} size={24} />
            <div className={`${styles.title} text-2xl font-bold animate-bounce`}>A+</div>
            <div className={`${styles.text} text-sm`}>Grade</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold transition-colors duration-300"
          >
            <RefreshCw size={20} />
            Play Again
          </button>
          <button
            onClick={onHome}
            className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-bold transition-colors duration-300"
          >
            <Home size={20} />
            Choose New Quest
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizApp;
