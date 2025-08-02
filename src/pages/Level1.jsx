import React, { useState, useEffect, useCallback } from 'react';

/**
 * Configuration for each sub-level of the game.
 * Each object defines the prompt, colors, and an emoji to represent the animal.
 * The animalColor and bgColor are chosen to be confusing for the specified type of color vision deficiency.
 */
const subLevels = [
    {
        name: 'Protanopia',
        prompt: 'Can you find the red panda hiding in the leaves?',
        animal: '🐼',
        animalColor: 'rgb(200, 80, 70)',   // Muted red
        bgColor: 'rgb(90, 110, 90)',       // Confusing green/brown
    },
    {
        name: 'Deuteranopia',
        prompt: 'Where is the green parrot on the tree?',
        animal: '🦜',
        animalColor: 'rgb(120, 160, 120)', // Muted green
        bgColor: 'rgb(170, 130, 110)',   // Confusing reddish-brown
    },
    {
        name: 'Tritanopia',
        prompt: 'Spot the blue frog near the water!',
        animal: '🐸', // Note: Emoji is green, but the color wash is blue
        animalColor: 'rgb(100, 140, 220)', // A shade of blue
        bgColor: 'rgb(110, 150, 140)',   // Confusing turquoise/green
    },
    {
        name: 'Achromatopsia',
        prompt: 'Find the gray squirrel on the rock.',
        animal: '🐿️',
        animalColor: 'rgb(140, 140, 140)', // A shade of gray
        bgColor: 'rgb(150, 150, 150)',   // A slightly different shade of gray
    },
];

/**
 * Saves a completed game session.
 * @param {number} finalScore - The score from the game.
 * @param {string} status - The final status ('Completed' or 'Game Over').
 */
const saveGameSession = (finalScore, status) => {
    const session = {
        date: new Date().toISOString(),
        game: 'Animal Hide & Seek',
        score: finalScore,
        status: status,
    };
    try {
        const existingData = JSON.parse(localStorage.getItem('gameSessions')) || [];
        existingData.push(session);
        localStorage.setItem('gameSessions', JSON.stringify(existingData));
    } catch (error) {
        console.error("Failed to save game session:", error);
    }
};

/**
 * Level1 Component: The "Animal Hide & Seek" game screen.
 * @param {object} props - Component props.
 * @param {function} props.onGoHome - Callback to return to the home screen.
 */
const Level1 = ({ onGoHome }) => {
    const [gameState, setGameState] = useState('playing'); // 'playing', 'gameOver', 'gameWon'
    const [score, setScore] = useState(0);
    const [timer, setTimer] = useState(20);
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [animalPosition, setAnimalPosition] = useState({ top: '50%', left: '50%' });

    const currentLevel = subLevels[currentLevelIndex];

    const startNextLevel = useCallback(() => {
        // Generate a random position within the scene for the animal
        const top = Math.floor(Math.random() * 85); // Use 85 to keep it fully in view
        const left = Math.floor(Math.random() * 85);
        setAnimalPosition({ top: `${top}%`, left: `${left}%` });
        setTimer(20);
    }, []);

    useEffect(() => {
        if (gameState === 'playing') {
            startNextLevel();
        }
    }, [currentLevelIndex, gameState, startNextLevel]);

    useEffect(() => {
        if (gameState !== 'playing') return;
        const interval = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setGameState('gameOver');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [gameState]);

    useEffect(() => {
        if (gameState === 'gameOver') {
            saveGameSession(score, 'Game Over');
        } else if (gameState === 'gameWon') {
            saveGameSession(score, 'Completed');
        }
    }, [gameState, score]);

    const handleAnimalClick = (e) => {
        e.stopPropagation(); // Prevents the background 'miss' click from firing
        if (gameState !== 'playing') return;

        setScore(prev => prev + 10 + timer); // Add score + time bonus

        if (currentLevelIndex < subLevels.length - 1) {
            setCurrentLevelIndex(prev => prev + 1);
        } else {
            setGameState('gameWon');
        }
    };

    const handleMiss = () => {
        if (gameState !== 'playing') return;
        setGameState('gameOver');
    };

    if (gameState === 'gameOver' || gameState === 'gameWon') {
        const isWin = gameState === 'gameWon';
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-sm w-full">
                    <h2 className="text-3xl font-bold mb-4" style={{ color: isWin ? '#28a745' : '#dc3545' }}>
                        {isWin ? 'You Won! 🎉' : 'Game Over'}
                    </h2>
                    <p className="text-lg mb-6 text-gray-600">
                        Final Score: <span className="font-bold text-gray-800">{score}</span>
                    </p>
                    <button
                        onClick={onGoHome}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto text-center">
            {/* Header with Score, Timer, and Prompt */}
            <div className="mb-4 p-4 bg-white rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <span className="text-lg font-medium text-gray-500">Score: </span>
                        <span className="text-xl font-bold text-blue-600">{score}</span>
                    </div>
                    <div>
                        <span className="text-lg font-medium text-gray-500">Time: </span>
                        <span className="text-xl font-bold text-red-600">{timer}</span>
                    </div>
                </div>
                <p className="text-xl font-semibold text-gray-700">
                    {currentLevel.prompt}
                </p>
            </div>

            {/* Game Scene: You can replace the background color with a background image */}
            <div
                className="relative w-full aspect-video rounded-lg shadow-inner overflow-hidden cursor-pointer"
                style={{ backgroundColor: currentLevel.bgColor }}
                onClick={handleMiss}
            >
                {/* The Animal: You can replace this div with an <img> tag */}
                <div
                    className="absolute w-16 h-16 flex items-center justify-center text-4xl rounded-full cursor-pointer transition-all duration-200 transform hover:scale-110"
                    style={{
                        top: animalPosition.top,
                        left: animalPosition.left,
                        backgroundColor: currentLevel.animalColor,
                    }}
                    onClick={handleAnimalClick}
                >
                    {currentLevel.animal}
                </div>
            </div>
        </div>
    );
};

export default Level1;