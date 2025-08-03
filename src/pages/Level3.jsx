import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

// The letters, words, and symbols for the quiz
const gameData = [
  { letter: 'A', word: 'Apple', symbol: '🍎' },
  { letter: 'B', word: 'Ball', symbol: '⚽' },
  { letter: 'C', word: 'Cat', symbol: '🐱' },
  { letter: 'D', word: 'Dog', symbol: '🐶' },
  { letter: 'E', word: 'Elephant', symbol: '🐘' },
  { letter: 'F', word: 'Fish', symbol: '🐟' },
  { letter: 'G', word: 'Grapes', symbol: '🍇' },
  { letter: 'H', word: 'Hat', symbol: '👒' },
];
const allSymbols = ['🍎', '⚽', '🐱', '🐶', '🐘', '🐟', '🍇', '👒', '🚗', '⭐', '🌙', '☀', '🍕', '🎁'];

// Fisher-Yates shuffle
const shuffleArray = (array) => {
  let a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// TTS for the letter only
function speakLetter(letter) {
  if (typeof window.speechSynthesis === 'undefined' || !letter) return;
  window.speechSynthesis.cancel();
  const utter = new window.SpeechSynthesisUtterance(letter);
  utter.lang = 'en-US';
  utter.rate = 0.7; // Slow for clarity
  window.speechSynthesis.speak(utter);
}

const Level3 = ({ onGoHome, userId }) => {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Generate and shuffle questions and options
  const generateQuestions = () => {
    const shuffledData = shuffleArray([...gameData]);
    return shuffledData.map((item) => {
      const wrongOpts = shuffleArray(allSymbols.filter(s => s !== item.symbol)).slice(0, 3);
      const options = shuffleArray([item.symbol, ...wrongOpts]);
      return { ...item, options };
    });
  };

  // On mount or restart
  useEffect(() => {
    setQuestions(generateQuestions());
    setScore(0);
    setCurrent(0);
    setReactionTimes([]);
    setGameOver(false);
    setIsAnswered(false);
  }, []);

  // Announce the letter at the start of each question
  useEffect(() => {
    if (questions.length > 0 && !gameOver) {
      setStartTime(Date.now());
      setIsAnswered(false);
      speakLetter(questions[current]?.letter);
    }
  }, [current, questions, gameOver]);

  // Handle answer: record time, check only for correctness
  const handleAnswer = (symbol) => {
    if (isAnswered) return;
    setIsAnswered(true);
    const correct = questions[current].symbol;
    const rt = (Date.now() - startTime) / 1000;
    setReactionTimes(prev => [...prev, rt]);
    if (symbol === correct) setScore(prev => prev + 1);

    setTimeout(() => {
      if (current < questions.length - 1) {
        setCurrent(c => c + 1);
      } else {
        setGameOver(true);
      }
    }, 1000); // Short pause before next question/end
  };

  // Save the session at the end (both to Firestore and localStorage)
  useEffect(() => {
    if (gameOver && questions.length) {
      const total = questions.length;
      const correct = score;
      const total_time = reactionTimes.reduce((a, b) => a + b, 0);
      const accuracy = correct / total;
      const avg_time = total_time / total;
      const dyslexia_score = accuracy - 0.5 * avg_time;
      const flag_dyslexia = dyslexia_score < 0.1;
      const date = new Date().toISOString();
      const session = {
        kid: userId || 'unknown',
        date,
        game: "Letter Sound",
        score: correct,
        total,
        accuracy,
        avg_time,
        dyslexia_score,
        flag_dyslexia,
        trials: reactionTimes.map((t, i) => ({
          is_correct: i < correct,
          response_time: t
        })),
        status: "Completed",
        timeTaken: total_time,
      };
      // Save to localStorage
      const allSessions = JSON.parse(localStorage.getItem('gameSessions') || '[]');
      allSessions.push(session);
      localStorage.setItem('gameSessions', JSON.stringify(allSessions));
      // Save to Firestore
      if (userId) {
        const userDocRef = doc(db, "artifacts", "default-app-id", "users", userId);
        updateDoc(userDocRef, { sessions: arrayUnion(session) }).catch(console.error);
      }
    }
  }, [gameOver, questions.length, score, reactionTimes, userId]);

  if (gameOver && questions.length) {
    const averageReactionTime = reactionTimes.length > 0
      ? (reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length).toFixed(2)
      : 0;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br from-[#f0f4f8] to-[#dbeafe] p-4 font-poppins">
        <div className="text-center bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
          <h1 className="text-4xl font-bold text-[#1e3a8a] mb-4">Good Game!</h1>
          <p className="text-xl text-gray-700 mb-2">
            Final Score: <span className="font-bold">{score} / {questions.length}</span>
          </p>
          <p className="text-xl text-gray-700 mb-6">
            Average Reaction: <span className="font-bold">{averageReactionTime}s</span>
          </p>
          <button
            onClick={() => {
              setQuestions(generateQuestions());
              setScore(0);
              setCurrent(0);
              setReactionTimes([]);
              setGameOver(false);
              setIsAnswered(false);
            }}
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-3 px-6 rounded-lg text-xl mt-3 transition-transform transform hover:scale-105">
            Play Again
          </button>
          <button 
            onClick={onGoHome}
            className="block w-full text-center mt-4 bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300">
            Back to Kid List
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="flex items-center justify-center min-h-screen">Loading Game...</div>;
  }

  const q = questions[current];

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br from-[#f0f4f8] to-[#dbeafe] p-4 font-poppins">
      <div className="absolute top-4 left-4">
        <button
          onClick={onGoHome}
          className="bg-white text-gray-700 px-4 py-2 rounded-xl shadow-md hover:bg-gray-200 transition-all flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Kid List
        </button>
      </div>
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-[#1e3a8a] mb-2">Level 3: Letter-Sound Matching</h1>
        <p className="text-xl text-gray-600 mb-8">Match the letter to the picture that starts with that sound.</p>
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full">
          <div className="mb-8">
            <p className="text-2xl text-gray-500 mb-2">Find the match for:</p>
            <div className="flex items-center justify-center space-x-4">
              <span className="text-8xl font-bold text-[#1e40af]">{q.letter}</span>
              <span className="text-4xl text-gray-700">({q.word})</span>
            </div>
            {/* Only the letter is pronounced via TTS */}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {q.options.map((symbol, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(symbol)}
                disabled={isAnswered}
                className={`p-4 border-4 rounded-2xl transition-all duration-300 transform hover:scale-105
                  ${isAnswered ? 'opacity-70' : 'bg-gray-50 hover:bg-yellow-100 border-gray-200'}`}
              >
                <span className="text-7xl">{symbol}</span>
              </button>
            ))}
          </div>
          <div className="mt-6 text-2xl font-bold text-[#1e3a8a]">
            Score: {score}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Level3;
