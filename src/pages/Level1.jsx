import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Helper Functions & Data ---

// Tone.js for audio feedback
const playSound = (type) => {
  if (typeof window.Tone === 'undefined') {
    console.warn("Tone.js not available for sound feedback.");
    return;
  }
  const synth = new window.Tone.Synth().toDestination();
  if (type === 'correct') {
    synth.triggerAttackRelease("C5", "8n");
  } else if (type === 'incorrect') {
    synth.triggerAttackRelease("A2", "8n");
  } else if (type === 'start') {
    const startSynth = new window.Tone.Synth().toDestination();
    startSynth.triggerAttackRelease("C4", "8n", window.Tone.now());
    startSynth.triggerAttackRelease("E4", "8n", window.Tone.now() + 0.2);
    startSynth.triggerAttackRelease("G4", "8n", window.Tone.now() + 0.4);
  }
};


// --- Ishihara Plate Data (Updated for more authentic test) ---
const plateData = [
    // Control Plate 1 (Clearly visible to all)
    {
        id: 1,
        type: 'control',
        figure: { name: 'Star', path: 'M50,5 L61.8,38.2 L98.2,38.2 L68.2,59.5 L79.5,92.7 L50,71 L20.5,92.7 L31.8,59.5 L1.8,38.2 L38.2,38.2 Z' },
        options: ['Star', 'Circle', 'Square'],
        correctAnswer: 'Star',
        figureColors: ['#FBBF24', '#F59E0B'], // Bright Yellows/Oranges
        bgColors: ['#60A5FA', '#3B82F6', '#93C5FD'], // Bright Blues
    },
    // Control Plate 2 (Clearly visible to all)
    {
        id: 2,
        type: 'control',
        figure: { name: '12', isPath: false },
        options: ['12', '1', '72'],
        correctAnswer: '12',
        figureColors: ['#1F2937'], // Dark Gray
        bgColors: ['#D1D5DB', '#E5E7EB', '#F3F4F6'], // Light Grays
    },
    // --- Screening Plates (Figures should be hard to see for red-green deficiency) ---
    // Plate 3: Number 8 (Normal) vs 3 (Deficient) - We test for 8
    {
        id: 3,
        type: 'screening',
        figure: { name: '8', isPath: false },
        options: ['8', '3', 'Nothing'],
        correctAnswer: '8',
        figureColors: ['#94a3b8', '#64748b'], // Grayish-greens
        bgColors: ['#a16207', '#b45309', '#854d0e'], // Brownish-oranges
    },
    // Plate 4: Number 29 (Normal) vs 70 (Deficient) - We test for 29
    {
        id: 4,
        type: 'screening',
        figure: { name: '29', isPath: false },
        options: ['29', '70', 'Nothing'],
        correctAnswer: '29',
        figureColors: ['#84cc16', '#65a30d'], // Greens
        bgColors: ['#f97316', '#ea580c', '#c2410c'], // Oranges
    },
    // Plate 5: Number 5 (Normal) vs 2 (Deficient) - We test for 5
    {
        id: 5,
        type: 'screening',
        figure: { name: '5', isPath: false },
        options: ['5', '2', 'Nothing'],
        correctAnswer: '5',
        figureColors: ['#15803d', '#166534'], // Darker Greens
        bgColors: ['#b91c1c', '#991b1b', '#c2410c'], // Reds
    },
     // Plate 6: Number 3 (Normal) vs 5 (Deficient) - We test for 3
    {
        id: 6,
        type: 'screening',
        figure: { name: '3', isPath: false },
        options: ['3', '5', 'Nothing'],
        correctAnswer: '3',
        figureColors: ['#fb923c', '#f97316'], // Oranges
        bgColors: ['#4d7c0f', '#65a30d', '#a3e635'], // Greens
    },
     // Plate 7: Number 15 (Normal) vs 17 (Deficient) - We test for 15
    {
        id: 7,
        type: 'screening',
        figure: { name: '15', isPath: false },
        options: ['15', '17', 'Nothing'],
        correctAnswer: '15',
        figureColors: ['#16a34a', '#22c55e'], // Greens
        bgColors: ['#dc2626', '#ef4444', '#f87171'], // Reds
    },
     // Plate 8: Number 74 (Normal) vs 21 (Deficient) - We test for 74
    {
        id: 8,
        type: 'screening',
        figure: { name: '74', isPath: false },
        options: ['74', '21', 'Nothing'],
        correctAnswer: '74',
        figureColors: ['#15803d', '#16a34a', '#166534'], // Greens
        bgColors: ['#ca8a04', '#d97706', '#a16207'], // Brownish-yellows
    },
];


