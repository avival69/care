import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Icon Imports ---
import { 
    ArrowLeftIcon, 
    SpeakerWaveIcon, 
    SpeakerXMarkIcon,
    CheckCircleIcon,
    XCircleIcon,
    LightBulbIcon,
    TrophyIcon,
} from '@heroicons/react/24/solid';

// --- Helper Functions & Data ---

const speak = (text, isMuted) => {
    if (isMuted || typeof window.speechSynthesis === 'undefined') return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
};

const playSound = (type, isMuted) => {
    if (isMuted || typeof window.Tone === 'undefined') return;
    const synth = new window.Tone.Synth().toDestination();
    if (type === 'correct') {
        synth.triggerAttackRelease("C5", "8n");
    } else if (type === 'incorrect') {
        synth.triggerAttackRelease("A2", "8n");
    }
};

const plateData = [
    { id: 1, type: 'control', figure: { name: 'Star', path: 'M50,5 L61.8,38.2 L98.2,38.2 L68.2,59.5 L79.5,92.7 L50,71 L20.5,92.7 L31.8,59.5 L1.8,38.2 L38.2,38.2 Z' }, options: ['Star', 'Circle', 'Square'], correctAnswer: 'Star', figureColors: ['#FBBF24', '#F59E0B'], bgColors: ['#60A5FA', '#3B82F6', '#93C5FD'] },
    { id: 2, type: 'control', figure: { name: '12', isPath: false }, options: ['12', '1', '72'], correctAnswer: '12', figureColors: ['#1F2937'], bgColors: ['#D1D5DB', '#E5E7EB', '#F3F4F6'] },
    { id: 3, type: 'screening', figure: { name: '8', isPath: false }, options: ['8', '3', 'Nothing'], correctAnswer: '8', figureColors: ['#94a3b8', '#64748b'], bgColors: ['#a16207', '#b45309', '#854d0e'] },
    { id: 4, type: 'screening', figure: { name: '29', isPath: false }, options: ['29', '70', 'Nothing'], correctAnswer: '29', figureColors: ['#84cc16', '#65a30d'], bgColors: ['#f97316', '#ea580c', '#c2410c'] },
    { id: 5, type: 'screening', figure: { name: '5', isPath: false }, options: ['5', '2', 'Nothing'], correctAnswer: '5', figureColors: ['#15803d', '#166534'], bgColors: ['#b91c1c', '#991b1b', '#c2410c'] },
    { id: 6, type: 'screening', figure: { name: '3', isPath: false }, options: ['3', '5', 'Nothing'], correctAnswer: '3', figureColors: ['#fb923c', '#f97316'], bgColors: ['#4d7c0f', '#65a30d', '#a3e635'] },
    { id: 7, type: 'screening', figure: { name: '15', isPath: false }, options: ['15', '17', 'Nothing'], correctAnswer: '15', figureColors: ['#16a34a', '#22c55e'], bgColors: ['#dc2626', '#ef4444', '#f87171'] },
    { id: 8, type: 'screening', figure: { name: '74', isPath: false }, options: ['74', '21', 'Nothing'], correctAnswer: '74', figureColors: ['#15803d', '#16a34a', '#166534'], bgColors: ['#ca8a04', '#d97706', '#a16207'] },
];

// --- Sub-Components ---

