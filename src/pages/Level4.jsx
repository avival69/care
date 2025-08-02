import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Game Configuration ---
const ALL_SYMBOLS = ['⭐', '🌙', '☀️', '❤️', '💎', '🚀', '🍎', '⚽', '🐱', '🦋', '🎈', '�', '🍓', '🔑', '🎸', '☂️', '🍕', '🎁'];
const GAME_DURATION_MS = 30000; // 30 seconds
const TARGET_PROBABILITY = 0.3; // 30% chance for a new object to be the target
const OBJECT_SPAWN_INTERVAL_MS = 700; // Spawn objects more frequently
const OBJECT_SPEED_MULTIPLIER = 1.2; // Controls the speed of the objects
const HIT_ZONE_SIZE = 200; // The size of the central box

// --- Helper Components ---

const GameReport = ({ stats, onRestart, onGoHome }) => {
    const { hits, misses, falseAlarms, totalTargets } = stats;
    const accuracy = totalTargets > 0 ? ((hits / totalTargets) * 100).toFixed(0) : 0;

    const getInterpretation = () => {
        const inattentionScore = misses;
        const impulsivityScore = falseAlarms;

        if (inattentionScore > totalTargets / 2 && totalTargets > 2) {
            return "The results show a number of missed targets, which might suggest challenges with sustained attention. It could be helpful to discuss these observations with a specialist.";
        }
        if (impulsivityScore > 5) {
            return "There were several presses when the target wasn't in the zone. This pattern can sometimes be associated with impulsivity. A consultation with a pediatrician or specialist may be beneficial.";
        }
        if (accuracy < 60 && totalTargets > 3) {
            return "The overall accuracy was a bit low. This could indicate some difficulty with this type of focus task. Further evaluation with a professional is recommended.";
        }
        return "Excellent focus and great job spotting the targets! The performance indicates strong sustained attention and good impulse control.";
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-6 md:p-8 bg-white rounded-2xl shadow-2xl text-center animate-fade-in z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a8a] mb-4">Game Report</h2>
            <div className="p-4 rounded-lg mb-6 bg-blue-50">
                <h3 className="text-xl font-semibold mb-2 text-[#1e40af]">Interpretation</h3>
                <p className="text-lg text-[#1e3a8a]">{getInterpretation()}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center bg-gray-50 p-4 rounded-lg mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-700">Correct Hits</h3>
                    <p className="text-3xl font-bold text-green-600">{hits}</p>
                    <p className="text-sm text-gray-500">out of {totalTargets} targets</p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-700">Missed Targets</h3>
                    <p className="text-3xl font-bold text-orange-500">{misses}</p>
                    <p className="text-sm text-gray-500">Inattention metric</p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-700">False Alarms</h3>
                    <p className="text-3xl font-bold text-red-600">{falseAlarms}</p>
                    <p className="text-sm text-gray-500">Impulsivity metric</p>
                </div>
            </div>
            <p className="text-xs text-gray-400 mb-6">Disclaimer: This is a screening tool, not a diagnostic test. Results should be discussed with a qualified healthcare professional.</p>
            <div className="flex justify-center gap-4">
                <button onClick={onRestart} className="px-8 py-3 bg-[#3b82f6] text-white font-bold rounded-full hover:bg-[#2563eb] transition-all transform hover:scale-105">Play Again</button>
                <button onClick={onGoHome} className="px-8 py-3 bg-gray-600 text-white font-bold rounded-full hover:bg-gray-700 transition-all transform hover:scale-105">Back to Home</button>
            </div>
        </div>
    );
};

// --- Main Level 4 Component ---

