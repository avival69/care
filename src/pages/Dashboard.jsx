import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import ChildReport from './ChildReport';

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
