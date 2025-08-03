import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { LightBulbIcon, ArrowLeftIcon, SpeakerWaveIcon, SpeakerXMarkIcon, TrophyIcon } from '@heroicons/react/24/solid';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";

// ----- Sound/Speech helpers -----
const speak = (text, isMuted) => {
  if (isMuted || typeof window.speechSynthesis === 'undefined') return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
};
const playSound = (type, isMuted) => {
  if (isMuted || typeof window.Tone === 'undefined') return;
  const synth = new window.Tone.Synth().toDestination();
  if (type === 'correct') synth.triggerAttackRelease("C5", "8n");
};

// ----- Face Emotion Detector -----
const FaceEmotionDetector = ({ onExpressionChange }) => {
  const videoRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    const loadContent = async () => {
      const MODEL_URL = '/models';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch {}
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraOn(true);
        }
      } catch {}
    };
    loadContent();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  const handleVideoPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || !modelsLoaded) return;
      const detections = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceExpressions();
      if (detections) {
        const dominantExpression = Object.keys(detections.expressions).reduce(
          (a, b) => detections.expressions[a] > detections.expressions[b] ? a : b
        );
        onExpressionChange(dominantExpression);
      }
    }, 500);
  };
  return (
    <div className="absolute bottom-4 right-4 bg-black p-1 rounded-2xl shadow-2xl border-2 border-gray-400 w-64 h-48 flex items-center justify-center overflow-hidden">
      {!isCameraOn && <div className="text-white text-xs text-center p-2">Starting Camera...</div>}
      <video
        ref={videoRef}
        autoPlay
        muted
        onPlay={handleVideoPlay}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
          display: isCameraOn ? 'block' : 'none'
        }}
      />
    </div>
  );
};

// ----- Game UI components -----
const AnimalCharacter = ({ emotion }) => {
  const getEmoji = () => {
    switch (emotion) {
      case 'happy': return '😊';
      case 'sad': return '😢';
      case 'surprised': return '😮';
      case 'neutral': return '😐';
      default: return '🙂';
    }
  };
  return (
    <div className="flex flex-col items-center">
      <div className="text-9xl mb-4">{getEmoji()}</div>
      <p className="text-3xl text-gray-800 font-semibold text-center">
        Now, show me a <span className="text-blue-600 capitalize font-bold">{emotion}</span> face!
      </p>
    </div>
  );
};

const Confetti = () => null;

const InstructionsModal = ({ onStart }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full text-center overflow-hidden transform transition-all animate-fade-in-up">
      <div className="bg-blue-500 p-8">
        <LightBulbIcon className="h-20 w-20 text-white/80 mx-auto" />
      </div>
      <div className="p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-3">How to Play</h2>
        <p className="text-gray-600 text-lg mb-6">
          Look at the emoji on the screen. Try to make the same face in your camera to match the expression!
        </p>
        <button
          onClick={onStart}
          className="w-full px-8 py-3 bg-green-500 text-white font-bold rounded-xl text-lg hover:bg-green-600 transition-all transform hover:scale-105 shadow-lg"
        >Start the Game</button>
      </div>
    </div>
  </div>
);

const EndScreen = ({ onRestart, onExit }) => (
  <div className="relative w-full max-w-lg text-center">
    <Confetti />
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all animate-fade-in-up">
      <div className="bg-amber-400 p-8"><TrophyIcon className="h-20 w-20 text-white/80 mx-auto" /></div>
      <div className="p-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Well Done!</h1>
        <p className="text-lg text-gray-600 mb-8">You're an emotion matching expert!</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button onClick={onRestart} className="px-8 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all transform hover:scale-105">Play Again</button>
          <button onClick={onExit} className="px-8 py-3 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 transition-all transform hover:scale-105">Back to Home</button>
        </div>
      </div>
    </div>
  </div>
);

