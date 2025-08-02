import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

// Real Face Emotion Detector using face-api.js
const FaceEmotionDetector = ({ onExpressionChange }) => {
    const videoRef = useRef(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const intervalRef = useRef(null);

    // This effect loads the models and starts the camera.
    useEffect(() => {
        const loadContent = async () => {
            // Load face-api.js models from the public/models folder
            const MODEL_URL = '/models'; 
            try {
                console.log("Loading models...");
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
                ]);
                setModelsLoaded(true);
                console.log("Models loaded successfully");
            } catch (error) {
                console.error("Error loading models:", error);
            }

            // Start the video stream from the user's webcam
            try {
                console.log("Starting camera...");
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setIsCameraOn(true);
                    console.log("Camera started successfully");
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
            }
        };

        loadContent();

        // Cleanup function: This will run when the component is unmounted
        // to stop the camera and prevent memory leaks.
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject;
                const tracks = stream.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []);

    // This function starts the emotion detection when the video is playing.
    const handleVideoPlay = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        
        // Set an interval to run detection periodically.
        intervalRef.current = setInterval(async () => {
            if (videoRef.current && modelsLoaded) {
                // Detect a single face and its expression.
                const detections = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
                
                if (detections) {
                    const expressions = detections.expressions;
                    // Find the most likely emotion.
                    const dominantExpression = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
                    // Notify the parent component of the detected emotion.
                    onExpressionChange(dominantExpression);
                }
            }
        }, 500); // Run detection every 500 milliseconds.
    };

    return (
        <div className="absolute bottom-4 right-4 bg-black p-1 rounded-2xl shadow-2xl border-2 border-gray-400 w-64 h-48 flex items-center justify-center overflow-hidden">
            {!isCameraOn && <div className="text-white text-xs text-center p-2">Starting Camera & Loading Models...</div>}
            <video
                ref={videoRef}
                autoPlay
                muted
                onPlay={handleVideoPlay}
                style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover', 
                    transform: 'scaleX(-1)', // Mirror the video feed
                    display: isCameraOn ? 'block' : 'none'
                }}
            />
        </div>
    );
};


// Animal Character Component
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
            <div className="text-8xl mb-4 transition-transform duration-500 ease-in-out transform scale-100 animate-bounce">
                {getEmoji()}
            </div>
            <p className="text-2xl text-gray-800 font-semibold">
                Show me a <span className="text-[#2563eb] capitalize">{emotion}</span> face!
            </p>
        </div>
    );
};

// Level 2 Game Component
const Level2 = ({ onGoHome }) => {
    const emotionsToGuess = ['happy', 'surprised', 'sad', 'neutral'];
    const [currentEmotionIndex, setCurrentEmotionIndex] = useState(0);
    const [detectedExpression, setDetectedExpression] = useState('none');
    const [isMuted, setIsMuted] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const currentEmotion = emotionsToGuess[currentEmotionIndex];
    const isGameFinished = currentEmotionIndex >= emotionsToGuess.length;

    useEffect(() => {
        // Load progress from cache if available
        const savedProgress = localStorage.getItem('emotionGameProgress');
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            setCurrentEmotionIndex(progress.currentEmotionIndex);
            console.log("Loaded progress from cache:", progress);
        }
    }, []);

    useEffect(() => {
        console.log(`Goal: ${currentEmotion} | Detected: ${detectedExpression}`);

        if (currentEmotion && detectedExpression === currentEmotion) {
            console.log(`Correct! Matched emotion: ${currentEmotion}`);
            setShowSuccess(true);

            setTimeout(() => {
                const nextIndex = currentEmotionIndex + 1;
                // Save progress to cache
                const progress = { currentEmotionIndex: nextIndex };
                localStorage.setItem('emotionGameProgress', JSON.stringify(progress));
                console.log("Saved progress to cache:", progress);

                setCurrentEmotionIndex(nextIndex);
                setDetectedExpression('none'); // Reset detection
                setShowSuccess(false);
            }, 1500); // Wait 1.5 seconds before moving to the next emotion
        }
    }, [detectedExpression, currentEmotion, currentEmotionIndex]);
    
    const handleReset = () => {
        localStorage.removeItem('emotionGameProgress');
        setCurrentEmotionIndex(0);
        setDetectedExpression('none');
    }

    return (
        <div className="relative min-h-screen w-full bg-gradient-to-br from-[#f0f4f8] to-[#dbeafe] flex flex-col items-center justify-center p-4 font-poppins overflow-hidden">
            {/* Top Bar UI */}
            <div className="absolute top-4 left-4">
                <button
                    onClick={onGoHome}
                    className="bg-white text-[#1e3a8a] px-4 py-2 rounded-xl shadow-md hover:bg-gray-200 transition-all flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back to Home
                </button>
            </div>
            <div className="absolute top-4 right-4">
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="bg-white p-3 rounded-full shadow-md hover:bg-gray-200 transition-all"
                >
                    {isMuted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Main Game Content */}
            <div className="flex flex-col items-center justify-center flex-grow">
                {isGameFinished ? (
                    <div className="text-center">
                        <h2 className="text-5xl font-bold text-green-600 mb-4">Good Game!</h2>
                        <p className="text-xl text-gray-700">You did a great job recognizing emotions!</p>
                        <button
                            onClick={handleReset}
                            className="mt-8 bg-[#3b82f6] text-white px-6 py-3 rounded-xl text-lg shadow-lg hover:bg-[#2563eb] transition-transform transform hover:scale-105"
                        >
                            Play Again
                        </button>
                    </div>
                ) : (
                    <>
                        {showSuccess ? (
                            <div className="text-center">
                                <h2 className="text-4xl font-bold text-green-500 animate-ping">Great!</h2>
                            </div>
                        ) : (
                            <AnimalCharacter emotion={currentEmotion} />
                        )}
                    </>
                )}
            </div>

            {/* Real Camera View and Emotion Detector */}
            <FaceEmotionDetector onExpressionChange={setDetectedExpression} />
            
            {/* Progress Indicator */}
            <div className="absolute bottom-4 left-4 flex space-x-2">
                {emotionsToGuess.map((_, index) => (
                    <div
                        key={index}
                        className={`w-8 h-2 rounded-full ${index < currentEmotionIndex ? 'bg-green-500' : 'bg-gray-300'}`}
                    ></div>
                ))}
            </div>
        </div>
    );
};

export default Level2;
