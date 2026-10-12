import test from 'node:test';
import assert from 'node:assert/strict';
import { Shot, SHOT } from '../src/shot.ts';
const charged = (p: number) => { const game = new Shot(() => .5); game.press(); game.advance(game.limit * Math.pow(p, 1 / 1.3)); return game; };
test('one hold and one release only; pressure is continuous', () => {
  const shot = charged(.65); assert.ok(Math.abs(shot.pressure - .65) < .00001); assert.equal(shot.press(), false);
  assert.equal(shot.release(), true); const velocity = shot.vy; assert.equal(shot.release(), false); assert.equal(shot.vy, velocity);
  assert.equal(shot.drain().filter(e => e.kind === 'launch').length, 1);
});
test('holding past the variable limit ruptures, ends and scores zero', () => {
  const shot = new Shot(() => .5); shot.press(); shot.advance(shot.limit + .05); assert.equal(shot.mode, 'rupture'); assert.equal(shot.release(), false);
  shot.advance(2); assert.equal(shot.mode, 'result'); assert.equal(shot.result?.score, 0); assert.equal(shot.result?.busted, true);
  assert.equal(shot.drain().filter(e => e.kind === 'rupture').length, 1);
});
test('92% or higher is a perfect shot, while a small release still ends', () => {
  const perfect = charged(.97); perfect.release(); assert.equal(perfect.perfect, true); perfect.advance(10); assert.ok(perfect.result!.height > 1500); assert.ok(perfect.result!.score > 1500);
  const early = charged(.08); early.release(); early.advance(10); assert.equal(early.mode, 'result'); assert.equal(early.result!.title, 'ぴょ。'); assert.ok(early.result!.height < 100);
});
test('steering affects the shot and side walls keep the leader on screen', () => {
  const shot = charged(.85); shot.aimAt(1000); assert.equal(shot.aim, 1); shot.release(); assert.ok(shot.vx > 0);
  for (let i = 0; i < 1000 && !shot.finished; i++) { shot.advance(.01); assert.ok(shot.x >= 30 && shot.x <= 390); }
  assert.equal(shot.mode, 'result'); assert.ok(shot.y >= SHOT.launchY || shot.flightTime >= SHOT.maxFlight);
});
test('each ring scores once even while lingering inside it', () => {
  const shot = charged(.9); shot.release(); shot.rings = [{ id: 0, x: 210, y: 500, phase: 0, hit: false }]; shot.advance(.04);
  assert.equal(shot.ringsHit, 1); shot.advance(.1); assert.equal(shot.ringsHit, 1); assert.equal(shot.drain().filter(e => e.kind === 'ring').length, 1);
});
test('result is final and repeat releases do not modify it', () => {
  const shot = charged(.8); shot.release(); shot.advance(10); const result = shot.result;
  assert.ok(Object.isFrozen(result)); assert.equal(shot.press(), false); shot.release(); shot.advance(100); assert.equal(shot.result, result);
  assert.equal(shot.drain().filter(e => e.kind === 'end').length, 1);
});
test('cancelling a touch returns to ready without firing or failing', () => {
  const shot = charged(.85); shot.aimAt(85); shot.cancel(); assert.equal(shot.mode, 'idle'); assert.equal(shot.pressure, 0); assert.equal(shot.aim, 0); assert.equal(shot.drain().length, 0);
  assert.equal(shot.press(), true); shot.advance(.5); assert.ok(shot.pressure > 0);
});
test('limit varies but has an identical visible perfect-pressure window', () => {
  const fast = new Shot(() => 0), slow = new Shot(() => .99); assert.ok(slow.limit > fast.limit);
  for (const shot of [fast, slow]) { shot.press(); shot.advance(shot.limit * Math.pow(.95, 1 / 1.3)); shot.release(); assert.equal(shot.perfect, true); }
});
