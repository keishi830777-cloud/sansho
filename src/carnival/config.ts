/** Active play seconds. One-second late targets keep the finale interactive. */
export const CONFIG = {
  width: 420, height: 640, riverY: 442, duration: 30, finishDuration: 1.45,
  bucketRadius: 28, hitPadding: 11, baseScore: 100, maxMultiplier: 3,
  maxCreatures: 115, maxParticles: 150,
  phases: [
    { from: 0, interval: 1.05, travel: 3.8 },
    { from: 5, interval: .69, travel: 3.1 },
    { from: 10, interval: .51, travel: 2.6 },
    { from: 17, interval: .37, travel: 2.3 },
    { from: 24, interval: .235, travel: 1.95 },
  ],
  lastSpawn: 29.05,
  events: { first: 7, interval: 5.5, chance: .88, duration: 2.5, uncleAt: 17, feverAt: 24 },
  generationTimes: [10, 17, 24],
} as const;
export const STAGES = ['平和なオウオ川', 'オウオざわざわ', 'オウオ大集合', 'オウオ大混乱', 'サンショウオウオカーニバル！！'];
export type EventKind = 'tour' | 'giant' | 'researcher' | 'uncle' | 'fever';
export const EVENT_LABELS: Record<EventKind, string> = { tour: 'オウオの団体旅行！', giant: '巨大オウオ降臨！', researcher: '研究員「待て待て待て！！」', uncle: 'バケツおじさん襲来！！', fever: 'オウオ・フィーバー！！' };
