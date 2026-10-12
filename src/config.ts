/** Balance knobs. All times are active-play seconds; visuals never affect hit tests. */
export const CONFIG = {
  width: 420, height: 640, riverY: 447, duration: 30, finishDuration: 1.4,
  bucketRadius: 28, hitPadding: 10, baseScore: 100, maxMultiplier: 3,
  maxCreatures: 78, maxParticles: 140,
  phases: [
    { from: 0, interval: 1.15, travel: 4.2 },
    { from: 5, interval: 0.82, travel: 3.5 },
    { from: 10, interval: 0.62, travel: 3.1 },
    { from: 17, interval: 0.44, travel: 2.8 },
    { from: 24, interval: 0.32, travel: 2.35 },
  ],
  events: { first: 7, interval: 6, chance: 0.85, duration: 2.5, uncleAt: 17, feverAt: 24 },
  generationTimes: [10, 17, 24],
} as const;
export const STAGES = ['平和なオウオ川', 'オウオざわざわ', 'オウオ大集合', 'オウオ大混乱', 'サンショウオウオカーニバル！！'];
export type EventKind = 'tour' | 'giant' | 'researcher' | 'uncle' | 'fever';
export const EVENT_LABELS: Record<EventKind, string> = {
  tour: 'オウオの団体旅行', giant: '巨大オウオ降臨！', researcher: '研究員「待て待て待て！！」',
  uncle: 'バケツおじさん襲来！', fever: 'オウオ・フィーバー！！',
};
