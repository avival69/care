import React, { useState } from 'react';
import Home from './pages/Home';
import Level1 from './pages/Level1';
import Level2 from './pages/Level2';
import Level3 from './pages/Level3';
import Level4 from './pages/Level4';
import Level5 from './pages/Level5';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');

  const navigate = (to, id = userId) => {
    if (id) {
      localStorage.setItem('userId', id);
      setUserId(id);
    }
    setScreen(to);
  };

  const renderScreen = () => {
    switch (screen) {
      case 'level1':
        return <Level1 onGoHome={() => navigate('home')} userId={userId} />;
      case 'level2':
        return <Level2 onGoHome={() => navigate('home')} userId={userId} />;
      case 'level3':
        return <Level3 onGoHome={() => navigate('home')} userId={userId} />;
      case 'level4':
        return <Level4 onGoHome={() => navigate('home')} userId={userId} />;
      case 'level5':
        return <Level5 onGoHome={() => navigate('home')} userId={userId} />;
      case 'dashboard':
        return <Dashboard onGoHome={() => navigate('home')} userId={userId} />;
      case 'home':
      default:
        return (
          <Home
            onStartLevel1={() => navigate('level1')}
            onStartLevel2={() => navigate('level2')}
            onStartLevel3={() => navigate('level3')}
            onStartLevel4={() => navigate('level4')}
            onStartLevel5={() => navigate('level5')}
            onManage={() => navigate('dashboard')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFBDE] p-4">
      {renderScreen()}
    </div>
  );
}
