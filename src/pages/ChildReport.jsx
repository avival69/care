import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { UserIcon } from "@heroicons/react/24/solid";

const GAME_DEFS = [
  { key: "color", display: "Color Spotter", variants: ["Color Spotter"], icon: "🎨", color: "pink" },
  { key: "emotion", display: "Emotion Detector", variants: ["Emotion Detector", "EmotionMatch"], icon: "😊", color: "sky" },
  { key: "letterSound", display: "Letter Sound", variants: ["Letter Sound", "LetterSound"], icon: "🔤", color: "teal" },
  { key: "symbol", display: "Symbol Spotter", variants: ["Symbol Spotter"], icon: "✨", color: "amber" },
  { key: "emotionAdventure", display: "Emotion Adventure", variants: ["Emotion Adventure"], icon: "🌟", color: "indigo" }
];

const getAgeNorms = (age) => {
  if (age >= 3 && age <= 5) {
    return { omission: [0.12, 0.05], commission: [0.07, 0.03], mean_rt: [650, 100], rt_sd: [180, 40] };
  } else if (age >= 6 && age <= 9) {
    return { omission: [0.08, 0.04], commission: [0.05, 0.02], mean_rt: [550, 80], rt_sd: [150, 30] };
  }
  return null;
};

const calcZ = (x, mean, std) => (x - mean) / std;

function PercentBar({ val, max = 4, color }) {
  return (
    <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
      <div style={{ width: `${Math.min((val / max) * 100, 100)}%` }} className={`h-3 rounded bg-${color}-400 transition-all duration-500`} />
    </div>
  );
}