export default function Level2({ onGoHome, user }) {
  const emotionsToGuess = ['happy', 'surprised', 'sad', 'neutral'];
  const [gameState, setGameState] = useState('instructions');
  const [currentEmotionIndex, setCurrentEmotionIndex] = useState(0);
  const [detectedExpression, setDetectedExpression] = useState('none');
  const [trials, setTrials] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  const currentEmotion = emotionsToGuess[currentEmotionIndex];

  useEffect(() => {
    if (gameState === 'playing') setStartTime(Date.now());
  }, [currentEmotionIndex, gameState]);

  useEffect(() => {
    if (gameState === 'instructions') {
      speak(
        "How to Play. Look at the emoji on the screen. Try to make the same face in your camera to match the expression!",
        isMuted
      );
    }
    return () => window.speechSynthesis.cancel();
  }, [gameState, isMuted]);

  useEffect(() => {
    if (gameState !== 'playing' || !currentEmotion) return;
    if (detectedExpression === currentEmotion) {
      playSound('correct', isMuted);
      const rt = (Date.now() - startTime) / 1000;
      setTrials(prev => [...prev, { is_correct: true, response_time: rt }]);
      setGameState('feedback');
      setTimeout(() => {
        const nextIndex = currentEmotionIndex + 1;
        if (nextIndex >= emotionsToGuess.length) {
          setGameState('end');
        } else {
          setCurrentEmotionIndex(nextIndex);
          setDetectedExpression('none');
          setGameState('playing');
        }
      }, 1500);
    }
  }, [detectedExpression, currentEmotion, gameState, currentEmotionIndex, isMuted, startTime, emotionsToGuess.length]);

  // ----- Key change: save with setDoc -----
  useEffect(() => {
    if (gameState !== 'end' || trials.length !== emotionsToGuess.length) return;
    const total_trials = trials.length;
    const correct_count = trials.filter(trial => trial.is_correct).length;
    const correct_rts = trials.filter(t => t.is_correct).map(t => t.response_time);
    const avg_response_time = correct_rts.length
      ? correct_rts.reduce((a, b) => a + b, 0) / correct_rts.length
      : 0;
    const EXPECTED_RT = 1.5, MAX_SCORE = total_trials, A = 1, B = 2;
    const inaccuracy = MAX_SCORE - correct_count;
    const delay = Math.max(0, (avg_response_time ?? 0) - EXPECTED_RT);
    const risk_score = A * inaccuracy + B * delay;
    const kidName = user || "unknown";
    const session = {
      kid: kidName,
      date: new Date().toISOString(),
      game: "Emotion Detector",
      trials,
      correct_count,
      total_trials,
      avg_response_time,
      risk_score,
      accuracy_percent: (correct_count / total_trials) * 100,
      status: "Completed",
      score: correct_count,
      timeTaken: trials.reduce((sum, t) => sum + t.response_time, 0),
    };
    // Firestore saving using setDoc
    const saveWithSetDoc = async () => {
      try {
        const userDocRef = doc(db, "artifacts", "default-app-id", "users", kidName);
        const userSnap = await getDoc(userDocRef);
        let sessions = [];
        if (userSnap.exists()) {
          const data = userSnap.data();
          sessions = data.sessions || [];
        }
        sessions.push(session);
        await setDoc(userDocRef, { sessions }, { merge: true });
      } catch (e) {
        console.error("Failed saving session:", e);
      }
    };
    saveWithSetDoc();

    // Save to localStorage, unchanged
    const allSessions = JSON.parse(localStorage.getItem('gameSessions') || '[]');
    allSessions.push(session);
    localStorage.setItem('gameSessions', JSON.stringify(allSessions));
  }, [gameState, trials, user, emotionsToGuess.length]);

  const startGame = () => {
    window.speechSynthesis.cancel();
    setTrials([]);
    setCurrentEmotionIndex(0);
    setDetectedExpression('none');
    setGameState('playing');
  };
  const handleReset = () => {
    setCurrentEmotionIndex(0);
    setDetectedExpression('none');
    setTrials([]);
    setGameState('instructions');
  };
  const toggleMute = () => setIsMuted(m => !m);

  return (
    <div className="relative w-full min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-poppins overflow-hidden">
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob"></div>
      <div className="absolute top-0 -right-1/4 w-96 h-96 bg-amber-300 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute top-6 left-6 z-20">
        <button onClick={onGoHome} className="flex items-center gap-2 bg-white/70 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-xl shadow-md hover:bg-white transition-all">
          <ArrowLeftIcon className="h-5 w-5" /> Home
        </button>
      </div>
      <div className="absolute top-6 right-6 z-20">
        <button onClick={toggleMute} className="flex items-center gap-2 bg-white/70 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-xl shadow-md hover:bg-white transition-all">
          {isMuted ? <SpeakerXMarkIcon className="h-5 w-5" /> : <SpeakerWaveIcon className="h-5 w-5" />}
        </button>
      </div>
      {gameState === 'instructions' && <InstructionsModal onStart={startGame} />}
      {gameState === 'end' && <EndScreen onRestart={handleReset} onExit={onGoHome} />}
      {(gameState === 'playing' || gameState === 'feedback') && (
        <div className="text-center animate-fade-in-up">
          {gameState === 'feedback'
            ? <div><h2 className="text-5xl font-bold text-green-500">Great!</h2></div>
            : <AnimalCharacter emotion={emotionsToGuess[currentEmotionIndex]} />}
        </div>
      )}
      <FaceEmotionDetector onExpressionChange={setDetectedExpression} />
      {(gameState === 'playing' || gameState === 'feedback') && (
        <div className="absolute bottom-4 left-4 flex space-x-2">
          {emotionsToGuess.map((_, idx) => (
            <div key={idx} className={`w-10 h-3 rounded-full ${
              idx < currentEmotionIndex ? 'bg-green-500' : 'bg-gray-300'
            } transition-colors`}></div>
          ))}
        </div>
      )}
      <style>{`
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
        @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>
    </div>
  );
}
