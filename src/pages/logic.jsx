// logic.jsx
// Centralized game-specific logic functions

// Level 1: Color Spotter (Ishihara) color blindness detection
export function isColorBlind(userAnswers, correctAnswers) {
  let wrongCount = 0;
  for (let i = 0; i < correctAnswers.length; i++) {
    if (userAnswers[i] !== correctAnswers[i]) {
      wrongCount++;
    }
  }
  // Threshold: 2+ wrong answers (~25%) flags color-blindness
  return wrongCount >= 2;
}

// Level 2: Emotion Detector scoring
export function computeEmotionScore(trials) {
  const totalTrials = trials.length;
  const correctCount = trials.reduce((sum, t) => sum + (t.is_correct ? 1 : 0), 0);
  const accuracyPercent = totalTrials ? (correctCount / totalTrials) * 100 : 0;

  const correctRts = trials.filter(t => t.is_correct).map(t => t.response_time).filter(rt => rt != null);
  const avgResponseTime = correctRts.length ? (correctRts.reduce((a, b) => a + b, 0) / correctRts.length) : null;

  // Reference values based on expected norms
  const EXPECTED_RT = 1.5;  // seconds (average expected mimicking time)
  const MAX_SCORE = totalTrials;

  const A = 1.0; // weight for inaccuracy
  const B = 2.0; // weight for slowness

  const inaccuracy = MAX_SCORE - correctCount;
  const delay = avgResponseTime !== null ? Math.max(0, avgResponseTime - EXPECTED_RT) : 0;

  const riskScore = A * inaccuracy + B * delay;
  let riskLevel = "Low risk. Mimicry behavior is within expected range.";
  if (riskScore > 3) riskLevel = "High risk. Recommend further clinical evaluation for ASD.";
  else if (riskScore > 1) riskLevel = "Moderate concern. Consider observing other social behaviors.";

  return {
    totalTrials,
    correctCount,
    accuracyPercent,
    avgResponseTime,
    riskScore,
    riskLevel,
  };
}

// Level 3: Letter Sound scoring and dyslexia flag
export function computeLetterSoundStats(sessions) {
  if (!Array.isArray(sessions) || sessions.length === 0) return null;
  let totalTrials = 0;
  let totalCorrect = 0;
  let totalTime = 0;

  sessions.forEach((s) => {
    totalTrials += s.total || s.trials?.length || 0;
    totalCorrect += s.score || 0;
    totalTime += s.total_time || (s.trials ? s.trials.reduce((a, t) => a + (t.response_time || 0), 0) : 0);
  });

  const accuracy = totalTrials ? totalCorrect / totalTrials : 0;
  const avgTime = totalTrials ? totalTime / totalTrials : 0;

  const score = accuracy - 0.5 * avgTime; // as per your formula
  const flagDyslexia = score < 0.1;

  return { totalTrials, totalCorrect, accuracy, avgTime, score, flagDyslexia };
}

// Level 4: Symbol Spotter ADHD metrics computation (Z-scores)
export function computeSymbolSpotterAdhdMetrics(sessions, age) {
  if (!age) return null;

  let hits = 0, misses = 0, falseAlarms = 0, totalTargets = 0, rtSamples = [];

  sessions.forEach((s) => {
    hits += s.hits ?? 0;
    misses += s.misses ?? 0;
    falseAlarms += s.falseAlarms ?? 0;
    totalTargets += s.totalTargets ?? 0;
    if (Array.isArray(s.trials)) {
      s.trials.forEach((t) => {
        if (typeof t.response_time === "number" && t.response_time > 0) {
          rtSamples.push(t.response_time);
        }
      });
    }
  });

  const omission = totalTargets ? misses / totalTargets : 0;
  const commission = hits + falseAlarms > 0 ? falseAlarms / (hits + falseAlarms) : 0;
  const meanRT = rtSamples.length ? rtSamples.reduce((a, b) => a + b, 0) / rtSamples.length : 0;
  const sdRT = rtSamples.length > 1 ? Math.sqrt(rtSamples.reduce((acc, rv) => acc + (rv - meanRT) ** 2, 0) / (rtSamples.length - 1)) : 0;

  const norms = getAgeNorms(age);
  if (!norms) return null;

  const zOmission = calcZ(omission, ...norms.omission);
  const zCommission = calcZ(commission, ...norms.commission);
  const zSdRT = calcZ(sdRT, ...norms.rt_sd);
  const compositeScore = zOmission + zCommission + zSdRT;
  const flags = [zOmission, zCommission, zSdRT].filter(z => z > 1.5).length;

  return { omission, commission, meanRT, sdRT, zOmission, zCommission, zSdRT, compositeScore, flags, isAtRisk: flags >= 2 };
}

// Aux helpers for ADHD norms
export function getAgeNorms(age) {
  if (age >= 3 && age <= 5) {
    return {
      omission: [0.12, 0.05],
      commission: [0.07, 0.03],
      mean_rt: [650, 100],
      rt_sd: [180, 40],
    };
  }
  else if (age >= 6 && age <= 9) {
    return {
      omission: [0.08, 0.04],
      commission: [0.05, 0.02],
      mean_rt: [550, 80],
      rt_sd: [150, 30],
    };
  }
  return null;
}

export function calcZ(x, mean, std) {
  return (x - mean) / std;
}

// Level 5: Emotion Adventure / Anxiety scoring
export function computeAnxietyScore(scores, rts) {
  // Defensive default values for empty or invalid input
  const safeScores = Array.isArray(scores) && scores.length > 0 ? scores : [0];
  const safeRTs = Array.isArray(rts) && rts.length > 0 ? rts : [0];

  const C = safeScores.reduce((a, b) => a + b, 0);           // total choice scores
  const choiceIndex = C / (2 * safeScores.length);            // normalized 0..1

  const avgRT = safeRTs.length ? (safeRTs.reduce((a, b) => a + b, 0) / safeRTs.length) : 0;
  const RTmax = 5.0;                                          // cap “slow” at 5 s
  const rtIndex = Math.min(avgRT, RTmax) / RTmax;             // normalized 0..1

  const alpha = 0.7; // weight on choice vs RT
  const anxietyScore = alpha * choiceIndex + (1 - alpha) * rtIndex;

  let feedback = 'Confident';
  if      (anxietyScore > 0.6)  feedback = 'High anxiety';
  else if (anxietyScore > 0.25) feedback = 'Mildly anxious';
  else                          feedback = 'Confident';

  return { anxietyScore, feedback, avgRT };
}
