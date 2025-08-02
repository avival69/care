import React from 'react';

const Level5 = ({ onGoHome }) => {
  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-[#f0f4f8] to-[#dbeafe] flex flex-col items-center justify-center p-4 font-poppins">
      <div className="absolute top-4 left-4 z-20">
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
      <div className="text-center p-8 bg-white rounded-2xl shadow-2xl animate-fade-in max-w-lg z-10">
        <h1 className="text-4xl md:text-5xl font-bold text-[#1e3a8a] mb-4">Level 5</h1>
        <p className="text-lg text-gray-600">This level is currently under construction.</p>
        <p className="text-lg text-gray-600 mb-6">Coming Soon!</p>
        <button
          onClick={onGoHome}
          className="px-12 py-4 bg-[#3b82f6] text-white font-bold rounded-full text-xl hover:bg-[#2563eb] transition-all transform hover:scale-105 shadow-lg"
        >
          Go Back
        </button>
      </div>
       <style>{`.animate-fade-in { animation: fade-in 0.5s ease-out forwards; } @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
};

export default Level5;