export default function ChildReport({ name, onBack }) {
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [adhdMetrics, setAdhdMetrics] = useState(null);

  useEffect(() => {
    if (!name) return;
    async function loadData() {
      const userDocRef = doc(db, "artifacts", "default-app-id", "users", name);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.exists() ? userDocSnap.data() : {};
      setProfile({ name, age: userData.age ?? "—", createdAt: userData.createdAt ?? null });

      // Merge localStorage + Firestore sessions
      let lsSessions = [];
      try {
        const parsed = JSON.parse(localStorage.getItem("gameSessions") ?? "[]");
        if (Array.isArray(parsed)) lsSessions = parsed.filter((s) => s.kid === name);
      } catch {}
      let combinedSessions = [...lsSessions];
      if (Array.isArray(userData.sessions)) combinedSessions = combinedSessions.concat(userData.sessions);
      combinedSessions.sort((a, b) => new Date(b.date) - new Date(a.date));
      setSessions(combinedSessions);

      computeAdhdMetrics(combinedSessions, userData.age);
    }
    loadData();
  }, [name]);

  function computeAdhdMetrics(allSessions, age) {
    if (!age) { setAdhdMetrics(null); return; }
    let hits = 0, misses = 0, falseAlarms = 0, totalTargets = 0, rtSamples = [];
    allSessions.forEach((s) => {
      hits += s.hits ?? 0;
      misses += s.misses ?? 0;
      falseAlarms += s.falseAlarms ?? 0;
      totalTargets += s.totalTargets ?? 0;
      if (Array.isArray(s.trials)) {
        s.trials.forEach((t) => {
          if (typeof t.response_time === "number" && t.response_time > 0)
            rtSamples.push(t.response_time);
        });
      }
    });
    const omission = totalTargets ? misses / totalTargets : 0;
    const commission = (hits + falseAlarms) ? falseAlarms / (hits + falseAlarms) : 0;
    const meanRT = rtSamples.length ? rtSamples.reduce((a, b) => a + b, 0) / rtSamples.length : 0;
    const sdRT =
      rtSamples.length > 1
        ? Math.sqrt(rtSamples.reduce((acc, rv) => acc + (rv - meanRT) ** 2, 0) / (rtSamples.length - 1))
        : 0;
    const norms = getAgeNorms(age);
    if (!norms) { setAdhdMetrics(null); return; }
    const zOmission = calcZ(omission, ...norms.omission);
    const zCommission = calcZ(commission, ...norms.commission);
    const zSdRT = calcZ(sdRT, ...norms.rt_sd);
    const compositeScore = zOmission + zCommission + zSdRT;
    const flags = [zOmission, zCommission, zSdRT].filter((z) => z > 1.5).length;
    setAdhdMetrics({ omission, commission, meanRT, sdRT, zOmission, zCommission, zSdRT, compositeScore, flags, isAtRisk: flags >= 2 });
  }

  // Per-game summaries (all variants included)
  const gameSummaries = GAME_DEFS.map(({ key, display, variants, icon, color }) => {
    const filteredSessions = sessions.filter((s) => variants.includes(s.game));
    const attempts = filteredSessions.length;
    const bestScore = attempts
      ? Math.max(...filteredSessions.map((s) => typeof s.score === "number" ? s.score : (s.hits ?? 0)))
      : 0;
    const latestRisk = attempts && typeof filteredSessions[0].risk_score === "number"
      ? filteredSessions[0].risk_score
      : null;
    return { key, display, attempts, bestScore, latestRisk, icon, color };
  });

  const totalPlays = sessions.length;
  const avgScore = totalPlays
    ? (sessions.reduce((acc, s) => acc + (s.score ?? s.hits ?? 0), 0) / totalPlays).toFixed(1)
    : "—";

  if (!profile) return <div className="p-12 text-lg text-gray-700">Loading profile...</div>;

  return (
    <div className="w-screen h-screen overflow-auto bg-white p-6 font-sans text-gray-800">
      <button
        onClick={onBack}
        className="mb-6 bg-gray-200 text-gray-900 rounded-lg px-6 py-3 font-semibold shadow hover:bg-gray-300 transition"
        aria-label="Back to Kids List"
      >
        ← Back to Kid List
      </button>
      <div className="max-w-screen-lg mx-auto">
        <div className="flex items-center space-x-6 mb-10">
          <UserIcon className="text-blue-300 w-24 h-24 bg-blue-50 rounded-full p-4" />
          <div>
            <h1 className="text-4xl font-extrabold">{profile.name}</h1>
            <p className="text-lg">Age: {profile.age}</p>
            {profile.createdAt && (
              <p className="text-sm text-gray-500">
                Joined: {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            )}
            <p className="mt-6 font-semibold">Sessions Played: {totalPlays}</p>
            <p className="font-semibold">Average Score: {avgScore}</p>
          </div>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
          {gameSummaries.map(
            ({ key, display, attempts, bestScore, latestRisk, icon, color }) =>
              attempts > 0 && (
                <div key={key} className={`bg-${color}-50 rounded p-4 shadow flex flex-col items-center`}>
                  <div className="text-6xl select-none">{icon}</div>
                  <h3 className="text-xl font-semibold mb-1">{display}</h3>
                  <p className="text-sm mb-2">Attempts: {attempts}</p>
                  <p className="text-2xl font-bold mb-2">{bestScore}</p>
                  {latestRisk !== null && (
                    <p className={`text-sm ${latestRisk > 2 ? "text-red-600" : "text-gray-700"}`}>Recent Risk: {latestRisk.toFixed(2)}</p>
                  )}
                  <PercentBar val={bestScore} color={color} max={4} />
                </div>
              )
          )}
        </section>

        {/* Session history with dyslexia flag for Letter Sound */}
        <section className="mb-12 max-w-screen-lg mx-auto">
          <h2 className="text-2xl font-bold mb-4">Session History</h2>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300 rounded text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="p-2 border border-gray-300">Date</th>
                  <th className="p-2 border border-gray-300">Game</th>
                  <th className="p-2 border border-gray-300">Score</th>
                  <th className="p-2 border border-gray-300">Accuracy</th>
                  <th className="p-2 border border-gray-300">Avg Time (s)</th>
                  <th className="p-2 border border-gray-300">Dyslexia Flag</th>
                  <th className="p-2 border border-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center p-6 text-gray-500">
                      No sessions found.
                    </td>
                  </tr>
                )}
                {sessions.map((s, idx) => (
                  <tr key={idx} className={s.flag_dyslexia ? 'bg-yellow-100' : ''}>
                    <td className="px-2 py-1 border border-gray-300">
                      {s.date ? new Date(s.date).toLocaleString() : "—"}
                    </td>
                    <td className="px-2 py-1 border border-gray-300">{s.game}</td>
                    <td className="px-2 py-1 border border-gray-300 font-semibold">{typeof s.score === "number" ? s.score : s.hits ?? "—"}</td>
                    <td className="px-2 py-1 border border-gray-300">{typeof s.accuracy === "number" ? (s.accuracy * 100).toFixed(0) + "%" : "—"}</td>
                    <td className="px-2 py-1 border border-gray-300">{typeof s.avg_time === "number" ? s.avg_time.toFixed(2) : "—"}</td>
                    <td className="px-2 py-1 border border-gray-300">{s.flag_dyslexia ? "⚠️" : ""}</td>
                    <td className="px-2 py-1 border border-gray-300">{s.status ?? "Completed"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ADHD summary */}
        {adhdMetrics && (
          <section className="max-w-screen-md mx-auto bg-yellow-50 p-6 rounded shadow my-12">
            <h2 className="text-2xl font-bold mb-4 text-yellow-900">ADHD Screening Summary</h2>
            <div className="grid grid-cols-2 gap-4 text-yellow-900 mb-4">
              <div>Omission Rate: {(adhdMetrics.omission * 100).toFixed(1)}%</div>
              <div>Commission Rate: {(adhdMetrics.commission * 100).toFixed(1)}%</div>
              <div>Mean Reaction Time: {(adhdMetrics.meanRT * 1000).toFixed(0)} ms</div>
              <div>Reaction Time SD: {(adhdMetrics.sdRT * 1000).toFixed(0)} ms</div>
            </div>
            <div>
              <strong>Z-Scores:</strong>
              <ul className="list-disc list-inside">
                <li>Omission: {adhdMetrics.zOmission.toFixed(2)}</li>
                <li>Commission: {adhdMetrics.zCommission.toFixed(2)}</li>
                <li>RT SD: {adhdMetrics.zSdRT.toFixed(2)}</li>
              </ul>
            </div>
            <div className="mt-2">
              Composite Score: {adhdMetrics.compositeScore.toFixed(2)}<br />
              Flags triggered: {adhdMetrics.flags} / 3 —{" "}
              {adhdMetrics.isAtRisk
                ? "Elevated ADHD risk detected; consult a specialist."
                : "No elevated risk detected."}
            </div>
          </section>
        )}

        {/* AI placeholder */}
        <section className="max-w-screen-lg mx-auto bg-indigo-50 p-6 rounded shadow my-12">
          <h2 className="text-2xl font-bold mb-4 text-indigo-900">AI Summary (Gemini)</h2>
          <pre className="whitespace-pre-wrap select-text font-mono text-base text-indigo-900">
            AI report generation not available in frontend due to CORS. Use backend proxy.
          </pre>
        </section>
      </div>
    </div>
  );
}