const IshiharaPlate = ({ plate, canvasSize = 300 }) => {
    const canvasRef = useRef(null);
    const draw = useCallback((ctx) => {
        const { figure, figureColors, bgColors } = plate;
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = canvasSize;
        maskCanvas.height = canvasSize;
        const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
        if (figure.isPath !== false) {
            const scale = canvasSize / 100;
            maskCtx.scale(scale, scale);
            const path = new Path2D(figure.path);
            maskCtx.fillStyle = 'black';
            maskCtx.fill(path);
        } else {
            maskCtx.font = `bold ${canvasSize * 0.6}px sans-serif`;
            maskCtx.textAlign = 'center';
            maskCtx.textBaseline = 'middle';
            maskCtx.fillStyle = 'black';
            maskCtx.fillText(figure.name, canvasSize / 2, canvasSize / 2);
        }
        const isPointInFigure = (x, y) => {
            const pixel = maskCtx.getImageData(x, y, 1, 1).data;
            return pixel[3] > 0;
        };
        const drawDot = (x, y, radius, color) => {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        };
        const getRandomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const dotCount = 2500;
        for (let i = 0; i < dotCount; i++) {
            const x = Math.random() * canvasSize;
            const y = Math.random() * canvasSize;
            const radius = Math.random() * 2.5 + 2;
            let color;
            if (isPointInFigure(x, y)) {
                color = getRandomFrom(figureColors);
            } else {
                color = getRandomFrom(bgColors);
            }
            drawDot(x, y, radius, color);
        }
    }, [plate, canvasSize]);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const context = canvas.getContext('2d');
            draw(context);
        }
    }, [draw]);
    return <canvas ref={canvasRef} width={canvasSize} height={canvasSize} className="rounded-full bg-gray-200 shadow-lg" />;
};

const Confetti = () => {
    const confettiCount = 50;
    const colors = ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#4ade80', '#60a5fa', '#c084fc'];
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: confettiCount }).map((_, i) => (
                <div
                    key={i}
                    className="absolute rounded-full animate-fall"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * -20}%`,
                        width: `${Math.random() * 10 + 5}px`,
                        height: `${Math.random() * 10 + 5}px`,
                        backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${Math.random() * 3 + 5}s`,
                    }}
                />
            ))}
        </div>
    );
};

const InstructionsModal = ({ onStart }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full text-center overflow-hidden transform transition-all animate-fade-in-up">
                <div className="bg-blue-500 p-8">
                    <LightBulbIcon className="h-20 w-20 text-white/80 mx-auto" />
                </div>
                <div className="p-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-3">How to Play</h2>
                    <p className="text-gray-600 text-lg mb-6">
                        Look at the circle of dots and find the hidden shape or number. Then, click the button that matches what you see.
                    </p>
                    <button
                        onClick={onStart}
                        className="w-full px-8 py-3 bg-green-500 text-white font-bold rounded-xl text-lg hover:bg-green-600 transition-all transform hover:scale-105 shadow-lg"
                    >
                        Start the Game
                    </button>
                </div>
            </div>
        </div>
    );
};

