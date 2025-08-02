import React, { useState, useEffect } from 'react';

/**
 * Dashboard Component: Displays analytics from past game sessions.
 * @param {object} props - Component props.
 * @param {function} props.onGoHome - Callback to return to the home screen.
 */
const Dashboard = ({ onGoHome }) => {
    const [sessions, setSessions] = useState([]);

    // On component mount, load the data from Local Storage.
    // This is where you would fetch data from Firebase instead.
    useEffect(() => {
        try {
            const savedData = JSON.parse(localStorage.getItem('gameSessions')) || [];
            // Sort sessions by date, most recent first
            savedData.sort((a, b) => new Date(b.date) - new Date(a.date));
            setSessions(savedData);
        } catch (error) {
            console.error("Failed to load game sessions:", error);
            setSessions([]);
        }
    }, []);

    // A simple calculation for an "analytic" view
    const averageScore = sessions.length > 0 
        ? (sessions.reduce((acc, s) => acc + s.score, 0) / sessions.length).toFixed(0)
        : 0;

    return (
        <div 
            className="p-8 bg-white rounded-xl shadow-lg w-full max-w-3xl mx-auto"
            style={{ borderColor: '#91C8E4' }}
        >
            <h1 className="text-3xl font-bold text-center mb-6" style={{ color: '#4682A9' }}>
                Game Analytics
            </h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(145, 200, 228, 0.1)' }}>
                    <h3 className="text-sm font-semibold" style={{ color: '#749BC2' }}>Total Games Played</h3>
                    <p className="text-2xl font-bold" style={{ color: '#4682A9' }}>{sessions.length}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(145, 200, 228, 0.1)' }}>
                    <h3 className="text-sm font-semibold" style={{ color: '#749BC2' }}>Average Score</h3>
                    <p className="text-2xl font-bold" style={{ color: '#4682A9' }}>{averageScore}</p>
                </div>
            </div>

            {/* Session History */}
            <h2 className="text-xl font-bold mb-4" style={{ color: '#4682A9' }}>Session History</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {sessions.length > 0 ? (
                    sessions.map((session, index) => (
                        <div key={index} className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(116, 155, 194, 0.1)'}}>
                            <div>
                                <p className="font-semibold" style={{ color: '#4682A9' }}>{session.game}</p>
                                <p className="text-xs" style={{ color: '#749BC2' }}>{new Date(session.date).toLocaleString()}</p>
                            </div>
                            <p className="font-bold text-lg" style={{ color: '#4682A9' }}>{session.score}</p>
                        </div>
                    ))
                ) : (
                    <p style={{ color: '#749BC2' }}>No game data found. Play a game to see your stats!</p>
                )}
            </div>

            <div className="text-center mt-8">
                <button 
                    onClick={onGoHome} 
                    className="text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    style={{ backgroundColor: '#4682A9' }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#749BC2'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = '#4682A9'}
                >
                    Back to Home
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
