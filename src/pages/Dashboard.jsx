import React, { useState, useEffect } from 'react';

const Dashboard = ({ onGoHome }) => {
    const [sessions, setSessions] = useState([]);

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

    // Analytics Calculations
    const totalGames = sessions.length;
    const averageScore = totalGames > 0 ? (sessions.reduce((acc, s) => acc + s.score, 0) / totalGames).toFixed(0) : 0;
    const completedGames = sessions.filter(s => s.status === 'Completed');
    const averageTime = completedGames.length > 0 ? (completedGames.reduce((acc, s) => acc + s.timeTaken, 0) / completedGames.length).toFixed(1) : 0;

    return (
        <div className="p-8 bg-white rounded-xl shadow-lg w-full max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-6 text-blue-700">Kid's Dashboard</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-sm font-semibold text-blue-500">Total Games Played</h3>
                    <p className="text-3xl font-bold text-blue-800">{totalGames}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="text-sm font-semibold text-green-500">Average Score</h3>
                    <p className="text-3xl font-bold text-green-800">{averageScore}</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                    <h3 className="text-sm font-semibold text-yellow-500">Avg. Time (Completed)</h3>
                    <p className="text-3xl font-bold text-yellow-800">{averageTime}s</p>
                </div>
            </div>

            {/* Session History */}
            <h2 className="text-xl font-bold mb-4 text-blue-700">Game History</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 border rounded-lg p-2 bg-gray-50">
                {sessions.length > 0 ? (
                    sessions.map((session, index) => (
                        <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-white shadow-sm">
                            <div>
                                <p className="font-semibold text-gray-800">{session.game} - <span className={session.status === 'Completed' ? 'text-green-600' : 'text-red-600'}>{session.status}</span></p>
                                <p className="text-xs text-gray-500">{new Date(session.date).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg text-blue-600">{session.score} pts</p>
                                <p className="text-sm text-gray-500">{session.timeTaken}s</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500 py-4">No game data found. Play a game to see your stats!</p>
                )}
            </div>

            {/* Back Button */}
            <div className="text-center mt-8">
                <button
                    onClick={onGoHome}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                    Back to Home
                </button>
            </div>
        </div>
    );
};

export default Dashboard;