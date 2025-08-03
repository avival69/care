import React, { useState } from 'react';

// The story is structured as a series of scenes. Each scene has text, an emoji, and choices.
const story = {
  start: {
    id: 'start',
    emoji: '☀',
    text: "It's the first day at your new school! You wake up and think about the day ahead. How do you feel?",
    choices: [
      { text: "Excited to meet new friends!", nextId: 'school_arrival', score: 0 },
      { text: "A little nervous, but it will be okay.", nextId: 'school_arrival', score: 1 },
      { text: "My tummy hurts. I don't want to go.", nextId: 'school_arrival', score: 2 },
    ],
  },
  school_arrival: {
    id: 'school_arrival',
    emoji: '🏫',
    text: "You arrive at school. The building is huge! You see lots of kids playing outside. What do you do?",
    choices: [
      { text: "Run over and join a game!", nextId: 'meet_teacher', score: 0 },
      { text: "Walk quietly to the entrance by yourself.", nextId: 'meet_teacher', score: 1 },
      { text: "Ask your parent to walk in with you.", nextId: 'meet_teacher', score: 2 },
    ],
  },
  meet_teacher: {
    id: 'meet_teacher',
    emoji: '👩‍🏫',
    text: "You find your classroom. Your new teacher, Ms. Davis, has a big, friendly smile. She says, 'Welcome! Please introduce yourself to the class.'",
    choices: [
      { text: "Say 'Hi everyone!' with a big wave.", nextId: 'recess', score: 0 },
      { text: "Quietly say your name and look at the floor.", nextId: 'recess', score: 1 },
      { text: "Hide behind your parent and don't say anything.", nextId: 'recess', score: 2 },
    ],
  },
  recess: {
    id: 'recess',
    emoji: '🤸‍♀',
    text: "It's recess! A group of kids asks you to play on the swings. What do you do?",
    choices: [
      { text: "Say 'Yes! I love swings!' and join them.", nextId: 'end', score: 0 },
      { text: "Say 'no thanks' and find a quiet spot to sit.", nextId: 'end', score: 2 },
      { text: "Just watch them for a while to see if it looks fun.", nextId: 'end', score: 1 },
    ],
  },
  end: {
    id: 'end',
    emoji: '🎉',
    text: "You made it through the first day!",
    choices: [],
  },
};

const Level5 = () => {
  const [currentSceneId, setCurrentSceneId] = useState('start');
  const [anxietyScore, setAnxietyScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);

  // Function to handle the user's choice
  const handleChoice = (choice) => {
    setAnxietyScore(prevScore => prevScore + choice.score);
    if (choice.nextId === 'end') {
      setGameEnded(true);
    } else {
      setCurrentSceneId(choice.nextId);
    }
  };

  // Function to restart the game
  const restartGame = () => {
    setCurrentSceneId('start');
    setAnxietyScore(0);
    setGameEnded(false);
  };

  // Function to get the final feedback message based on the score
  const getFeedback = () => {
    if (anxietyScore <= 2) {
      return "You were brave and confident! You're great at handling new situations.";
    }
    if (anxietyScore <= 5) {
      return "It's normal to feel a little shy sometimes. You did a good job navigating your day!";
    }
    return "New things can feel scary, and that's okay. It's always good to talk about your feelings with a grown-up you trust.";
  };

  const currentScene = story[currentSceneId];

  // Render the final results screen
  if (gameEnded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-purple-100 p-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-lg w-full">
          <h1 className="text-4xl font-bold text-purple-600 mb-4">Adventure Complete!</h1>
          <p className="text-xl text-gray-700 mb-4">Your final anxiety score is: {anxietyScore}</p>
          <p className="text-2xl text-purple-800 font-semibold mb-6">{getFeedback()}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={restartGame}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-xl transition-transform transform hover:scale-105"
            >
              Play Again
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg text-xl transition-transform transform hover:scale-105"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render the main story adventure screen
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-50 p-4 text-center">
      <h1 className="text-3xl font-bold text-yellow-800 mb-2">Level 5: Emotion Adventure</h1>
      <p className="text-xl text-gray-600 mb-6">Navigate the story by making choices.</p>

      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="mb-8">
          <span className="text-8xl">{currentScene.emoji}</span>
          <p className="text-2xl text-gray-700 mt-4">{currentScene.text}</p>
        </div>

        <div className="flex flex-col gap-4">
          {currentScene.choices.map((choice, index) => (
            <button
              key={index}
              onClick={() => handleChoice(choice)}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold py-4 px-6 rounded-xl text-lg transition-transform transform hover:scale-105 shadow-md"
            >
              {choice.text}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={() => window.location.href = '/dashboard'}
        className="mt-8 bg-white py-2 px-4 rounded-lg shadow-md text-yellow-700 hover:bg-yellow-50"
      >
        Exit Game
      </button>
    </div>
  );
};

export default Level5;