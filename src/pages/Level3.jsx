import React, { useState, useEffect } from 'react';

// Data for the game: letter, the correct matching symbol (as an emoji), and a word hint.
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

// A pool of all possible symbols to be used as distracting options.
const allSymbols = ['🍎', '⚽', '🐱', '�', '🐘', '🐟', '🍇', '👒', '🚗', '⭐', '🌙', '☀', '🍕', '🎁'];

// Helper function to shuffle an array. This is the Fisher-Yates shuffle algorithm.
const shuffleArray = (array) => {
  let currentIndex = array.length,  randomIndex;
  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
};

const Level3 = ({ onGoHome }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [message, setMessage] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Function to generate a new set of questions for the game
  const generateQuestions = () => {
    const shuffledData = shuffleArray([...gameData]);
    const newQuestions = shuffledData.map((item) => {
      // Filter out the correct symbol to create a pool of wrong options
      const wrongOptionsPool = allSymbols.filter(s => s !== item.symbol);
      // Shuffle the wrong options and pick the first 3
      const wrongOptions = shuffleArray(wrongOptionsPool).slice(0, 3);
      // Combine the correct answer with the wrong ones and shuffle them
      const options = shuffleArray([item.symbol, ...wrongOptions]);
      return { ...item, options };
    });
    setQuestions(newQuestions);
  };

  // Function to start or restart the game
  const startGame = () => {
    setGameOver(false);
    setScore(0);
    setCurrentQuestionIndex(0);
    setReactionTimes([]);
    setMessage('');
    setIsAnswered(false);
    generateQuestions();
  };

  // Start the game on the initial component mount
  useEffect(() => {
    startGame();
  }, []);

  // Set the start time whenever a new question is presented
  useEffect(() => {
    if (questions.length > 0 && !gameOver) {
      setStartTime(Date.now());
      setIsAnswered(false);
      setMessage('');
    }
  }, [currentQuestionIndex, questions, gameOver]);


  // Handles the user's answer selection
  const handleAnswer = (selectedSymbol) => {
    if (isAnswered) return; // Prevent multiple clicks while waiting for the next question

    setIsAnswered(true);
    const correctSymbol = questions[currentQuestionIndex].symbol;

    if (selectedSymbol === correctSymbol) {
      // Calculate reaction time in seconds
      const reactionTime = (Date.now() - startTime) / 1000;
      setReactionTimes(prev => [...prev, reactionTime]);
      setScore(prev => prev + 1);
      setMessage('Correct! 🎉');
    } else {
      setMessage(`Not quite! The right answer was ${correctSymbol}.`);
    }

    // Wait for 2 seconds before moving to the next question or ending the game
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setGameOver(true);
      }
    }, 2000);
  };

  // Render the game-over screen
  if (gameOver) {
    const averageReactionTime = reactionTimes.length > 0
      ? (reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length).toFixed(2)
      : 0;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br from-[#f0f4f8] to-[#dbeafe] p-4 font-poppins">
        <div className="text-center bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
          <h1 className="text-4xl font-bold text-[#1e3a8a] mb-4">Game Over!</h1>
          <p className="text-xl text-gray-700 mb-2">Final Score: <span className="font-bold">{score} / {questions.length}</span></p>
          <p className="text-xl text-gray-700 mb-6">Average Reaction: <span className="font-bold">{averageReactionTime}s</span></p>
          <button
            onClick={startGame}
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-3 px-6 rounded-lg text-xl transition-transform transform hover:scale-105"
          >
            Play Again
          </button>
           <button 
             onClick={onGoHome} 
             className="block w-full text-center mt-4 text-gray-600 hover:text-[#1e3a8a] hover:underline"
           >
            Back to Home
           </button>
        </div>
      </div>
    );
  }

  // Show a loading screen while questions are being generated
  if (questions.length === 0) {
    return <div className="flex items-center justify-center min-h-screen">Loading Game...</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  // Render the main game screen
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
                Back to Home
            </button>
        </div>

      <div className="w-full max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-[#1e3a8a] mb-2">Level 3: Letter-Sound Matching</h1>
        <p className="text-xl text-gray-600 mb-8">Match the letter to the picture that starts with that sound.</p>

        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full">
            <div className="mb-8">
                <p className="text-2xl text-gray-500 mb-2">Find the match for:</p>
                <div className="flex items-center justify-center space-x-4">
                    <span className="text-8xl font-bold text-[#1e40af]">{currentQuestion.letter}</span>
                    <span className="text-4xl text-gray-700">({currentQuestion.word})</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {currentQuestion.options.map((symbol, index) => (
                    <button
                        key={index}
                        onClick={() => handleAnswer(symbol)}
                        disabled={isAnswered}
                        className={`p-4 border-4 rounded-2xl transition-all duration-300 transform hover:scale-105 
                            ${isAnswered ? 
                                (symbol === currentQuestion.symbol ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500 opacity-50') :
                                'bg-gray-50 hover:bg-yellow-100 border-gray-200'
                            }`}
                    >
                        <span className="text-7xl">{symbol}</span>
                    </button>
                ))}
            </div>

            {message && <p className={`mt-6 text-3xl font-semibold ${message.includes('Correct') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}

            <div className="mt-6 text-2xl font-bold text-[#1e3a8a]">
                Score: {score}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Level3;
