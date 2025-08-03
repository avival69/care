import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

// --- ChildReport Component (individual kid's report) ---
function ChildReport({ name, onBack }) {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    try {
      const all = JSON.parse(localStorage.getItem('gameSessions')) || [];
      const filtered = all.filter(s => s.kid === name);
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      setSessions(filtered);
    } catch {
      setSessions([]);
    }
  }, [name]);

  const total = sessions.length;
  const avgScore = total > 0 ? (sessions.reduce((a, s) => a + s.score, 0) / total).toFixed(0) : 0;
  const completed = sessions.filter(s => s.status === 'Completed');
  const avgTime = completed.length > 0 ? (completed.reduce((a, s) => a + s.timeTaken, 0) / completed.length).toFixed(1) : 0;

  return (
    <div className="p-8 bg-white rounded-xl shadow-lg max-w-3xl mx-auto">
      <button onClick={onBack} className="mb-4 text-blue-500 underline">Back to Kids List</button>
      <h1 className="text-2xl font-bold mb-4">Report for {name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-500">Games Played</h3>
          <p className="text-3xl font-bold text-blue-800">{total}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="text-sm font-semibold text-green-500">Average Score</h3>
          <p className="text-3xl font-bold text-green-800">{avgScore}</p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg">
          <h3 className="text-sm font-semibold text-yellow-500">Avg. Time</h3>
          <p className="text-3xl font-bold text-yellow-800">{avgTime}s</p>
        </div>
      </div>
      <h2 className="text-xl font-bold mb-4">Session History</h2>
      <div className="space-y-3 max-h-80 overflow-y-auto pr-2 border rounded-lg p-2 bg-gray-50">
        {sessions.map((s, i) => (
          <div key={i} className="flex justify-between items-center p-3 bg-white shadow-sm rounded-lg">
            <div>
              <p className="font-semibold text-gray-800">
                {s.game} - 
                <span className={s.status === 'Completed' ? 'text-green-600' : 'text-red-600'}>{s.status}</span>
              </p>
              <p className="text-xs text-gray-500">{new Date(s.date).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-blue-600">{s.score} pts</p>
              <p className="text-sm text-gray-500">{s.timeTaken}s</p>
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <p className="text-center text-gray-500 py-4">No sessions for {name}.</p>
        )}
      </div>
    </div>
  );
}

// --- Dashboard Component (lists kids) ---
export default function Dashboard({ onGoHome }) {
  const [kids, setKids] = useState([]);
  const [selectedKid, setSelectedKid] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const appId = window.__app_id || 'default-app-id';
        const col = collection(db, `artifacts/${appId}/users`);
        const snaps = await getDocs(col);
        setKids(snaps.docs.map(doc => doc.id));
      } catch (e) {
        console.error('Failed to load kids:', e);
        setKids([]);
      }
    })();
  }, []);

  if (selectedKid) {
    return <ChildReport name={selectedKid} onBack={() => setSelectedKid(null)} />;
  }

  return (
    <div className="p-8 bg-white rounded-xl shadow-lg w-full max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6 text-blue-700">Kids List</h1>
      <ul className="space-y-2">
        {kids.map(kid => (
          <li key={kid}>
            <button
              onClick={() => setSelectedKid(kid)}
              className="w-full text-left p-4 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              {kid}
            </button>
          </li>
        ))}
        {kids.length === 0 && (
          <p className="text-center text-gray-500">No kids found.</p>
        )}
      </ul>
      <div className="text-center mt-8">
        <button
          onClick={onGoHome}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