// --- Components ---

const IshiharaPlate = ({ plate, canvasSize = 300 }) => {
    const canvasRef = useRef(null);

    const draw = useCallback((ctx) => {
        const { figure, figureColors, bgColors } = plate;
        ctx.clearRect(0, 0, canvasSize, canvasSize);

        // --- Create a mask of the figure ---
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = canvasSize;
        maskCanvas.height = canvasSize;
        const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });

        if (figure.isPath !== false) { // It's an SVG path
            const scale = canvasSize / 100;
            maskCtx.scale(scale, scale);
            const path = new Path2D(figure.path);
            maskCtx.fillStyle = 'black';
            maskCtx.fill(path);
        } else { // It's a text figure
            maskCtx.font = `bold ${canvasSize * 0.6}px sans-serif`;
            maskCtx.textAlign = 'center';
            maskCtx.textBaseline = 'middle';
            maskCtx.fillStyle = 'black';
            maskCtx.fillText(figure.name, canvasSize / 2, canvasSize / 2);
        }
        
        const isPointInFigure = (x, y) => {
            const pixel = maskCtx.getImageData(x, y, 1, 1).data;
            return pixel[3] > 0; // Check alpha channel
        };

        // --- Draw all dots in a single pass ---
        const drawDot = (x, y, radius, color) => {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        };
        
        const getRandomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

        // Total dots to draw
        const dotCount = 2500;

        for (let i = 0; i < dotCount; i++) {
            const x = Math.random() * canvasSize;
            const y = Math.random() * canvasSize;
            
            // Add variation to dot size
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

const Report = ({ results, onRestart, onExit }) => {
    const screeningResults = results.filter(r => r.type === 'screening');
    const correctScreeningCount = screeningResults.filter(r => r.isCorrect).length;
    const accuracy = screeningResults.length > 0 ? (correctScreeningCount / screeningResults.length) * 100 : 100;
    
    // Threshold for suggesting further testing. E.g., if less than 70% of screening plates are correct.
    const potentialIssues = accuracy < 70;

    const avgResponseTime = results.length > 0 ? results.reduce((acc, r) => acc + r.responseTime, 0) / results.length : 0;

    return (
        <div className="w-full max-w-2xl mx-auto p-6 md:p-8 bg-white rounded-2xl shadow-2xl text-center animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Color Dots Chase Report</h2>
            
            <div className={`p-4 rounded-lg mb-6 ${potentialIssues ? 'bg-orange-100' : 'bg-green-100'}`}>
                <h3 className="text-xl font-semibold mb-2">{potentialIssues ? "Recommendation" : "Result"}</h3>
                <p className={`text-lg ${potentialIssues ? 'text-orange-800' : 'text-green-800'}`}>
                    {potentialIssues 
                        ? "The results suggest some difficulty distinguishing between certain colors. We recommend consulting with a pediatrician or eye specialist for a comprehensive vision test." 
                        : "No issues with red-green color vision were detected. Your child identified the hidden figures successfully."}
                </p>
            </div>

            <div className="text-left bg-gray-50 p-4 rounded-lg mb-6">
                 <h3 className="text-xl font-semibold mb-3 text-gray-700">Summary</h3>
                 <p className="text-md text-gray-600 mb-2"><strong>Screening Accuracy:</strong> {correctScreeningCount} / {screeningResults.length} correct ({Math.round(accuracy)}%)</p>
                 <p className="text-md text-gray-600"><strong>Average Response Time:</strong> {(avgResponseTime / 1000).toFixed(2)} seconds</p>
            </div>

            <p className="text-sm text-gray-500 mb-8">
                Disclaimer: This game is a screening tool and not a substitute for a professional diagnosis.
            </p>

            <div className="flex justify-center gap-4">
                <button onClick={onRestart} className="px-8 py-3 bg-blue-500 text-white font-bold rounded-full hover:bg-blue-600 transition-all transform hover:scale-105">
                    Play Again
                </button>
                <button onClick={onExit} className="px-8 py-3 bg-gray-600 text-white font-bold rounded-full hover:bg-gray-700 transition-all transform hover:scale-105">
                    Back to Home
                </button>
            </div>
        </div>
    );
};


// --- Main Game Component ---

export default function Level1({ onGoHome }) {
    const [gameState, setGameState] = useState('intro'); // 'intro', 'playing', 'feedback', 'report'
    const [results, setResults] = useState([]);
    const [currentPlateIndex, setCurrentPlateIndex] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [feedback, setFeedback] = useState({ type: '', show: false });
    
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

    const startGame = () => {
        playSound('start');
        setResults([]);
        setCurrentPlateIndex(0);
        setGameState('playing');
        setStartTime(Date.now());
    };

    const handleAnswer = (answer) => {
        if (gameState !== 'playing') return;

        const responseTime = Date.now() - startTime;
        const currentPlate = plateData[currentPlateIndex];
        const isCorrect = answer === currentPlate.correctAnswer;

        setResults(prev => [...prev, {
            plateId: currentPlate.id,
            type: currentPlate.type,
            isCorrect,
            responseTime,
        }]);

        setFeedback({ type: isCorrect ? 'correct' : 'incorrect', show: true });
        playSound(isCorrect ? 'correct' : 'incorrect');
        setGameState('feedback');

        setTimeout(() => {
            setFeedback({ type: '', show: false });
            if (currentPlateIndex < plateData.length - 1) {
                setCurrentPlateIndex(prev => prev + 1);
                setGameState('playing');
                setStartTime(Date.now());
            } else {
                setGameState('report');
            }
        }, 1500);
    };

    const restartGame = () => {
        setGameState('intro');
    };

    const currentPlate = plateData[currentPlateIndex];

    return (
        <div className="relative w-full min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4 font-sans">
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

            {gameState === 'intro' && (
                <div className="text-center p-8 bg-white rounded-2xl shadow-2xl animate-fade-in">
                    <h1 className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">Color Dots Chase</h1>
                    <p className="text-lg text-gray-600 mb-6">Can you find the hidden figures?</p>
                    <button onClick={startGame} className="px-12 py-4 bg-green-500 text-white font-bold rounded-full text-xl hover:bg-green-600 transition-all transform hover:scale-105 shadow-lg">
                        Start Game
                    </button>
                </div>
            )}

            {(gameState === 'playing' || gameState === 'feedback') && currentPlate && (
                <div className="w-full max-w-2xl mx-auto flex flex-col items-center animate-fade-in">
                    <div className="relative mb-8">
                        <IshiharaPlate plate={currentPlate} />
                        {feedback.show && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                {feedback.type === 'correct' && <div className="text-6xl animate-ping-once">✅</div>}
                                {feedback.type === 'incorrect' && <div className="text-6xl animate-shake">❌</div>}
                            </div>
                        )}
                    </div>
                    
                    <p className="text-2xl font-semibold text-gray-700 mb-6">What do you see?</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        {currentPlate.options.map(option => (
                            <button 
                                key={option} 
                                onClick={() => handleAnswer(option)}
                                disabled={gameState === 'feedback'}
                                className="p-4 bg-white text-blue-600 font-bold text-xl rounded-2xl shadow-md hover:shadow-xl hover:bg-blue-100 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {gameState === 'report' && <Report results={results} onRestart={restartGame} onExit={onGoHome} />}

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }

                @keyframes ping-once {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 0; }
                }
                .animate-ping-once { animation: ping-once 0.7s ease-out forwards; }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                .animate-shake { animation: shake 0.5s ease-in-out forwards; }
            `}</style>
        </div>
    );
}
