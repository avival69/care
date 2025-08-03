import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";

// The adventure scenes
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
    emoji: '🤸‍♀️',
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

const RT_MAX = 5;        // Reaction time cap (seconds)
const ALPHA = 0.7;       // Choice vs. RT weighting

// Speak scene text if not muted
function speak(text, isMuted) {
  if (typeof window.speechSynthesis === 'undefined') return;
  window.speechSynthesis.cancel();
  if (isMuted || !text) return;
  const utter = new window.SpeechSynthesisUtterance(text);
  utter.rate = 0.93;
  utter.lang = 'en-US';
  window.speechSynthesis.speak(utter);
}

const Level5 = ({ onGoHome, userId }) => {
  const [currentSceneId, setCurrentSceneId] = useState('start');
  const [scores, setScores] = useState([]);
  const [rts, setRts] = useState([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [gameEnded, setGameEnded] = useState(false);
  const [choiceHistory, setChoiceHistory] = useState([]);
  const [isMuted, setIsMuted] = useState(false);

  // DEBUG: track renders/state
  useEffect(() => {
    console.log("--- COMPONENT MOUNT/UPDATE ---");
    console.log("currentSceneId:", currentSceneId);
    console.log("scores:", scores);
    console.log("rts:", rts);
    console.log("choiceHistory:", choiceHistory);
    console.log("gameEnded:", gameEnded);
    console.log("userId:", userId);
  }, [currentSceneId, scores, rts, choiceHistory, gameEnded, userId]);

  // Speak scene on each load except end
  useEffect(() => {
    console.log("useEffect - speak", { currentSceneId, isMuted, gameEnded });
    if (!gameEnded && currentSceneId && story[currentSceneId]) {
      speak(story[currentSceneId].text, isMuted);
    }
    return () => { window.speechSynthesis && window.speechSynthesis.cancel(); };
  }, [currentSceneId, isMuted, gameEnded]);

  // Set timer for RT on each new scene
  useEffect(() => {
    if (!gameEnded) {
      console.log("Starting timer for RT. Scene:", currentSceneId);
      setStartTime(Date.now());
    }
  }, [currentSceneId, gameEnded]);

  // Handle user choice: record RT, choice
  const handleChoice = (choice, idx) => {
    console.log("handleChoice called", choice, idx);
    window.speechSynthesis && window.speechSynthesis.cancel();
    const rt = Math.min((Date.now() - startTime) / 1000, RT_MAX);
    console.log("Calculated RT:", rt, "sec");
    setScores(prev => {
      const arr = [...prev, choice.score];
      console.log("Updated scores:", arr);
      return arr;
    });
    setRts(prev => {
      const arr = [...prev, rt];
      console.log("Updated rts:", arr);
      return arr;
    });
    setChoiceHistory(prev => {
      const arr = [
        ...prev,
        { sceneId: currentSceneId, choiceIdx: idx, score: choice.score, text: choice.text, rt }
      ];
      console.log("Updated choiceHistory:", arr);
      return arr;
    });
    if (choice.nextId === 'end') {
      console.log("End scene reached, setting gameEnded true");
      setGameEnded(true);
    } else {
      setCurrentSceneId(choice.nextId);
    }
  };

  // Restart the story
  const restartGame = () => {
    console.log("Restart game called.");
    setCurrentSceneId('start');
    setScores([]);
    setRts([]);
    setGameEnded(false);
    setChoiceHistory([]);
  };

  // Advanced scoring formula
  function computeResult() {
    const scenes = scores.length;
    const C = scores.reduce((a, b) => a + b, 0);
    const choiceIndex = C / (2 * scenes);
    const avgRT = rts.length ? rts.reduce((a, b) => a + b, 0) / rts.length : 0;
    const rtIndex = Math.min(avgRT, RT_MAX) / RT_MAX;
    const anxietyScore = ALPHA * choiceIndex + (1 - ALPHA) * rtIndex;
    let feedback = '';
    if      (anxietyScore <= 0.25) feedback = "Confident";
    else if (anxietyScore <= 0.6 ) feedback = "Mildly anxious";
    else                           feedback = "High anxiety";
    const isHighAnxiety = anxietyScore > 0.6;
    console.log("computeResult =>", { C, choiceIndex, avgRT, rtIndex, anxietyScore, feedback, isHighAnxiety });
    return { C, choiceIndex, avgRT, rtIndex, anxietyScore, feedback, isHighAnxiety };
  }

  // On game over, upload the session (fixed to use setDoc)
  useEffect(() => {
    if (gameEnded && scores.length > 0 && rts.length > 0) {
      const { anxietyScore, feedback, choiceIndex, avgRT, C, rtIndex, isHighAnxiety } = computeResult();
      const date = new Date().toISOString();
      const session = {
        kid: userId || "unknown",
        date,
        game: "Emotion Adventure",
        anxiety_score: anxietyScore,
        anxiety_feedback: feedback,
        high_anxiety: isHighAnxiety,
        raw_choices: C,
        choice_index: choiceIndex,
        avg_reaction_time: avgRT,
        rt_index: rtIndex,
        choices: choiceHistory,
        status: "Completed",
        timeTaken: rts.reduce((a, b) => a + b, 0),
      };
      // Debug: session object
      console.log("Session to save (upload):", session);

      // Save to localStorage
      try {
        const allSessions = JSON.parse(localStorage.getItem('gameSessions') || '[]');
        allSessions.push(session);
        localStorage.setItem('gameSessions', JSON.stringify(allSessions));
        console.log("Session saved to localStorage!", allSessions);
      } catch (e) {
        console.error("Error saving session to localStorage:", e);
      }
      // Save to Firestore using setDoc with getDoc
      if (userId) {
        const saveSessionWithSetDoc = async () => {
          try {
            const userDocRef = doc(db, "artifacts", "default-app-id", "users", userId);
            const userSnap = await getDoc(userDocRef);
            let existingSessions = [];
            if (userSnap.exists()) {
              const data = userSnap.data();
              existingSessions = Array.isArray(data.sessions) ? data.sessions : [];
              console.log("Fetched existing sessions from db:", existingSessions);
            } else {
              console.log("User doc does not exist, will create.");
            }
            existingSessions.push(session);

            // Debug: Printing the full array that will be uploaded
            console.log("Saving array to Firestore:", existingSessions);
            await setDoc(userDocRef, { sessions: existingSessions }, { merge: true });
            // Debug: Confirm successful upload
            console.log("Session saved to Firestore successfully!");
          } catch (err) {
            console.error("Failed to save session with setDoc:", err);
          }
        };
        saveSessionWithSetDoc();
      } else {
        console.log("No userId; session only saved to localStorage.");
      }
    }
  }, [gameEnded]); // Only run on game end

  const currentScene = story[currentSceneId];

  // Render results screen
  if (gameEnded) {
    const { anxietyScore, feedback, avgRT } = computeResult();
    const niceMsg =
      feedback === "Confident" ? "You're great at handling new situations!"
        : feedback === "Mildly anxious" ? "It's normal to feel a little shy. You did a good job navigating your day!"
          : "New things can feel scary, and that's okay. It's always good to talk about your feelings with a grown-up you trust.";

    console.log("Game ended, rendering results.", { anxietyScore, feedback, avgRT });

    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-purple-100 p-4">
        {/* Top bar with Back and Mute button */}
        <div className="absolute top-4 left-4 flex gap-2 z-20">
          <button
            onClick={onGoHome}
            className="bg-white text-purple-700 px-4 py-2 rounded-xl shadow hover:bg-purple-100 font-semibold flex items-center gap-2"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414L8.293 3.293a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" /></svg>
            Back to Kid List
          </button>
        </div>
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={() => setIsMuted(m => !m)}
            className="bg-white text-purple-700 p-2 rounded-xl shadow hover:bg-purple-100 font-semibold flex items-center"
            aria-label="Mute or unmute text to speech"
          >
            {isMuted ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M6.994 6.994l10.012 10.012M6.994 17.006L17.006 6.994" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m9-9H3" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14" /></svg>
            )}
          </button>
        </div>

        <div className="w-full h-full bg-white rounded-2xl shadow-2xl flex flex-col justify-center items-center p-8 max-w-4xl">
          <span className="text-7xl mb-2 block">🎉</span>
          <h1 className="text-4xl font-bold text-purple-600 mb-2">Adventure Complete!</h1>
          <p className="text-xl text-gray-700 mb-2 font-mono">
            Total anxiety score: <b>{anxietyScore.toFixed(2)}</b><br />
            <span className={
              feedback === "High anxiety" ? "text-red-600 font-bold" :
                feedback === "Mildly anxious" ? "text-yellow-600" :
                  "text-green-700"
            }>
              {feedback}
            </span>
          </p>
          <p className="text-gray-800 my-4 text-lg">{niceMsg}</p>
          <p className="text-purple-900 text-base mt-2 mb-4">
            Average reaction time: <b>{avgRT.toFixed(2)}</b> seconds
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <button
              onClick={restartGame}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-xl transition-transform transform hover:scale-105"
            >
              Play Again
            </button>
            <button
              onClick={onGoHome}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg text-xl"
            >
              Back to Kid List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main in-progress adventure UI
  return (
    <div className="relative min-h-screen w-full flex flex-col bg-gradient-to-br from-yellow-100 to-yellow-200 p-0 text-center">
      {/* Top Left and Top Right buttons */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={onGoHome}
          className="bg-white text-yellow-800 px-4 py-2 rounded-xl shadow hover:bg-yellow-100 font-semibold flex items-center gap-2"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414L8.293 3.293a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" /></svg>
          Back to Kid List
        </button>
      </div>
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setIsMuted(m => !m)}
          className="bg-white text-yellow-800 p-2 rounded-xl shadow hover:bg-yellow-100 font-semibold flex items-center"
          aria-label="Mute or unmute text to speech"
        >
          {isMuted ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M6.994 6.994l10.012 10.012M6.994 17.006L17.006 6.994" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m9-9H3" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14" /></svg>
          )}
        </button>
      </div>

      {/* Full width, responsive, friendly adventure card */}
      <div className="flex flex-col justify-center items-center flex-1 w-full h-full px-3 pt-12 pb-8">
        <div className="w-full h-full bg-white rounded-2xl shadow-2xl flex flex-col items-center justify-center p-8 max-w-4xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-yellow-800 mb-2">Level 5: Emotion Adventure</h1>
          <p className="text-xl text-gray-600 mb-8">Navigate the story by making choices. Try to answer as quickly as you can!</p>
          <div className="mb-8 w-full flex flex-col items-center">
            <span className="text-8xl">{currentScene.emoji}</span>
            <p className="text-2xl text-gray-700 mt-4">{currentScene.text}</p>
          </div>
          <div className="flex flex-col justify-center items-center gap-4 w-full mt-2">
            {currentScene.choices.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => handleChoice(choice, idx)}
                className="w-full max-w-xl bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold py-4 px-6 rounded-xl text-lg transition-transform transform hover:scale-105 shadow-md"
              >
                {choice.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Level5;
