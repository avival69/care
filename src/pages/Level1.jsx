import React, { useState, useEffect, useCallback } from 'react';

/**
 * Generates a base color and a slightly different "odd" color.
 * @param {number} difficultyOffset - The difference between the base and odd color.
 * @returns {{baseColor: string, oddColor: string}}
 */
const generateColors = (difficultyOffset) => {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    const baseColor = `rgb(${r}, ${g}, ${b})`;
    const newR = Math.max(0, Math.min(255, r - difficultyOffset));
    const newG = Math.max(0, Math.min(255, g - difficultyOffset));
    const newB = Math.max(0, Math.min(255, b - difficultyOffset));
    const oddColor = `rgb(${newR}, ${newG}, ${newB})`;
    return { baseColor, oddColor };
};

/**
 * Saves a completed game session to Local Storage.
 * @param {number} finalScore - The score from the game.
 */
const saveGameSession = (finalScore) => {
    const session = {
        date: new Date().toISOString(),
        game: 'Color Spotter',
        score: finalScore,
    };

    // This is where you would interact with Firebase instead.
    try {
        const existingData = JSON.parse(localStorage.getItem('gameSessions')) || [];
        existingData.push(session);
        localStorage.setItem('gameSessions', JSON.stringify(existingData));
    } catch (error) {
        console.error("Failed to save game session:", error);
    }
};


/**
 * Level1 Component: The "Color Spotter" game screen.
 * @param {object} props - Component props.
 * @param {function} props.onGoHome - Callback to return to the home screen.
 */
const Level1 = ({ onGoHome }) => {
    const [gameState, setGameState] = useState('playing');
    const [score, setScore] = useState(0);
    const [timer, setTimer] = useState(20);
    const [grid, setGrid] = useState([]);
    const [oddOneIndex, setOddOneIndex] = useState(-1);
    const [gridSize, setGridSize] = useState(3);
    const [offset, setOffset] = useState(40);

    const nextRound = useCallback(() => {
        const totalSquares = gridSize * gridSize;
        const newOddOneIndex = Math.floor(Math.random() * totalSquares);
        const { baseColor, oddColor } = generateColors(offset);
        const newGrid = Array(totalSquares).fill(baseColor).map((color, index) => 
            index === newOddOneIndex ? oddColor : color
        );
        
        setOddOneIndex(newOddOneIndex);
        setGrid(newGrid);
        setTimer(20);
        
        if (score > 0 && score % 30 === 0) {
            setGridSize(prev => Math.min(prev + 1, 7));
            setOffset(prev => Math.max(prev - 5, 10));
        }

    }, [gridSize, offset, score]);
    
    useEffect(() => {
        nextRound();
    }, [score]);

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

    // When game state changes to 'gameOver', save the session.
    useEffect(() => {
        if (gameState === 'gameOver') {
            saveGameSession(score);
        }
    }, [gameState, score]);


    const handleSquareClick = (index) => {
        if (gameState !== 'playing') return;
        if (index === oddOneIndex) {
            setScore(prev => prev + 10);
        } else {
            setGameState('gameOver');
        }
    };

    if (gameState === 'gameOver') {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-sm w-full">
                    <h2 className="text-3xl font-bold mb-4" style={{ color: '#4682A9' }}>Game Over</h2>
                    <p className="text-lg mb-6" style={{ color: '#749BC2' }}>Final Score: <span className="font-bold" style={{ color: '#4682A9' }}>{score}</span></p>
                    <div className="flex justify-center">
                        <button 
                            onClick={onGoHome} 
                            className="text-white font-bold py-2 px-6 rounded-lg transition-colors"
                            style={{ backgroundColor: '#4682A9' }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#749BC2'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = '#4682A9'}
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-xl mx-auto text-center">
            <div className="flex justify-between items-center mb-6 p-4 bg-white rounded-lg shadow-sm">
                <div>
                    <span className="text-sm font-medium" style={{ color: '#749BC2' }}>Score: </span>
                    <span className="text-lg font-bold" style={{ color: '#4682A9' }}>{score}</span>
                </div>
                <div>
                    <span className="text-sm font-medium" style={{ color: '#749BC2' }}>Time: </span>
                    <span className="text-lg font-bold text-red-600">{timer}</span>
                </div>
            </div>
            <div 
                className="w-full aspect-square p-3 rounded-lg shadow-inner grid gap-2"
                style={{ backgroundColor: 'rgba(116, 155, 194, 0.2)' }}
            >
                {grid.map((color, index) => (
                    <div
                        key={index}
                        className="w-full h-full rounded-md cursor-pointer transition-transform transform hover:scale-105"
                        style={{ backgroundColor: color }}
                        onClick={() => handleSquareClick(index)}
                    />
                ))}
            </div>
        </div>
    );
};

export default Level1;
