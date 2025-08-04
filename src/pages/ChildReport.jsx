import React, { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { UserIcon } from "@heroicons/react/24/solid";
import {
  isColorBlind,
  computeEmotionScore,
  computeLetterSoundStats,
  computeSymbolSpotterAdhdMetrics,
  computeAnxietyScore,
} from "./logic";

const GAME_DEFS = [
  { key: "color", display: "Color Spotter", variants: ["Color Spotter"], icon: "🎨", color: "pink" },
  { key: "emotion", display: "Emotion Detector", variants: ["Emotion Detector", "EmotionMatch"], icon: "😊", color: "sky" },
  { key: "letterSound", display: "Letter Sound", variants: ["Letter Sound", "LetterSound"], icon: "🔤", color: "teal" },
  { key: "symbol", display: "Symbol Spotter", variants: ["Symbol Spotter"], icon: "✨", color: "amber" },
  { key: "emotionAdventure", display: "Emotion Adventure", variants: ["Emotion Adventure"], icon: "🌟", color: "purple" },
];

function PercentBar({ val, max = 4, color }) {
  const colorMap = {
    pink: "bg-pink-400",
    sky: "bg-sky-400",
    teal: "bg-teal-400",
    amber: "bg-amber-400",
    purple: "bg-purple-400",
  };
  return (
    <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
      <div
        style={{ width: `${Math.min((val / max) * 100, 100)}%` }}
        className={`${colorMap[color] || "bg-gray-400"} h-2 rounded transition-all duration-500`}
      />
    </div>
  );
}

export default function ChildReport({ name, onBack }) {
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [adhdMetrics, setAdhdMetrics] = useState(null);
  const [letterSoundStats, setLetterSoundStats] = useState(null);
  const [emotionMetrics, setEmotionMetrics] = useState(null);
  const [anxietyMetrics, setAnxietyMetrics] = useState(null);

  const [geminiText, setGeminiText] = useState(null);
const [geminiLoading, setGeminiLoading] = useState(false);
const [geminiErr, setGeminiErr] = useState(null);
const GEMINI_API_KEY = process.env.GEMINI; // <--- Paste your key here

useEffect(() => {
  if (!profile) return;

  // Build the AI prompt from metrics
  const metrics = [];
  if (adhdMetrics) {
    metrics.push(`ADHD Screening: omission ${ (adhdMetrics.omission * 100).toFixed(1) }%, commission ${ (adhdMetrics.commission * 100).toFixed(1) }%, mean RT ${ (adhdMetrics.meanRT * 1000).toFixed(0) }ms, risk: ${ adhdMetrics.isAtRisk ? 'Elevated' : 'Normal' }`);
  }
  if (letterSoundStats) {
    metrics.push(`Letter Sound: accuracy ${(letterSoundStats.accuracy * 100).toFixed(1)}%, avg time ${ letterSoundStats.avgTime.toFixed(2) }s, dyslexia risk: ${ letterSoundStats.flagDyslexia ? 'Yes' : 'No' }`);
  }
  if (emotionMetrics) {
    metrics.push(`Emotion Detector: accuracy ${ emotionMetrics.accuracyPercent.toFixed(1) }%, avg response ${ emotionMetrics.avgResponseTime.toFixed(2) }s, risk level ${ emotionMetrics.riskLevel }`);
  }
  if (anxietyMetrics) {
    metrics.push(`Emotion Adventure (Anxiety): score ${ anxietyMetrics.anxietyScore.toFixed(2) }, feedback "${ anxietyMetrics.feedback }", avg RT ${ anxietyMetrics.avgRT.toFixed(2) }s`);
  }

  const prompt = `It should be a summary. Based on the following assessment results for ${ profile.name } (age ${ profile.age }), please suggest targeted strategies or activities to support their current cognitive and emotional health challenges:

- ${ metrics.join("\n- ") }

Provide actionable recommendations for caregivers or therapists, including games, exercises, or lifestyle adjustments.`;

  setGeminiLoading(true);
  setGeminiText(null);
  setGeminiErr(null);

  // Trigger the Gemini API with our new prompt
  fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        { parts: [{ text: prompt }] }
      ]
    })
  })
    .then(res => {
      if (!res.ok) return res.text().then(t => { throw new Error(t) });
      return res.json();
    })
    .then(data => {
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
      setGeminiText(reply);
    })
    .catch(err => setGeminiErr(err.message))
    .finally(() => setGeminiLoading(false));
}, [profile, adhdMetrics, letterSoundStats, emotionMetrics, anxietyMetrics]);


  useEffect(() => {
    if (!name) return;

    const userDocRef = doc(db, "artifacts", "default-app-id", "users", name);

    const unsubscribe = onSnapshot(userDocRef, (userDocSnap) => {
      const userData = userDocSnap.exists() ? userDocSnap.data() : {};

      setProfile({
        name,
        age: userData.age ?? "—",
        createdAt: userData.createdAt ?? null,
      });

      let lsSessions = [];
      try {
        const stored = JSON.parse(localStorage.getItem("gameSessions") ?? "[]");
        if (Array.isArray(stored)) lsSessions = stored.filter((s) => s.kid === name);
      } catch (err) {}

      let combinedSessions = [...lsSessions];
      if (Array.isArray(userData.sessions)) {
        combinedSessions = combinedSessions.concat(userData.sessions);
      }

      // Deduplicate by "date|game|score/hits"
      const seen = new Set();
      const dedupedSessions = [];
      for (const s of combinedSessions) {
        const key = [s.date, s.game, s.score ?? s.hits ?? 0].join("|");
        if (!seen.has(key)) {
          seen.add(key);
          dedupedSessions.push(s);
        }
      }
      dedupedSessions.sort((a, b) => new Date(b.date) - new Date(a.date));
      setSessions(dedupedSessions);

      // Run per-game computations (used for summary cards)
      if (userData.age) {
        const symbolSessions = dedupedSessions.filter(s => s.game === "Symbol Spotter");
        const adhd = computeSymbolSpotterAdhdMetrics(symbolSessions, userData.age);
        setAdhdMetrics(adhd || null);
      } else {
        setAdhdMetrics(null);
      }

      const letterSoundSessions = dedupedSessions.filter(s => s.game === "Letter Sound");
      const letterStats = computeLetterSoundStats(letterSoundSessions);
      setLetterSoundStats(letterStats);

      const emotionSessions = dedupedSessions.filter(s => s.game === "Emotion Detector" || s.game === "EmotionMatch");
      if (emotionSessions.length) {
        const allTrials = emotionSessions.flatMap(s => s.trials || []);
        const emotionScore = computeEmotionScore(allTrials);
        setEmotionMetrics(emotionScore);
      } else {
        setEmotionMetrics(null);
      }

      const emoAdvSessions = dedupedSessions.filter(s => s.game === "Emotion Adventure");
      if (emoAdvSessions.length) {
        const allScores = emoAdvSessions.flatMap(s =>
          Array.isArray(s.choices) ? s.choices.map(c => c.score ?? 0) : Array.isArray(s.scores) ? s.scores : []
        );
        const allRTs = emoAdvSessions.flatMap(s =>
          Array.isArray(s.choices) ? s.choices.map(c => c.rt ?? 0) : Array.isArray(s.rts) ? s.rts : []
        );
        const anxiety = computeAnxietyScore(allScores, allRTs);
        setAnxietyMetrics(anxiety);
      } else {
        setAnxietyMetrics(null);
      }
    });

    return () => unsubscribe();
  }, [name]);

  const totalPlays = sessions.length;
  const avgScore = totalPlays
    ? (sessions.reduce((acc, s) => acc + (s.score ?? s.hits ?? 0), 0) / totalPlays).toFixed(1)
    : "—";

  if (!profile) return <div className="p-12 text-lg text-gray-700">Loading profile...</div>;

  // Helper to render game-specific metrics for the "Overall Game Metrics Summary"
  function renderGameMetrics(key) {
    switch (key) {
      case "color": {
        const colorSessions = sessions.filter(s => s.game === "Color Spotter");
        const flaggedCount = colorSessions.filter(s => s.colorBlind).length;
        return (
          <>
            <td>{colorSessions.length}</td>
            <td>{flaggedCount > 0 ? "Color Blindness Suspected" : "Normal"}</td>
          </>
        );
      }
      case "emotion":
        if (!emotionMetrics) return <><td colSpan={2}>N/A</td></>;
        return (
          <>
            <td>{emotionMetrics.totalTrials}</td>
            <td>{emotionMetrics.riskLevel}</td>
          </>
        );
      case "letterSound":
        if (!letterSoundStats) return <><td colSpan={4}>N/A</td></>;
        return (
          <>
            <td>{letterSoundStats.totalTrials}</td>
            <td>{(letterSoundStats.accuracy * 100).toFixed(1)}%</td>
            <td>{letterSoundStats.avgTime.toFixed(2)} s</td>
            <td>{letterSoundStats.flagDyslexia ? "⚠️ Dyslexia Risk" : "Normal"}</td>
          </>
        );
      case "symbol":
        if (!adhdMetrics) return <><td colSpan={7}>N/A</td></>;
        return (
          <>
            <td>{(adhdMetrics.omission * 100).toFixed(1)}%</td>
            <td>{(adhdMetrics.commission * 100).toFixed(1)}%</td>
            <td>{(adhdMetrics.meanRT * 1000).toFixed(0)} ms</td>
            <td>{(adhdMetrics.sdRT * 1000).toFixed(0)} ms</td>
            <td>{adhdMetrics.zOmission.toFixed(2)}</td>
            <td>{adhdMetrics.zCommission.toFixed(2)}</td>
            <td>{adhdMetrics.isAtRisk ? "Elevated Risk" : "No Elevated Risk"}</td>
          </>
        );
      case "emotionAdventure":
        if (!anxietyMetrics) return <><td colSpan={3}>N/A</td></>;
        return (
          <>
            <td>{anxietyMetrics.anxietyScore.toFixed(2)}</td>
            <td>{anxietyMetrics.feedback}</td>
            <td>{anxietyMetrics.avgRT.toFixed(2)} s</td>
          </>
        );
      default:
        return <td colSpan={2}>N/A</td>;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* HEADER */}
      <div className="flex items-center justify-between max-w-screen-lg mx-auto mb-3 mt-0 px-4">
        <button
          onClick={onBack}
          className="mb-6 mt-6 bg-gray-200 text-gray-900 rounded-full px-6 py-3 font-semibold shadow hover:bg-gray-300"
        >
          ← Back to Kid List
        </button>
        <div />
      </div>

      <div className="max-w-screen-lg mx-auto px-4">

        {/* Profile Info */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-8 mb-10">
          <UserIcon className="text-teal-300 w-28 h-28 bg-white shadow rounded-full p-5" />
          <div className="flex-1 text-left">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-1">{profile.name}</h1>
            <div className="flex gap-6 text-sm text-gray-500">
              <span>
                Age: <b>{profile.age}</b>
              </span>
              {profile.createdAt && <span>Joined: {new Date(profile.createdAt).toLocaleDateString()}</span>}
            </div>
            <div className="mt-4 flex gap-8 text-lg">
              <span className="font-semibold">
                Sessions Played: <b>{totalPlays}</b>
              </span>
              <span className="font-semibold">
                Average Score: <b>{avgScore}</b>
              </span>
            </div>
          </div>
        </div>

        {/* Game Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
          {GAME_DEFS.map(
            ({ key, display, variants, icon, color }) => {
              const filteredSessions = sessions.filter((s) => variants.includes(s.game));
              const attempts = filteredSessions.length;
              if (attempts === 0) return null;

              const bestScore = Math.max(...filteredSessions.map((s) => (typeof s.score === "number" ? s.score : s.hits ?? 0)));
              const latestRisk = filteredSessions.length > 0 ? filteredSessions[0].risk_score ?? null : null;
              const dysFlag = filteredSessions.some((s) => s.flag_dyslexia);
              const anxFlag = filteredSessions.some((s) => s.high_anxiety);

              return (
                <div
                  key={key}
                  className={`relative bg-${color}-50 p-5 rounded-2xl shadow-md flex flex-col items-center border-2 ${
                    dysFlag ? "border-yellow-400" : anxFlag ? "border-red-400" : "border-transparent"
                  }`}
                >
                  <div className="text-6xl mb-1">{icon}</div>
                  {anxFlag && (
                    <span className="absolute top-3 right-3 text-red-600 text-lg font-extrabold" title="High Anxiety">
                      !
                    </span>
                  )}
                  {dysFlag && (
                    <span className="absolute top-3 right-3 text-yellow-600 text-lg font-extrabold" title="Dyslexia Risk">
                      ⚠️
                    </span>
                  )}
                  <h3 className="font-semibold text-md text-center">{display}</h3>
                  <p className="text-xs text-gray-600">Attempts: {attempts}</p>
                  <p className="text-2xl font-black mt-1 mb-0">{bestScore}</p>
                  {latestRisk !== null && (
                    <p className={`text-xs font-semibold ${latestRisk > 2 ? "text-red-600" : "text-gray-700"}`}>
                      Recent Risk: {latestRisk.toFixed(2)}
                    </p>
                  )}
                  <div className="w-full mt-3">
                    <PercentBar val={bestScore} color={color} max={4} />
                  </div>
                </div>
              );
            }
          )}
        </section>

        {/* Session History Table */}
        <section className="mb-12">
  <h2 className="text-2xl font-bold mb-4">Session History</h2>
  <div className="overflow-x-auto">
    <table className="w-full border-separate border-spacing-0 rounded bg-white shadow text-sm">
      <thead>
        <tr className="bg-gray-100 text-gray-700 sticky top-0">
          <th className="p-2">Date</th>
          <th className="p-2">Game</th>
          <th className="p-2">Status</th>
        </tr>
      </thead>
      <tbody>
        {sessions.length === 0 && (
          <tr>
            <td colSpan={3} className="text-center p-6 text-gray-400">
              No sessions found.
            </td>
          </tr>
        )}
        {sessions.map((s, idx) => (
          <tr key={idx}>
            <td className="p-2">{s.date ? new Date(s.date).toLocaleString() : "—"}</td>
            <td className="p-2">{s.game}</td>
            <td className="p-2">{s.status ?? "Completed"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</section>
        

        {/* Color Spotter Wrong Count Table */}
        <section className="mb-10">
  <h2 className="text-xl font-bold mb-2">Color Spotter: Wrong Answer Count</h2>
  <div className="overflow-x-auto">
    <table className="min-w-max w-full bg-white shadow rounded mb-4 text-sm">
      <thead>
        <tr className="bg-pink-100 text-gray-600">
          <th className="p-2">Date</th>
          <th className="p-2">Session Score</th>
          <th className="p-2">Wrong Answers (wrongCount)</th>
        </tr>
      </thead>
      <tbody>
        {sessions.filter(s => s.game === "Color Spotter").map((s, idx) => {

          // Robust retrieval for wrong count
          let wrongCount = "—";
          if (typeof s.n_wrong === "number") wrongCount = s.n_wrong;
          else if (typeof s.wrongCount === "number") wrongCount = s.wrongCount;
          else if (Array.isArray(s.correctAnswers) && Array.isArray(s.answers)) {
              wrongCount = s.correctAnswers.reduce((sum, ans, i) => sum + (s.answers[i] !== ans ? 1 : 0), 0);
          } else if (Array.isArray(s.correctAnswers) && Array.isArray(s.userAnswers)) {
              wrongCount = s.correctAnswers.reduce((sum, ans, i) => sum + (s.userAnswers[i] !== ans ? 1 : 0), 0);
          }
          
          // Robust session score fallback
          let sessionScore = typeof s.score === "number" ? s.score
            : typeof s.hits === "number" ? s.hits
            : Array.isArray(s.answers) && Array.isArray(s.correctAnswers)
              ? s.answers.reduce((sum, ans, i) => sum + (ans === s.correctAnswers[i] ? 1 : 0), 0)
              : "—";

          return (
            <tr key={idx}>
              <td className="p-2">{s.date ? new Date(s.date).toLocaleString() : "—"}</td>
              <td className="p-2">{sessionScore}</td>
              <td className="p-2">{wrongCount}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
</section>
        {/* Emotion Detector Scoring Table */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2">Emotion Detector: Scoring Details</h2>
          <div className="overflow-x-auto">
            <table className="min-w-max w-full bg-white shadow rounded mb-4 text-sm">
              <thead>
                <tr className="bg-sky-100 text-gray-600">
                  <th>Date</th>
                  <th>Total Trials</th>
                  <th>Correct Trials</th>
                  <th>Accuracy (%)</th>
                  <th>Avg Response Time (s)</th>
                  <th>Risk Score</th>
                  <th>Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {sessions
                  .filter(s => s.game === "Emotion Detector" || s.game === "EmotionMatch")
                  .map((s, idx) => {
                    let stat = { totalTrials: "—", correctCount: "—", accuracyPercent: "—", avgResponseTime: "—", riskScore: "—", riskLevel: "—" };
                    if (Array.isArray(s.trials) && s.trials.length > 0) {
                      const r = computeEmotionScore(s.trials);
                      stat = r;
                    }
                    return (
                      <tr key={idx}>
                        <td className="p-2">{s.date ? new Date(s.date).toLocaleString() : "—"}</td>
                        <td className="p-2">{stat.totalTrials}</td>
                        <td className="p-2">{stat.correctCount}</td>
                        <td className="p-2">{stat.accuracyPercent !== "—" ? stat.accuracyPercent.toFixed(1) : "—"}</td>
                        <td className="p-2">{stat.avgResponseTime !== null && stat.avgResponseTime !== undefined ? stat.avgResponseTime.toFixed(2) : "—"}</td>
                        <td className="p-2">{stat.riskScore !== "—" ? stat.riskScore.toFixed(2) : "—"}</td>
                        <td className="p-2">{stat.riskLevel || "—"}</td>
                      </tr>
                    )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Letter Sound Scoring Table */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2">Letter Sound: Session Statistics</h2>
          <div className="overflow-x-auto">
            <table className="min-w-max w-full bg-white shadow rounded mb-4 text-sm">
              <thead>
                <tr className="bg-teal-100 text-gray-600">
                  <th>Date</th>
                  <th>Total Trials</th>
                  <th>Correct</th>
                  <th>Accuracy</th>
                  <th>Avg Time (s)</th>
                  <th>Score</th>
                  <th>Dyslexia Risk?</th>
                </tr>
              </thead>
              <tbody>
                {sessions
                  .filter(s => s.game === "Letter Sound")
                  .map((s, idx) => {
                    let stat = { totalTrials: "—", totalCorrect: "—", accuracy: "—", avgTime: "—", score: "—", flagDyslexia: "—" };
                    let singleSessionArr = [s];
                    const r = computeLetterSoundStats(singleSessionArr);
                    if (r) stat = r;
                    return (
                      <tr key={idx}>
                        <td className="p-2">{s.date ? new Date(s.date).toLocaleString() : "—"}</td>
                        <td className="p-2">{stat.totalTrials}</td>
                        <td className="p-2">{stat.totalCorrect}</td>
                        <td className="p-2">{stat.accuracy !== "—" ? (stat.accuracy * 100).toFixed(1) + "%" : "—"}</td>
                        <td className="p-2">{stat.avgTime !== "—" ? stat.avgTime.toFixed(2) : "—"}</td>
                        <td className="p-2">{stat.score !== "—" ? stat.score.toFixed(2) : "—"}</td>
                        <td className="p-2">{stat.flagDyslexia ? "⚠️" : "—"}</td>
                      </tr>
                )})}
              </tbody>
            </table>
          </div>
        </section>

        {/* Symbol Spotter Session Metrics Table */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2">Symbol Spotter: ADHD Metrics</h2>
          <div className="overflow-x-auto">
            <table className="min-w-max w-full bg-white shadow rounded mb-4 text-sm">
              <thead>
                <tr className="bg-amber-100 text-gray-600">
                  <th>Date</th>
                  <th>Omission</th>
                  <th>Commission</th>
                  <th>Mean RT (s)</th>
                  <th>RT SD (s)</th>
                  <th>Z-Omission</th>
                  <th>Z-Commission</th>
                  <th>Z-RT SD</th>
                  <th>Composite Score</th>
                  <th>Flags</th>
                  <th>ADHD Risk?</th>
                </tr>
              </thead>
              <tbody>
                {sessions
                  .filter(s => s.game === "Symbol Spotter")
                  .map((s, idx) => {
                    let stat = {
                      omission: "—", commission: "—", meanRT: "—", sdRT: "—", zOmission: "—", zCommission: "—", zSdRT: "—",
                      compositeScore: "—", flags: "—", isAtRisk: "—"
                    };
                    if (profile && !isNaN(Number(profile.age))) {
                      const r = computeSymbolSpotterAdhdMetrics([s], Number(profile.age));
                      if (r) stat = r;
                    }
                    return (
                      <tr key={idx}>
                        <td className="p-2">{s.date ? new Date(s.date).toLocaleString() : "—"}</td>
                        <td className="p-2">{stat.omission !== "—" ? (stat.omission * 100).toFixed(1) + "%" : "—"}</td>
                        <td className="p-2">{stat.commission !== "—" ? (stat.commission * 100).toFixed(1) + "%" : "—"}</td>
                        <td className="p-2">{stat.meanRT !== "—" ? stat.meanRT.toFixed(2) : "—"}</td>
                        <td className="p-2">{stat.sdRT !== "—" ? stat.sdRT.toFixed(2) : "—"}</td>
                        <td className="p-2">{stat.zOmission !== "—" ? stat.zOmission.toFixed(2) : "—"}</td>
                        <td className="p-2">{stat.zCommission !== "—" ? stat.zCommission.toFixed(2) : "—"}</td>
                        <td className="p-2">{stat.zSdRT !== "—" ? stat.zSdRT.toFixed(2) : "—"}</td>
                        <td className="p-2">{stat.compositeScore !== "—" ? stat.compositeScore.toFixed(2) : "—"}</td>
                        <td className="p-2">{stat.flags}</td>
                        <td className="p-2">{stat.isAtRisk !== "—" ? (stat.isAtRisk ? "⚠️ Yes" : "No") : "—"}</td>
                      </tr>
                )})}
              </tbody>
            </table>
          </div>
        </section>

        {/* Emotion Adventure Session Metrics Table */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2">Emotion Adventure: Anxiety Scores</h2>
          <div className="overflow-x-auto">
            <table className="min-w-max w-full bg-white shadow rounded mb-4 text-sm text-center">
              <thead>
                <tr className="bg-purple-100 text-gray-600">
                  <th className="p-2">Date</th>
                  <th className="p-2">Anxiety Score</th>
                  <th className="p-2">Feedback</th>
                  <th className="p-2">Average RT (s)</th>
                </tr>
              </thead>
              <tbody>
                {sessions
                  .filter(s => s.game === "Emotion Adventure")
                  .map((s, idx) => {
                    // Always extract from session.choices for current data structure
                    const scores = Array.isArray(s.choices) ? s.choices.map(c => c.score ?? 0) : Array.isArray(s.scores) ? s.scores : [0];
                    const rts = Array.isArray(s.choices) ? s.choices.map(c => c.rt ?? 0) : Array.isArray(s.rts) ? s.rts : [0];
                    const stat = computeAnxietyScore(scores, rts) || { anxietyScore: "—", feedback: "—", avgRT: "—" };
                    return (
                      <tr key={idx}>
                        <td className="p-2">{s.date ? new Date(s.date).toLocaleString() : "—"}</td>
                        <td className="p-2">{typeof stat.anxietyScore === "number" ? stat.anxietyScore.toFixed(2) : stat.anxietyScore}</td>
                        <td className="p-2">{stat.feedback || "—"}</td>
                        <td className="p-2">{typeof stat.avgRT === "number" ? stat.avgRT.toFixed(2) : stat.avgRT}</td>
                      </tr>
                )})}
              </tbody>
            </table>
          </div>
        </section>

        {/* New: Overall Game Metrics Table */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Overall Game Metrics Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-2 rounded bg-white shadow text-sm text-center">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  {GAME_DEFS.map(({ key, display }) => (
                    <th key={key} colSpan={
                      key === "color" ? 2 :
                      key === "emotion" ? 2 :
                      key === "letterSound" ? 4 :
                      key === "symbol" ? 7 :
                      key === "emotionAdventure" ? 3 : 1
                    } className="p-2">{display}</th>
                  ))}
                </tr>
                <tr className="bg-gray-50 text-gray-600 text-xs font-semibold">
                  {/* Color Spotter */}
                  <th>Sessions</th><th>Status</th>
                  {/* Emotion Detector */}
                  <th>Total Trials</th><th>Risk Level</th>
                  {/* Letter Sound */}
                  <th>Trials</th><th>Accuracy</th><th>Avg Time</th><th>Dyslexia</th>
                  {/* Symbol Spotter */}
                  <th>Omission</th><th>Commission</th><th>Mean RT</th><th>RT SD</th><th>Z Omission</th><th>Z Commission</th><th>Risk</th>
                  {/* Emotion Adventure */}
                  <th>Anxiety Score</th><th>Feedback</th><th>Avg RT</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {GAME_DEFS.map(({ key }) => renderGameMetrics(key))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ADHD, LetterSound, Emotion summaries remain as in previous code */}
        {adhdMetrics && (
          <section className="max-w-screen-md mx-auto bg-yellow-50 p-6 rounded-2xl shadow my-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-yellow-800">ADHD Screening Summary</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 text-yellow-900 text-base mb-3">
              <div>Omission Rate: <b>{(adhdMetrics.omission * 100).toFixed(1)}%</b></div>
              <div>Commission Rate: <b>{(adhdMetrics.commission * 100).toFixed(1)}%</b></div>
              <div>Mean RT: <b>{(adhdMetrics.meanRT * 1000).toFixed(0)} ms</b></div>
              <div>RT SD: <b>{(adhdMetrics.sdRT * 1000).toFixed(0)} ms</b></div>
            </div>
            <div className="mb-2">
              <span className="block font-medium">Z-Scores:</span>
              <ul className="list-disc list-inside">
                <li>Omission: {adhdMetrics.zOmission.toFixed(2)}</li>
                <li>Commission: {adhdMetrics.zCommission.toFixed(2)}</li>
                <li>RT SD: {adhdMetrics.zSdRT.toFixed(2)}</li>
              </ul>
            </div>
            <div className="text-base">
              Composite Score: <b>{adhdMetrics.compositeScore.toFixed(2)}</b> <br />
              Flags: {adhdMetrics.flags}/3 — <span className="font-semibold">{adhdMetrics.isAtRisk ? "Elevated ADHD risk (consult specialist)" : "No elevated risk detected"}</span>
            </div>
          </section>
        )}

        {letterSoundStats && (
          <section className="max-w-screen-md mx-auto bg-teal-50 p-6 rounded-2xl shadow mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-teal-800">Letter Sound Game Summary</h2>
            <p>Trials completed: <b>{letterSoundStats.totalTrials}</b></p>
            <p>Correct Trials: <b>{letterSoundStats.totalCorrect}</b></p>
            <p>Accuracy: <b>{(letterSoundStats.accuracy * 100).toFixed(1)}%</b></p>
            <p>Average Reaction Time: <b>{letterSoundStats.avgTime.toFixed(2)} s</b></p>
          </section>
        )}

        {emotionMetrics && (
          <section className="max-w-screen-md mx-auto bg-sky-50 p-6 rounded-2xl shadow mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-sky-800">Emotion Detector Summary</h2>
            <p>Trials completed: <b>{emotionMetrics.totalTrials}</b></p>
            <p>Correct Trials: <b>{emotionMetrics.correctCount}</b></p>
            <p>Accuracy: <b>{emotionMetrics.accuracyPercent.toFixed(1)}%</b></p>
            <p>Average Response Time: <b>{emotionMetrics.avgResponseTime ? emotionMetrics.avgResponseTime.toFixed(2) : '—'} s</b></p>
            <p>Risk Level: <b>{emotionMetrics.riskLevel}</b></p>
          </section>
        )}

        {anxietyMetrics && (
          <section className="max-w-screen-md mx-auto bg-purple-50 p-6 rounded-2xl shadow mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-purple-800">Emotion Adventure (Anxiety) Summary</h2>
            <p>Anxiety Score: <b>{anxietyMetrics.anxietyScore.toFixed(2)}</b></p>
            <p>Feedback: <b>{anxietyMetrics.feedback}</b></p>
            <p>Average Reaction Time: <b>{anxietyMetrics.avgRT.toFixed(2)} s</b></p>
          </section>
        )}

        {/* AI Summary Placeholder */}
        <section className="max-w-screen-lg mx-auto bg-indigo-50 p-6 rounded shadow my-12 text-left">
  <h2 className="text-xl font-bold text-indigo-900 mb-4">AI Summary</h2>
  <pre className="whitespace-pre-wrap select-text font-mono text-base text-indigo-900 min-h-[8rem]">
    {geminiLoading && "Loading..."}
    {geminiErr && `Error: ${geminiErr}`}
    {(!geminiLoading && !geminiErr && geminiText) ? geminiText : null}
  </pre>
</section>

      </div>
    </div>
  );
}