const EndScreen = ({ onRestart, onExit }) => {
    return (
        <div className="relative w-full max-w-lg text-center">
            <Confetti />
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all animate-fade-in-up">
                <div className="bg-amber-400 p-8">
                    <TrophyIcon className="h-20 w-20 text-white/80 mx-auto" />
                </div>
                <div className="p-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Well Done!</h1>
                    <p className="text-lg text-gray-600 mb-8">You've completed the Color Dots Chase!</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={onRestart} className="px-8 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all transform hover:scale-105">
                            Play Again
                        </button>
                        <button onClick={onExit} className="px-8 py-3 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 transition-all transform hover:scale-105">
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Game Component ---

export default function Level1({ onGoHome }) {
    const [gameState, setGameState] = useState('instructions');
    const [currentPlateIndex, setCurrentPlateIndex] = useState(0);
    const [feedback, setFeedback] = useState({ type: '', show: false });
    const [isMuted, setIsMuted] = useState(false);
    
    useEffect(() => {
        const scriptId = 'tone-js-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js";
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    // Change: Restored useEffect for automatic TTS on instructions screen.
    useEffect(() => {
        if (gameState === 'instructions') {
            const instructions = "How to Play. Look at the circle of dots and find the hidden shape or number. Then, click the button that matches what you see.";
            // Delay to allow modal animation to finish
            const timer = setTimeout(() => {
                speak(instructions, isMuted);
            }, 500);
            return () => clearTimeout(timer); // Cleanup timer
        }
        // Cleanup speech if component unmounts or gameState changes
        return () => window.speechSynthesis.cancel();
    }, [gameState, isMuted]);


    const startGame = () => {
        window.speechSynthesis.cancel(); // Stop any speech if user starts early
        setCurrentPlateIndex(0);
        setGameState('playing');
    };

    const handleAnswer = (answer) => {
        if (gameState !== 'playing') return;
        const isCorrect = answer === plateData[currentPlateIndex].correctAnswer;
        setFeedback({ type: isCorrect ? 'correct' : 'incorrect', show: true });
        playSound(isCorrect ? 'correct' : 'incorrect', isMuted);
        setGameState('feedback');
        setTimeout(() => {
            setFeedback({ type: '', show: false });
            if (currentPlateIndex < plateData.length - 1) {
                setCurrentPlateIndex(prev => prev + 1);
                setGameState('playing');
            } else {
                setGameState('end');
            }
        }, 1500);
    };

    const restartGame = () => { setGameState('instructions'); };
    
    const toggleMute = () => {
        setIsMuted(prev => {
            if (!prev) { // If we are about to mute
                window.speechSynthesis.cancel();
            }
            return !prev;
        });
    };
    
    const currentPlate = plateData[currentPlateIndex];

    return (
        <div className="relative w-full min-h-screen flex flex-col items-center justify-center p-4 font-poppins overflow-hidden">
            <div className="absolute top-0 -left-1/4 w-96 h-96 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob"></div>
            <div className="absolute top-0 -right-1/_4 w-96 h-96  rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob animation-delay-2000"></div>
            
            <div className="absolute top-6 left-6 z-20">
                <button onClick={onGoHome} className="flex items-center gap-2 bg-white/70 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-xl shadow-md hover:bg-white transition-all">
                    <ArrowLeftIcon className="h-5 w-5" />
                    Home
                </button>
            </div>
            <div className="absolute top-6 right-6 z-20">
                 <button onClick={toggleMute} className="flex items-center gap-2 bg-white/70 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-xl shadow-md hover:bg-white transition-all">
                    {isMuted ? <SpeakerXMarkIcon className="h-5 w-5" /> : <SpeakerWaveIcon className="h-5 w-5" />}
                </button>
            </div>

            {/* Change: 'onReadAloud' prop removed as it's now automatic */}
            {gameState === 'instructions' && <InstructionsModal onStart={startGame} />}

            {(gameState === 'playing' || gameState === 'feedback') && currentPlate && (
                <div className="w-full max-w-2xl mx-auto flex flex-col items-center animate-fade-in-up z-10">
                    <div className="relative mb-8">
                        <IshiharaPlate plate={currentPlate} />
                        {feedback.show && (
                            <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center pointer-events-none">
                                {feedback.type === 'correct' && <CheckCircleIcon className="h-24 w-24 text-white animate-ping-once" />}
                                {feedback.type === 'incorrect' && <XCircleIcon className="h-24 w-24 text-white animate-shake" />}
                            </div>
                        )}
                    </div>
                    <p className="text-2xl font-semibold text-gray-700 mb-6">What do you see in the dots?</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        {currentPlate.options.map(option => (
                            <button key={option} onClick={() => handleAnswer(option)} disabled={gameState === 'feedback'}
                                className="p-4 bg-white text-blue-600 font-bold text-xl rounded-2xl shadow-md hover:shadow-xl hover:bg-blue-50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {gameState === 'end' && <EndScreen onRestart={restartGame} onExit={onGoHome} />}

            <style>{`
                @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
                
                @keyframes ping-once { 0% { transform: scale(0.8); opacity: 0; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
                .animate-ping-once { animation: ping-once 0.5s ease-out forwards; }

                @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); } 20%, 40%, 60%, 80% { transform: translateX(8px); } }
                .animate-shake { animation: shake 0.5s ease-in-out forwards; }

                @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
                .animate-blob { animation: blob 7s infinite; }
                .animation-delay-2000 { animation-delay: 2s; }

                @keyframes fall {
                    from { transform: translateY(0vh) rotate(0deg); opacity: 1; }
                    to { transform: translateY(105vh) rotate(360deg); opacity: 0; }
                }
                .animate-fall { animation: fall linear forwards; }
            `}</style>
        </div>
    );
}