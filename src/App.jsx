import React, { useState } from 'react';
import Home from './pages/Home';
import Level1 from './pages/Level1';
import Level2 from './pages/Level2';
import Level3 from './pages/Level3';
import Level4 from './pages/Level4';
import Level5 from './pages/Level5'; // Import Level 5
import Dashboard from './pages/Dashboard';

export default function App() {
    const [screen, setScreen] = useState('home');

    const handleNavigate = (targetScreen) => {
        setScreen(targetScreen);
    };

    const renderScreen = () => {
        switch (screen) {
            case 'level1':
                return <Level1 onGoHome={() => handleNavigate('home')} />;
            case 'level2':
                return <Level2 onGoHome={() => handleNavigate('home')} />;
            case 'level3':
                return <Level3 onGoHome={() => handleNavigate('home')} />;
            case 'level4':
                return <Level4 onGoHome={() => handleNavigate('home')} />;
            case 'level5': // Add case for Level 5
                return <Level5 onGoHome={() => handleNavigate('home')} />;
            case 'dashboard':
                return <Dashboard onGoHome={() => handleNavigate('home')} />;
            case 'home':
            default:
                return (
                    <Home
                        onStartLevel1={() => handleNavigate('level1')}
                        onStartLevel2={() => handleNavigate('level2')}
                        onStartLevel3={() => handleNavigate('level3')}
                        onStartLevel4={() => handleNavigate('level4')}
                        onStartLevel5={() => handleNavigate('level5')} // Pass handler for Level 5
                        onGoToDashboard={() => handleNavigate('dashboard')}
                    />
                );
        }
    };

    return (
        <div
            className="text-gray-800 flex items-center justify-center min-h-screen p-4 font-sans"
            style={{ backgroundColor: '#FFFBDE' }}
        >
            {renderScreen()}
        </div>
    );
}
