import React, { useState, useEffect, useRef, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase"; // Adjust path if needed

const ALL_SYMBOLS = [
  "⭐", "🌙", "☀️", "❤️", "💎", "🚀", "🍎", "⚽", "🐱", "🦋",
  "🎈", "🍓", "🔑", "🎸", "☂️", "🍕", "🎁"
];

const GAME_DURATION_MS = 30000;
const TARGET_PROBABILITY = 0.3;
const OBJECT_SPAWN_INTERVAL_MS = 700;
const OBJECT_SPEED_MULTIPLIER = 1.2;
const HIT_ZONE_SIZE = 200;

const GameReport = ({ onRestart, onGoHome }) => (
  <div className="w-full max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-lg text-center animate-fade-in z-10">
    <h2 className="text-3xl font-bold text-indigo-700 mb-4">Good Game!</h2>
    <p className="text-lg mb-6 text-indigo-800">Thanks for playing! Ready to try again?</p>
    <div className="flex justify-center gap-4">
      <button
        onClick={onRestart}
        className="px-6 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition"
      >
        Play Again
      </button>
      <button
        onClick={onGoHome}
        className="px-6 py-3 bg-gray-400 text-white rounded-full font-semibold hover:bg-gray-500 transition"
      >
        Back to Home
      </button>
    </div>
  </div>
);

export default function Level4({ onGoHome, userId }) {
  const [gameState, setGameState] = useState("intro");
  const [targetSymbol, setTargetSymbol] = useState(null);
  const [stats, setStats] = useState({
    hits: 0,
    misses: 0,
    falseAlarms: 0,
    totalTargets: 0,
    trials: [],
  });
  const [feedback, setFeedback] = useState("");

  const canvasRef = useRef(null);
  const gameObjectsRef = useRef([]);
  const animationFrameId = useRef();
  const spawnIntervalId = useRef();
  const gameTimeoutId = useRef();

  // Debug: Log state transitions
  useEffect(() => {
    console.log("[Level4 DEBUG] gameState:", gameState, "| targetSymbol:", targetSymbol, "| userId:", userId);
  }, [gameState, targetSymbol, userId]);

  // Cleanup all timers/loops
  const cleanup = () => {
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    if (spawnIntervalId.current) clearInterval(spawnIntervalId.current);
    if (gameTimeoutId.current) clearTimeout(gameTimeoutId.current);
  };

  const startGame = () => {
    cleanup();
    const newTargetSymbol = ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];
    setTargetSymbol(newTargetSymbol);
    setStats({
      hits: 0,
      misses: 0,
      falseAlarms: 0,
      totalTargets: 0,
      trials: [],
    });
    gameObjectsRef.current = [];
    setGameState("playing");
    console.log("[Level4 DEBUG] Game started. New target:", newTargetSymbol);
  };

  const spawnObject = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isTarget = Math.random() < TARGET_PROBABILITY;
    const symbol = isTarget
      ? targetSymbol
      : ALL_SYMBOLS.filter((s) => s !== targetSymbol)[
          Math.floor(Math.random() * (ALL_SYMBOLS.length - 1))
        ];
    if (isTarget) {
      setStats((prev) => ({ ...prev, totalTargets: prev.totalTargets + 1 }));
      console.log("[Level4 DEBUG] Spawned TARGET symbol:", symbol);
    }
    // Random edge start position
    const edges = [
      () => ({ x: Math.random() * canvas.width, y: -30 }),
      () => ({ x: canvas.width + 30, y: Math.random() * canvas.height }),
      () => ({ x: Math.random() * canvas.width, y: canvas.height + 30 }),
      () => ({ x: -30, y: Math.random() * canvas.height }),
    ];
    const { x: startX, y: startY } = edges[Math.floor(Math.random() * 4)]();

    // Random target in hit zone
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const targetX = centerX + (Math.random() - 0.5) * HIT_ZONE_SIZE * 0.8;
    const targetY = centerY + (Math.random() - 0.5) * HIT_ZONE_SIZE * 0.8;

    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const vx = (dx / dist) * OBJECT_SPEED_MULTIPLIER;
    const vy = (dy / dist) * OBJECT_SPEED_MULTIPLIER;

    gameObjectsRef.current.push({
      x: startX,
      y: startY,
      vx,
      vy,
      symbol,
      isTarget,
      hasBeenInZone: false,
      startTime: Date.now(),
    });
  }, [targetSymbol]);

  // The animation/game loop
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const zoneX = (canvas.width - HIT_ZONE_SIZE) / 2;
    const zoneY = (canvas.height - HIT_ZONE_SIZE) / 2;

    gameObjectsRef.current.forEach((obj, idx) => {
      obj.x += obj.vx;
      obj.y += obj.vy;

      ctx.font = "50px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(obj.symbol, obj.x, obj.y);

      if (
        obj.x > zoneX &&
        obj.x < zoneX + HIT_ZONE_SIZE &&
        obj.y > zoneY &&
        obj.y < zoneY + HIT_ZONE_SIZE
      ) {
        obj.hasBeenInZone = true;
      }
      if (
        obj.x < -40 ||
        obj.x > canvas.width + 40 ||
        obj.y < -40 ||
        obj.y > canvas.height + 40
      ) {
        if (obj.isTarget && obj.hasBeenInZone) {
          setStats((prev) => ({ ...prev, misses: prev.misses + 1 }));
          console.log("[Level4 DEBUG] Missed a TARGET symbol.");
        }
        gameObjectsRef.current.splice(idx, 1);
      }
    });
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, []);

  // Start or cleanup game on state change
  useEffect(() => {
    if (gameState === "playing") {
      animationFrameId.current = requestAnimationFrame(gameLoop);
      spawnIntervalId.current = setInterval(spawnObject, OBJECT_SPAWN_INTERVAL_MS);
      gameTimeoutId.current = setTimeout(() => {
        console.log("[Level4 DEBUG] Time up! Moving to report.");
        setGameState("report");
      }, GAME_DURATION_MS);
    }
    return cleanup;
  }, [gameState, gameLoop, spawnObject]);

  const handleClickZone = () => {
    if (gameState !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const zoneX = (canvas.width - HIT_ZONE_SIZE) / 2;
    const zoneY = (canvas.height - HIT_ZONE_SIZE) / 2;

    const targetObj = gameObjectsRef.current.find(
      (obj) =>
        obj.isTarget &&
        obj.x > zoneX &&
        obj.x < zoneX + HIT_ZONE_SIZE &&
        obj.y > zoneY &&
        obj.y < zoneY + HIT_ZONE_SIZE
    );
    if (targetObj) {
      setStats((prev) => ({
        ...prev,
        hits: prev.hits + 1,
        trials: [...prev.trials, { is_correct: true, response_time: (Date.now() - targetObj.startTime) / 1000 }],
      }));
      setFeedback("correct");
      console.log("[Level4 DEBUG] Correct click! Hit target symbol.");
      gameObjectsRef.current = gameObjectsRef.current.filter((o) => o !== targetObj);
    } else {
      setStats((prev) => ({
        ...prev,
        falseAlarms: prev.falseAlarms + 1,
        trials: [...prev.trials, { is_correct: false, response_time: 0 }],
      }));
      setFeedback("incorrect");
      console.log("[Level4 DEBUG] Incorrect click (false alarm).");
    }
    setTimeout(() => setFeedback(""), 300);
  };

  // Resize canvas to window size
  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Save session data to localStorage and Firestore on report, with debug logs
  useEffect(() => {
    console.log("[Level4 DEBUG] Session save effect running...", { gameState, totalTargets: stats.totalTargets });
    if (gameState !== "report" || stats.totalTargets === 0) return;

    const sessionObj = {
      kid: userId || "unknown",
      date: new Date().toISOString(),
      game: "Symbol Spotter",
      hits: stats.hits,
      misses: stats.misses,
      falseAlarms: stats.falseAlarms,
      totalTargets: stats.totalTargets,
      trials: stats.trials,
      score: stats.hits,
      status: "Completed",
      timeTaken: GAME_DURATION_MS / 1000,
    };

    console.log("[Level4 DEBUG] About to save session:", sessionObj);

    // Save to localStorage
    try {
      const localSessions = JSON.parse(localStorage.getItem("gameSessions") || "[]");
      localSessions.push(sessionObj);
      localStorage.setItem("gameSessions", JSON.stringify(localSessions));
      console.log("[Level4 DEBUG] Saved session to localStorage:", sessionObj);
    } catch (err) {
      console.error("🔥 [Level4 DEBUG] Error saving to localStorage:", err, sessionObj);
    }

    // Save to Firestore using setDoc with getDoc to merge safely
    if (userId) {
      const saveSessionWithSetDoc = async () => {
        try {
          const userDocRef = doc(db, "artifacts", "default-app-id", "users", userId);
          const userSnap = await getDoc(userDocRef);
          let existingSessions = [];
          if (userSnap.exists()) {
            const data = userSnap.data();
            existingSessions = Array.isArray(data.sessions) ? data.sessions : [];
          }
          existingSessions.push(sessionObj);
          await setDoc(userDocRef, { sessions: existingSessions }, { merge: true });
          console.log("✅ [Level4 DEBUG] Saved session with setDoc to Firestore:", sessionObj);
        } catch (err) {
          console.error("🔥 [Level4 DEBUG] Failed to save session with setDoc:", err, sessionObj);
        }
      };
      saveSessionWithSetDoc();
    } else {
      console.warn("⚠️ [Level4 DEBUG] Skipping Firestore save: userId is", userId);
    }
  }, [gameState, stats, userId]);

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4 font-sans overflow-hidden">
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => {
            console.log("[Level4 DEBUG] Manual exit to Home.");
            onGoHome();
          }}
          className="bg-white text-gray-900 px-4 py-2 rounded-lg shadow-md hover:bg-gray-200 flex items-center space-x-2"
          aria-label="Back to Home"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 inline">
            <path d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414L8.293 3.293a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" />
          </svg>
          <span>Back to Home</span>
        </button>
      </div>
      {gameState === "intro" && (
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md animate-fade-in">
          <h1 className="text-4xl font-bold mb-4 text-indigo-900">Symbol Spotter</h1>
          <p className="mb-6 text-indigo-700 text-lg">
            Symbols will fly in. Tap the box <b>only</b> when the special symbol is in the center.
          </p>
          <button
            onClick={() => {
              console.log("[Level4 DEBUG] Start Game button clicked.");
              startGame();
            }}
            className="bg-indigo-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-indigo-700 transition"
          >
            Start Game
          </button>
        </div>
      )}

      {gameState === "playing" && (
        <>
          <div className="absolute top-4 text-center z-10 w-full max-w-md mx-auto bg-white bg-opacity-80 backdrop-blur-sm rounded-md p-3 select-none pointer-events-none">
            <p className="text-2xl font-semibold text-indigo-900">Spot the symbol: {targetSymbol}</p>
          </div>
          <canvas
            ref={canvasRef}
            width={window.innerWidth}
            height={window.innerHeight}
            className="absolute top-0 left-0 w-full h-full z-30 pointer-events-none"
          />
          <div
            onClick={() => {
              console.log("[Level4 DEBUG] Hit zone was clicked.");
              handleClickZone();
            }}
            className={`absolute rounded-3xl cursor-pointer transition-all duration-200 select-none
              ${feedback === "correct" ? "bg-green-300 ring-4 ring-green-600" : ""}
              ${feedback === "incorrect" ? "bg-red-300 ring-4 ring-red-600" : ""}
              ${!feedback ? "bg-indigo-100 ring-2 ring-indigo-300" : ""}
              `}
            style={{
              width: HIT_ZONE_SIZE,
              height: HIT_ZONE_SIZE,
              top: `calc(50% - ${HIT_ZONE_SIZE / 2}px)`,
              left: `calc(50% - ${HIT_ZONE_SIZE / 2}px)`,
            }}
          />
        </>
      )}

      {gameState === "report" && (
        <GameReport
          onRestart={() => {
            console.log("[Level4 DEBUG] Play Again clicked.");
            startGame();
          }}
          onGoHome={() => {
            console.log("[Level4 DEBUG] Report - Back to Home clicked.");
            onGoHome();
          }}
        />
      )}

      <style>{`
        .animate-fade-in {
          animation: fade-in 0.5s ease forwards;
        }
        @keyframes fade-in {
          from { opacity: 0;}
          to { opacity: 1;}
        }
      `}</style>
    </div>
  );
}