export default function Level4({ onGoHome }) {
    const [gameState, setGameState] = useState('intro');
    const [targetSymbol, setTargetSymbol] = useState(null);
    const [stats, setStats] = useState({ hits: 0, misses: 0, falseAlarms: 0, totalTargets: 0 });
    const [feedback, setFeedback] = useState(''); // 'correct', 'incorrect'

    const canvasRef = useRef(null);
    const gameObjectsRef = useRef([]);
    const animationFrameId = useRef(null);
    const gameTimeoutId = useRef(null);
    const objectIntervalId = useRef(null);

    const cleanup = () => {
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        if (gameTimeoutId.current) clearTimeout(gameTimeoutId.current);
        if (objectIntervalId.current) clearInterval(objectIntervalId.current);
    };

    const startGame = () => {
        cleanup();
        const newTarget = ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];
        setTargetSymbol(newTarget);
        setStats({ hits: 0, misses: 0, falseAlarms: 0, totalTargets: 0 });
        gameObjectsRef.current = [];
        setGameState('playing');
    };
    
    const spawnObject = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const isTarget = Math.random() < TARGET_PROBABILITY;
        const symbol = isTarget ? targetSymbol : ALL_SYMBOLS.filter(s => s !== targetSymbol)[Math.floor(Math.random() * (ALL_SYMBOLS.length - 1))];
        
        if (isTarget) {
            setStats(prev => ({ ...prev, totalTargets: prev.totalTargets + 1 }));
        }

        let startX, startY;
        const edge = Math.floor(Math.random() * 4);
        switch (edge) {
            case 0: startX = Math.random() * canvas.width; startY = -30; break; // Top
            case 1: startX = canvas.width + 30; startY = Math.random() * canvas.height; break; // Right
            case 2: startX = Math.random() * canvas.width; startY = canvas.height + 30; break; // Bottom
            default: startX = -30; startY = Math.random() * canvas.height; break; // Left
        }

        // Define the center of the hit zone
        const zoneCenterX = canvas.width / 2;
        const zoneCenterY = canvas.height / 2;

        // Aim for a random point within the hit zone to create variation
        const targetX = zoneCenterX + (Math.random() - 0.5) * HIT_ZONE_SIZE * 0.8;
        const targetY = zoneCenterY + (Math.random() - 0.5) * HIT_ZONE_SIZE * 0.8;
        
        // Calculate direction vector
        const dx = targetX - startX;
        const dy = targetY - startY;
        
        // Normalize the vector and apply speed
        const length = Math.sqrt(dx * dx + dy * dy);
        const vx = (dx / length) * OBJECT_SPEED_MULTIPLIER;
        const vy = (dy / length) * OBJECT_SPEED_MULTIPLIER;

        gameObjectsRef.current.push({ x: startX, y: startY, vx, vy, symbol, isTarget, hasBeenInZone: false });
    }, [targetSymbol]);

    const gameLoop = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const zoneX = (canvas.width - HIT_ZONE_SIZE) / 2;
        const zoneY = (canvas.height - HIT_ZONE_SIZE) / 2;

        gameObjectsRef.current.forEach((obj, index) => {
            obj.x += obj.vx;
            obj.y += obj.vy;
            
            ctx.font = '50px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(obj.symbol, obj.x, obj.y);

            const isInsideZone = obj.x > zoneX && obj.x < zoneX + HIT_ZONE_SIZE && obj.y > zoneY && obj.y < zoneY + HIT_ZONE_SIZE;
            if (isInsideZone) obj.hasBeenInZone = true;

            const isOffScreen = obj.x < -40 || obj.x > canvas.width + 40 || obj.y < -40 || obj.y > canvas.height + 40;
            if (isOffScreen) {
                if (obj.isTarget && obj.hasBeenInZone) {
                    setStats(prev => ({ ...prev, misses: prev.misses + 1 }));
                }
                gameObjectsRef.current.splice(index, 1);
            }
        });

        animationFrameId.current = requestAnimationFrame(gameLoop);
    }, []);

    useEffect(() => {
        if (gameState === 'playing') {
            animationFrameId.current = requestAnimationFrame(gameLoop);
            objectIntervalId.current = setInterval(spawnObject, OBJECT_SPAWN_INTERVAL_MS);
            gameTimeoutId.current = setTimeout(() => setGameState('report'), GAME_DURATION_MS);
        }
        return cleanup;
    }, [gameState, gameLoop, spawnObject]);

    const handlePress = () => {
        if (gameState !== 'playing') return;

        const canvas = canvasRef.current;
        const zoneX = (canvas.width - HIT_ZONE_SIZE) / 2;
        const zoneY = (canvas.height - HIT_ZONE_SIZE) / 2;
        
        const targetInZone = gameObjectsRef.current.find(obj => obj.isTarget && obj.x > zoneX && obj.x < zoneX + HIT_ZONE_SIZE && obj.y > zoneY && obj.y < zoneY + HIT_ZONE_SIZE);

        if (targetInZone) {
            setStats(prev => ({ ...prev, hits: prev.hits + 1 }));
            setFeedback('correct');
            gameObjectsRef.current = gameObjectsRef.current.filter(obj => obj !== targetInZone);
        } else {
            setStats(prev => ({ ...prev, falseAlarms: prev.falseAlarms + 1 }));
            setFeedback('incorrect');
        }
        setTimeout(() => setFeedback(''), 300);
    };

    return (
        <div className="relative w-full min-h-screen bg-gradient-to-br from-[#f0f4f8] to-[#dbeafe] flex flex-col items-center justify-center p-4 font-poppins overflow-hidden">
            <div className="absolute top-4 left-4 z-20">
                <button onClick={onGoHome} className="bg-white text-gray-700 px-4 py-2 rounded-xl shadow-md hover:bg-gray-200 transition-all flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                    Back to Home
                </button>
            </div>

            {gameState === 'intro' && (
                <div className="text-center p-8 bg-white rounded-2xl shadow-2xl animate-fade-in max-w-lg z-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-[#1e3a8a] mb-4">Symbol Zone</h1>
                    <p className="text-lg text-gray-600 mb-6">Symbols will fly across the screen. Press the box in the middle ONLY when the special target symbol is inside it!</p>
                    <button onClick={startGame} className="px-12 py-4 bg-[#3b82f6] text-white font-bold rounded-full text-xl hover:bg-[#2563eb] transition-all transform hover:scale-105 shadow-lg">Start Game</button>
                </div>
            )}

            {gameState === 'playing' && (
                <div className="w-full h-full flex flex-col items-center justify-center animate-fade-in">
                    <div className="absolute top-4 text-center z-10 bg-white/80 backdrop-blur-sm p-3 rounded-2xl shadow-lg">
                        <p className="text-xl text-gray-800 font-semibold">Press the zone for:</p>
                        <p className="text-7xl my-1">{targetSymbol}</p>
                    </div>
                    <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} className="absolute top-0 left-0 w-full h-full" />
                    <div
                        onClick={handlePress}
                        className={`absolute rounded-3xl cursor-pointer transition-all duration-200
                            ${feedback === 'correct' ? 'bg-green-500/50 border-4 border-green-300' : ''}
                            ${feedback === 'incorrect' ? 'bg-red-500/50 border-4 border-red-300' : ''}
                            ${!feedback ? 'bg-black/10 border-2 border-white/50' : ''}`}
                        style={{
                            width: HIT_ZONE_SIZE,
                            height: HIT_ZONE_SIZE,
                            top: `calc(50% - ${HIT_ZONE_SIZE / 2}px)`,
                            left: `calc(50% - ${HIT_ZONE_SIZE / 2}px)`,
                        }}
                    />
                </div>
            )}
            
            {gameState === 'report' && <GameReport stats={stats} onRestart={startGame} onGoHome={onGoHome} />}
            
            <style>{`.animate-fade-in { animation: fade-in 0.5s ease-out forwards; } @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
}
