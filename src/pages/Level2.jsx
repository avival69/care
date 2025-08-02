// src/pages/Level2.jsx
import React, { useState } from 'react';
import FaceEmotionDetector from '../components/FaceEmotionDetector';

const Level2 = ({ onGoHome }) => {
  const [expression, setExpression] = useState('Detecting...');

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f0f4f8] to-[#dbeafe] flex flex-col items-center justify-center px-4 font-poppins">
      <h1 className="text-3xl font-bold text-[#1e3a8a] mb-4">Level 2 - Emotion Detection</h1>

      <FaceEmotionDetector onExpressionChange={setExpression} />

      <p className="text-xl text-gray-800 font-semibold">
        Detected Emotion: <span className="text-[#2563eb] capitalize">{expression}</span>
      </p>

      <button
        onClick={onGoHome}
        className="mt-6 bg-[#3b82f6] text-white px-5 py-2 rounded-xl text-sm shadow-md hover:bg-[#2563eb] transition"
      >
        Back to Home
      </button>
    </div>
  );
};

export default Level2;
