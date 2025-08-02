import React from 'react';

/**
 * Home Component: Level selection menu with Levels 1-5 enabled.
 * @param {function} onStartLevel1 - Callback to start Level 1
 * @param {function} onStartLevel2 - Callback to start Level 2
 * @param {function} onStartLevel3 - Callback to start Level 3
 * @param {function} onStartLevel4 - Callback to start Level 4
 * @param {function} onStartLevel5 - Callback to start Level 5
 * @param {function} onGoToDashboard - Callback to go to Dashboard
 */
const Home = ({ onStartLevel1, onStartLevel2, onStartLevel3, onStartLevel4, onStartLevel5, onGoToDashboard }) => {
  const levels = [
    { name: 'Level 1', description: 'Color Spotter', enabled: true },
    { name: 'Level 2', description: 'Emotion Detector', enabled: true },
    { name: 'Level 3', description: 'Letter-Sound Match', enabled: true },
    { name: 'Level 4', description: 'Symbol Spotter', enabled: true },
    { name: 'Level 5', description: 'Coming Soon', enabled: true }, // Enable Level 5
  ];

  const handleLevelClick = (index) => {
    if (index === 0) onStartLevel1();
    if (index === 1) onStartLevel2();
    if (index === 2) onStartLevel3();
    if (index === 3) onStartLevel4();
    if (index === 4) onStartLevel5(); // Add click handler for Level 5
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f0f4f8] to-[#dbeafe] font-poppins">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold text-[#1e3a8a]">CareGame</h1>
          <button
            onClick={onGoToDashboard}
            className="bg-[#3b82f6] text-white px-5 py-2.5 rounded-xl text-sm shadow-md hover:bg-[#2563eb] transition"
          >
            Manage
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-grow flex flex-col items-center justify-center">
          <div className="w-full bg-white rounded-3xl p-10 shadow-lg">
            <h2 className="text-2xl text-center font-semibold text-[#1e3a8a] mb-8">
              Select a Level
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {levels.map((level, index) => (
                <div
                  key={level.name}
                  onClick={() => level.enabled && handleLevelClick(index)}
                  className={`
                    aspect-square rounded-2xl flex flex-col justify-center items-center text-center shadow-sm
                    transition-transform duration-200
                    ${level.enabled
                      ? 'bg-[#eff6ff] cursor-pointer hover:shadow-lg hover:-translate-y-1'
                      : 'bg-[#f3f4f6] text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  <h3 className={`text-3xl font-bold ${level.enabled ? 'text-[#1e40af]' : 'text-gray-400'}`}>
                    {index + 1}
                  </h3>
                  <p className="mt-2 text-sm font-medium">
                    {level.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
