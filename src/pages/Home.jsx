// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { 
  signInAnonymously,
  signInWithCustomToken,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  PaintBrushIcon,
  FaceSmileIcon,
  MusicalNoteIcon,
  SparklesIcon,
  StarIcon,
  Cog6ToothIcon,
  PlayCircleIcon,
  UserIcon,
} from '@heroicons/react/24/solid';

// Name + Age Popup
const NamePopup = ({ onProfileSubmit }) => {
  const [name, setName] = useState('');
  const [age, setAge]   = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    if (name.trim() && age > 0) {
      onProfileSubmit(name.trim().toLowerCase(), parseInt(age));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full text-center p-8 animate-fade-in-up">
        <UserIcon className="h-16 w-16 mx-auto text-indigo-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Welcome to CareGame!</h2>
        <p className="text-gray-500 mb-6">Please enter your name and age to begin.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full px-4 py-3 border rounded-xl text-lg text-center focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="number"
            placeholder="Your Age"
            value={age}
            onChange={e => setAge(e.target.value)}
            required min="1"
            className="w-full px-4 py-3 border rounded-xl text-lg text-center focus:ring-2 focus:ring-indigo-500"
          />
          <button className="w-full bg-indigo-500 text-white py-3 rounded-xl font-bold hover:bg-indigo-600 transition">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

// Admin Login Modal
const LoginModal = ({ onCancel, onSuccess }) => {
  const [email, setEmail]     = useState('');
  const [password, setPassword]= useState('');
  const [error, setError]     = useState('');

  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch {
      setError('Login failed. Check credentials.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-sm space-y-4">
        <h2 className="text-xl font-bold text-center">Admin Login</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          type="email" placeholder="Email" required
          value={email} onChange={e=>setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400"
        />
        <input
          type="password" placeholder="Password" required
          value={password} onChange={e=>setPassword(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400"
        />
        <div className="flex justify-between">
          <button type="button" onClick={onCancel} className="text-gray-600">
            Cancel
          </button>
          <button className="bg-indigo-500 text-white px-4 py-2 rounded-lg">
            Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default function Home({
  onStartLevel1,
  onStartLevel2,
  onStartLevel3,
  onStartLevel4,
  onStartLevel5,
  onManage
}) {
  const [userId, setUserId]     = useState(localStorage.getItem('userId') || null);
  const [ready, setReady]       = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (window.__initial_auth_token) {
          await signInWithCustomToken(auth, window.__initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const saveProfile = async (name, age) => {
    const appId = window.__app_id || 'default-app-id';
    const ref   = doc(db, `artifacts/${appId}/users`, name);
    const snap  = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { name, age, createdAt: serverTimestamp() });
    }
    localStorage.setItem('userId', name);
    setUserId(name);
  };

  if (!ready) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!userId) return <NamePopup onProfileSubmit={saveProfile} />;

  const levels = [
    { desc: 'Color Spotter',       color: 'pink',  icon: <PaintBrushIcon className="h-12 w-12 text-white/70" />,   fn: () => onStartLevel1(userId) },
    { desc: 'Emotion Detector',    color: 'sky',   icon: <FaceSmileIcon className="h-12 w-12 text-white/70" />,    fn: () => onStartLevel2(userId) },
    { desc: 'Letter-Sound Match',  color: 'teal',  icon: <MusicalNoteIcon className="h-12 w-12 text-white/70" />, fn: () => onStartLevel3(userId) },
    { desc: 'Symbol Spotter',      color: 'amber', icon: <SparklesIcon className="h-12 w-12 text-white/70" />,  fn: () => onStartLevel4(userId) },
    { desc: 'Emotion Adventure',   color: 'indigo',icon: <StarIcon className="h-12 w-12 text-white/70" />,     fn: () => onStartLevel5(userId) },
  ];

  const bgMap = {
    pink:  'bg-pink-400 hover:bg-pink-500',
    sky:   'bg-sky-400 hover:bg-sky-500',
    teal:  'bg-teal-400 hover:bg-teal-500',
    amber: 'bg-amber-400 hover:bg-amber-500',
    indigo:'bg-indigo-400 hover:bg-indigo-500',
  };

  return (
    <div className="min-h-screen w-full font-poppins text-gray-800 px-4 pb-8">
      {showLogin && (
        <LoginModal
          onSuccess={() => { setShowLogin(false); onManage(); }}
          onCancel={() => setShowLogin(false)}
        />
      )}

      <header className="relative py-8 text-center">
        <h1 className="text-5xl font-extrabold">CareGame</h1>
        <button
          onClick={() => setShowLogin(true)}
          className="absolute top-6 right-6 flex items-center gap-2 bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-all"
        >
          <Cog6ToothIcon className="h-5 w-5" /> Manage
        </button>
      </header>

      <main className="max-w-7xl mx-auto mt-4">
        <h2 className="text-3xl text-center font-bold mb-8">Select a Level</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {levels.map((lvl, i) => (
            <div
              key={i}
              onClick={lvl.fn}
              className="cursor-pointer rounded-2xl shadow-lg overflow-hidden transition hover:shadow-2xl hover:-translate-y-1"
            >
              <div className={`${bgMap[lvl.color]} h-40 flex items-center justify-center relative text-white`}>
                {lvl.icon}
                <span className="absolute top-2 right-2 bg-black/30 rounded-full w-8 h-8 flex items-center justify-center font-bold text-white">
                  {i+1}
                </span>
              </div>
              <div className="p-4 text-center bg-white">
                <p className="font-bold text-lg text-gray-700">{lvl.desc}</p>
                <PlayCircleIcon className="h-6 w-6 text-indigo-500 mx-auto mt-2" />
              </div>
            </div>
          ))}
        </div>
      </main>

      <style>{`
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
