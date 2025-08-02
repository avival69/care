import React, { useState } from 'react';
import Home from './pages/Home';
import Level1 from './pages/Level1';
import Level2 from './pages/Level2';
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
            case 'dashboard':
                return <Dashboard onGoHome={() => handleNavigate('home')} />;
            case 'home':
            default:
                return (
                    <Home
                        onStartLevel1={() => handleNavigate('level1')}
                        onStartLevel2={() => handleNavigate('level2')}
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
