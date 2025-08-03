import React, { useState } from 'react';
import Home from './pages/Home';
import Level1 from './pages/Level1';
import Level2 from './pages/Level2';
import Level3 from './pages/Level3';
import Level4 from './pages/Level4';
import Level5 from './pages/Level5';
import Dashboard from './pages/Dashboard';

// Improved user picker: friendly design and clear validation
function UserPicker({ onSubmit }) {
  const [tempId, setTempId] = useState('');
  const [tempAge, setTempAge] = useState('');
  const [error, setError] = useState('');

  const onProceed = () => {
    const ageNum = parseInt(tempAge, 10);
    if (!tempId.trim()) return setError("Please enter your name or ID.");
    if (!ageNum || isNaN(ageNum) || ageNum < 3 || ageNum > 20) {
      return setError("Enter a valid age (3-20).");
    }
    setError('');
    onSubmit(tempId.trim(), ageNum);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-yellow-100 to-pink-100 px-4">
      <div className="w-full max-w-sm mx-auto bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center animate-fade-in-up">
        <h1 className="text-3xl font-extrabold text-yellow-700 mb-4">👋 Welcome!</h1>
        <p className="text-gray-700 text-lg mb-6">Start by telling us who is playing.</p>
        <input
          className="border-2 border-yellow-200 p-3 rounded-xl text-xl mb-4 w-full focus:outline-yellow-400"
          placeholder="Your name or ID"
          value={tempId}
          onChange={e => setTempId(e.target.value)}
          autoFocus
        />
        <input
          className="border-2 border-yellow-200 p-3 rounded-xl text-xl mb-2 w-full focus:outline-yellow-400"
          placeholder="Your Age"
          type="number"
          value={tempAge}
          onChange={e => setTempAge(e.target.value)}
          min={3}
          max={20}
        />
        {error && <div className="mb-2 text-red-600 text-base">{error}</div>}
        <button
          className="mt-2 w-full bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-bold py-3 px-6 rounded-xl text-lg transition-transform transform hover:scale-105 shadow-lg"
          onClick={onProceed}
        >Let's Play!</button>
      </div>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out; }
      `}</style>
    </div>
  );
}

export default function App() {
  const [userId, setUserId] = useState(() =>
    localStorage.getItem('userId') || ''
  );
  const [age, setAge] = useState(() =>
    Number(localStorage.getItem('age')) || ''
  );
  const [screen, setScreen] = useState('home');

  const handleUserIdChosen = (id, ageNum) => {
    localStorage.setItem('userId', id);
    localStorage.setItem('age', ageNum);
    setUserId(id);
    setAge(ageNum);
    setScreen('home');
  };

  const navigate = (to, id = userId, userAge = age) => {
    if (id) {
      localStorage.setItem('userId', id);
      setUserId(id);
    }
    if (userAge) {
      localStorage.setItem('age', userAge);
      setAge(userAge);
    }
    setScreen(to);
  };

  if (!userId || !age) {
    return <UserPicker onSubmit={handleUserIdChosen} />;
  }

  // Home: show who is playing, clean switcher
  const renderScreen = () => {
    switch (screen) {
      case 'level1':
        return <Level1 onGoHome={() => navigate('home')} userId={userId} age={age} />;
      case 'level2':
        return <Level2 onGoHome={() => navigate('home')} userId={userId} age={age} />;
      case 'level3':
        return <Level3 onGoHome={() => navigate('home')} userId={userId} age={age} />;
      case 'level4':
        return <Level4 onGoHome={() => navigate('home')} userId={userId} age={age} />;
      case 'level5':
        return <Level5 onGoHome={() => navigate('home')} userId={userId} age={age} />;
      case 'dashboard':
        return <Dashboard onGoHome={() => navigate('home')} userId={userId} age={age} />;
      case 'home':
      default:
        return (
          <Home
            userId={userId}
            age={age}
            onStartLevel1={() => navigate('level1')}
            onStartLevel2={() => navigate('level2')}
            onStartLevel3={() => navigate('level3')}
            onStartLevel4={() => navigate('level4')}
            onStartLevel5={() => navigate('level5')}
            onManage={() => navigate('dashboard')}
            onChangeUser={() => {
              localStorage.removeItem('userId');
              localStorage.removeItem('age');
              setUserId('');
              setAge('');
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-yellow-100 to-pink-100 p-4">
      {renderScreen()}
    </div>
  );
}
