import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, resultText } from '../src/game.ts';
import { CONFIG } from '../src/config.ts';

function catchNext(game: Game) {
  for (let i = 0; i < 800; i++) {
    const bucket = game.buckets.find(b => b.y > 20);
    if (bucket) { assert.equal(game.hit(bucket.x, bucket.y), true); return bucket; }
    game.advance(0.02);
  }
  throw new Error('No playable bucket spawned');
}
test('30 seconds of active time always finishes, including a no-input run', () => {
  const game = new Game(() => 0.2);
  game.advance(29.99); assert.equal(game.done, false);
  game.advance(0.01); assert.equal(game.done, true); assert.equal(game.remaining, 0);
  assert.ok(game.missed > 35); assert.equal(game.caught, 0); assert.equal(game.buckets.length, 0);
  assert.equal(game.drain().filter(s => s.kind === 'finish').length, 1);
  game.advance(10); assert.equal(game.drain().length, 0);
});
test('one bucket can only score once, including repeated pointer hits', () => {
  const game = new Game(() => 0.3), bucket = catchNext(game);
  assert.equal(game.score, 100); assert.equal(game.combo, 1);
  assert.equal(game.hit(bucket.x, bucket.y), false); assert.equal(game.score, 100);
  assert.equal(game.hit(-100, -100), false);
});
test('combo thresholds calculate score and cap at 3×', () => {
  const game = new Game(() => 0.3);
  for (let i = 0; i < 20; i++) catchNext(game);
  assert.equal(game.combo, 20); assert.equal(game.bestCombo, 20); assert.equal(game.multiplier, 3);
  assert.equal(game.score, 4 * 100 + 5 * 150 + 5 * 200 + 5 * 250 + 300); assert.equal(game.missed, 0); assert.equal(game.panic, 0);
  assert.equal(game.years, 0); assert.equal(game.stage, 0);
  assert.equal(game.drain().some(s => s.kind === 'generation'), false);
});
test('miss resets current combo but retains best combo', () => {
  const game = new Game(() => 0.3);
  catchNext(game); catchNext(game); game.advance(5);
  assert.equal(game.combo, 0); assert.equal(game.bestCombo, 2); assert.ok(game.missed > 0); assert.equal(game.multiplier, 1);
});
test('generational change needs invasion and is separated from score', () => {
  const game = new Game(() => 0.1); game.advance(10.1);
  assert.ok(game.missed > 0); assert.equal(game.years, 20); assert.ok(game.panic > 0); assert.equal(game.score, 0);
  assert.equal(game.drain().filter(s => s.kind === 'generation').length, 1);
  game.advance(20); assert.equal(game.years, 60); assert.equal(game.stage, 4); assert.ok(game.panic <= 999);
});
test('perfect run reaches 30 seconds with no invasion and a success celebration', () => {
  const game = new Game(() => 0.1); const events: string[] = [];
  while (!game.done) {
    game.advance(1 / 60);
    for (const b of [...game.buckets]) if (b.y > 20) game.hit(b.x, b.y);
    for (const signal of game.drain()) if (signal.kind === 'event') events.push(signal.event);
  }
  assert.equal(game.missed, 0); assert.equal(game.years, 0); assert.equal(game.panic, 0);
  assert.ok(game.caught > 35); assert.equal(game.bestCombo, game.caught); assert.ok(events.includes('uncle')); assert.ok(events.includes('fever'));
  assert.match(resultText(game.result, () => 0).comment, /平和/);
});
test('offscreen or post-finish hits cannot change results; bad dt is ignored', () => {
  const game = new Game(() => 0.1); game.advance(NaN); game.advance(-1); assert.equal(game.elapsed, 0);
  game.advance(0.51); const b = game.buckets[0]; assert.ok(b.y < 0); assert.equal(game.hit(b.x, b.y), false);
  game.advance(CONFIG.duration); const result = game.result; assert.equal(game.hit(b.x, b.y), false); assert.deepEqual(game.result, result);
});
test('no-input result does not award a perfect-play title', () => {
  assert.match(resultText({ score: 0, bestCombo: 0, caught: 0, missed: 40, panic: 800 }, () => 0).comment, /バケツ/);
});
