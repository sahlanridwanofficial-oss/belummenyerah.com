const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers.cjs');
const {
  createBekalMotionController, BEKAL_MOTION_CHANNELS,
  bekalMotionEase, bekalMotionWindow,
} = loadSource('src/lib/bekal-motion.ts');

// Synthetic fixtures exercise the scheduler, not approved visual choreography.
function fixture() {
  return {
    attention: { duration: .25, keyframes: [
      { at: 1, pose: { gazeX: { target: 'x' }, bodyLeanX: .3, leftArmZ: -.4 } },
    ] },
    gesture: { duration: .5, keyframes: [
      { at: .5, pose: { bodyLift: .8, squash: -.4, leftStepY: .2, expression: 1 } },
      { at: 1, pose: { bodyLift: .4, bodyTurn: .2 } },
    ] },
    settle: { duration: .25 },
  };
}
function controller(extra = {}) {
  return createBekalMotionController({
    clips: { lift: fixture(), inspect: fixture(), greet: fixture() },
    maxFrameSeconds: 1, cooldownSeconds: .25, ...extra,
  });
}
function near(actual, expected, tolerance = 1e-10) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≉ ${expected}`);
}
function bounded(sample) {
  assert.ok(Number.isFinite(sample.time));
  for (const [key, value] of Object.entries(sample.pose)) {
    assert.ok(Number.isFinite(value), key);
    assert.ok(value <= 1 && value >= (['blink', 'expression'].includes(key) ? 0 : -1), `${key}: ${value}`);
  }
  for (const key of ['phaseProgress', 'actionProgress', 'blend']) assert.ok(sample[key] >= 0 && sample[key] <= 1, key);
}
function poseDistance(a, b) {
  return Math.max(...BEKAL_MOTION_CHANNELS.map(key => Math.abs(a[key] - b[key])));
}
function at(time, options = {}) {
  const motion = controller(options);
  motion.tick(0);
  motion.dispatch({ kind: 'lift', target: { x: .8, y: -.4 } });
  // Test timelines can span more than maxFrameSeconds without a simulated stall.
  let ms = 0;
  while (ms + 500 < time * 1000) { ms += 500; motion.tick(ms); }
  return motion.tick(time * 1000);
}

test('default controller is renderer-free, neutral and can anchor at timestamp zero', () => {
  const motion = createBekalMotionController();
  assert.equal(motion.dispatch({ kind: 'unknown' }), 'ignored');
  const first = motion.tick(0);
  assert.equal(first.time, 0);
  assert.equal(first.phase, 'idle');
  assert.equal(first.actionProgress, 0);
  assert.deepEqual(Object.keys(first.pose), [...BEKAL_MOTION_CHANNELS]);
  assert.ok(Object.values(first.pose).every(value => value === 0));
  near(motion.tick(16).time, .016);
  bounded(motion.tick(32));
});

test('authored intent follows attention, gesture, settle, then exact neutral rest', () => {
  const motion = controller();
  motion.tick(0);
  assert.equal(motion.dispatch({ kind: 'lift', target: { x: .8, y: -.4 } }), 'started');
  assert.equal(motion.sample().phase, 'attention');
  const attention = motion.tick(125);
  near(attention.phaseProgress, .5);
  near(attention.actionProgress, .125);
  near(attention.blend, .5);
  assert.ok(attention.pose.gazeX > 0);
  const gesture = motion.tick(250);
  assert.equal(gesture.phase, 'gesture');
  near(gesture.pose.gazeX, .8);
  near(motion.tick(500).pose.bodyLift, .8);
  const settle = motion.tick(750);
  assert.equal(settle.phase, 'settle');
  near(settle.phaseProgress, 0);
  near(settle.pose.bodyLift, .4);
  const rest = motion.tick(1000);
  assert.equal(rest.phase, 'idle');
  assert.equal(rest.intent, null);
  near(rest.cooldownRemaining, .25);
  assert.ok(Object.values(rest.pose).every(value => value === 0));
});

test('same-kind bursts never restart the current action or schedule a replay', () => {
  const motion = controller();
  motion.tick(0); motion.dispatch({ kind: 'lift' }); motion.tick(300);
  const before = motion.sample();
  for (let i = 0; i < 1000; i++) assert.equal(motion.dispatch({ kind: 'lift', strength: .1 }), 'coalesced');
  assert.deepEqual(motion.sample(), before);
  motion.tick(1000); motion.tick(1250);
  assert.equal(motion.sample().phase, 'idle');
  assert.equal(motion.sample().pendingKind, null);
  assert.equal(motion.dispatch({ kind: 'lift' }), 'started');
  near(motion.sample().actionProgress, 0);
});

test('distinct inputs occupy one latest-wins slot, then wait for end-based cooldown', () => {
  const motion = controller();
  motion.tick(0); motion.dispatch({ kind: 'lift' }); motion.tick(100);
  assert.equal(motion.dispatch({ kind: 'inspect' }), 'queued');
  assert.equal(motion.dispatch({ kind: 'greet', target: { x: -.2, y: 0 } }), 'queued');
  for (let i = 0; i < 100; i++) assert.equal(motion.dispatch({ kind: 'greet', target: { x: .9, y: .2 } }), 'coalesced');
  // A repeat of the active intent must not erase the pending distinct gesture.
  assert.equal(motion.dispatch({ kind: 'lift' }), 'coalesced');
  assert.equal(motion.tick(1000).pendingKind, 'greet');
  assert.equal(motion.tick(1249).phase, 'idle');
  const next = motion.tick(1250);
  assert.equal(next.intent.kind, 'greet');
  near(next.intent.target.x, .9);
  near(next.actionProgress, 0);
  assert.equal(next.pendingKind, null);
  motion.tick(2250); motion.tick(3250);
  assert.equal(motion.sample().intent, null);
});

test('repeats during cooldown coalesce and do not extend cooldown', () => {
  const motion = controller();
  motion.tick(0); motion.dispatch({ kind: 'lift' }); motion.tick(1000);
  assert.equal(motion.dispatch({ kind: 'lift' }), 'queued');
  motion.tick(1100);
  assert.equal(motion.dispatch({ kind: 'lift' }), 'coalesced');
  near(motion.sample().cooldownRemaining, .15);
  assert.equal(motion.tick(1250).phase, 'attention');
});

test('normal sampling is independent of frame subdivision and repeated reads', () => {
  const a = controller(), b = controller();
  for (const motion of [a, b]) { motion.tick(0); motion.dispatch({ kind: 'lift' }); }
  for (let ms = 10; ms <= 500; ms += 10) a.tick(ms);
  b.tick(500);
  near(a.sample().time, b.sample().time);
  assert.ok(poseDistance(a.sample().pose, b.sample().pose) < 1e-12);
  const frozen = b.sample();
  for (let i = 0; i < 100; i++) assert.deepEqual(b.sample(), frozen);
});

test('stalls, backward timestamps, duplicates and invalid timestamps cannot catch up or corrupt state', () => {
  const motion = controller({ maxFrameSeconds: .05 });
  motion.tick(0); motion.dispatch({ kind: 'lift' });
  near(motion.tick(1e12).time, .05);
  near(motion.tick(1e12).time, .05);
  near(motion.tick(-1e12).time, .05);
  for (const time of [NaN, Infinity, -Infinity]) {
    const before = motion.sample();
    assert.deepEqual(motion.tick(time), before);
  }
  near(motion.tick(-1e12 + 16).time, .066);
  bounded(motion.tick(-Number.MAX_VALUE));
  const afterBackward = motion.sample().time;
  near(motion.tick(Number.MAX_VALUE).time, afterBackward + .05);
});

test('hidden and paused clocks preserve exact pose, reject intents and discard resume gap', () => {
  const motion = controller();
  motion.tick(0); motion.dispatch({ kind: 'lift' }); motion.tick(400);
  const before = motion.sample();
  motion.setEnvironment({ hidden: true });
  assert.equal(motion.dispatch({ kind: 'greet' }), 'ignored');
  assert.deepEqual(motion.tick(600000).pose, before.pose);
  near(motion.sample().time, before.time);
  motion.setEnvironment({ paused: true, hidden: false });
  assert.equal(motion.sample().suspended, true);
  motion.tick(700000);
  motion.setEnvironment({ paused: false });
  assert.deepEqual(motion.tick(800000).pose, before.pose);
  near(motion.tick(800016).time, before.time + .016);
  motion.setEnvironment({ paused: false }); // Idempotent update must not lose a frame.
  near(motion.tick(800032).time, before.time + .032);
});

test('pause/resume without a paused tick still resets the timestamp anchor', () => {
  const motion = controller();
  motion.tick(0); motion.tick(10);
  motion.setEnvironment({ hidden: true });
  motion.setEnvironment({ hidden: false });
  near(motion.tick(100000).time, .01);
  near(motion.tick(100010).time, .02);
});

test('reduced motion outputs rest, clears actions and queues, freezes time, and cannot replay stale input', () => {
  const motion = controller({ idle: { duration: 2, keyframes: [{ at: .5, pose: { bodyTurn: .5 } }] } });
  motion.tick(0); motion.dispatch({ kind: 'lift' }); motion.tick(400);
  motion.dispatch({ kind: 'greet' });
  motion.setEnvironment({ reducedMotion: true });
  const reduced = motion.sample();
  assert.equal(reduced.intent, null);
  assert.equal(reduced.pendingKind, null);
  assert.ok(Object.values(reduced.pose).every(value => value === 0));
  assert.equal(motion.dispatch({ kind: 'lift' }), 'ignored');
  assert.deepEqual(motion.tick(1e8), reduced);
  motion.setEnvironment({ reducedMotion: false });
  near(motion.tick(2e8).time, reduced.time);
  assert.equal(motion.sample().phase, 'idle');
  assert.equal(motion.sample().pendingKind, null);
  near(motion.tick(2e8 + 16).time, reduced.time + .016);
});

test('initial reduced and paused environments never start an action or an idle clock', () => {
  for (const environment of [{ reducedMotion: true }, { hidden: true }, { paused: true }]) {
    const motion = controller({ environment });
    assert.equal(motion.dispatch({ kind: 'lift' }), 'ignored');
    near(motion.tick(1e9).time, 0);
    near(motion.tick(2e9).time, 0);
  }
});

test('phase, keyframe and idle-loop boundaries have continuous poses and blend envelopes', () => {
  const idle = { duration: .4, keyframes: [{ at: .5, pose: { bodyTurn: -.25 } }] };
  for (const boundary of [.25, .5, .75, 1]) {
    const left = at(boundary - 1e-6, { idle });
    const right = at(boundary + 1e-6, { idle });
    assert.ok(poseDistance(left.pose, right.pose) < 1e-4, `pose discontinuity at ${boundary}`);
    assert.ok(Math.abs(left.blend - right.blend) < 1e-4, `blend discontinuity at ${boundary}`);
  }
  const before = controller({ idle }), after = controller({ idle });
  before.tick(0); after.tick(0);
  assert.ok(poseDistance(before.tick(399.999).pose, after.tick(400.001).pose) < 1e-6);
  const idleAtStart = controller({ idle });
  idleAtStart.tick(0); idleAtStart.tick(100);
  const resting = idleAtStart.sample().pose;
  idleAtStart.dispatch({ kind: 'lift' });
  assert.deepEqual(idleAtStart.sample().pose, resting, 'starting a gesture does not pop the idle pose');
});

test('eased timing windows support deterministic staggered effort on a common action clock', () => {
  near(bekalMotionEase(0), 0); near(bekalMotionEase(1), 1);
  near(bekalMotionEase(.5), .5);
  assert.ok(bekalMotionEase(1e-6) < 1e-10, 'zero endpoint velocity');
  assert.ok(1 - bekalMotionEase(1 - 1e-6) < 1e-10);
  near(bekalMotionWindow(.1, .2, .6), 0);
  near(bekalMotionWindow(.4, .2, .6), .5);
  near(bekalMotionWindow(.8, .2, .6), 1);
  near(bekalMotionWindow(.8, .6, .6), 0);
  near(bekalMotionWindow(.8, .6, .2), 0);
  const people = [0, 1, 2].map(person => bekalMotionWindow(.4, .2 + person * .04, .6 + person * .04));
  assert.ok(people[0] > people[1] && people[1] > people[2]);
  for (const bad of [NaN, Infinity, -Infinity]) {
    assert.ok(Number.isFinite(bekalMotionEase(bad)));
    assert.ok(Number.isFinite(bekalMotionWindow(bad, bad, bad)));
  }
  const lift = at(.5).pose.bodyLift;
  assert.deepEqual(people.map(() => lift), [.8, .8, .8], 'shared lift has no per-person phase shift');
});

test('bad numeric authored data and intent values remain finite and bounded', () => {
  const dirty = {
    attention: { duration: Infinity, keyframes: [
      { at: NaN, pose: { gazeX: Infinity } },
      { at: -1, pose: { bodyTurn: 100 } },
      { at: 1, pose: { gazeX: { target: 'x', scale: 100 }, bodyLift: Infinity, bodyTurn: 1e9, expression: -10 } },
    ] },
    gesture: { duration: -20, keyframes: [
      { at: 1, pose: { gazeY: { target: 'y', scale: NaN }, leftArmZ: -1e9, rightStepY: NaN } },
    ] },
    settle: { duration: NaN, keyframes: [{ at: 1, pose: { bodyLift: 1 } }] },
  };
  const motion = controller({ clips: { dirty }, maxFrameSeconds: NaN, cooldownSeconds: Infinity });
  motion.tick(0);
  motion.dispatch({ kind: 'dirty', target: { x: Infinity, y: -1e9 }, strength: NaN });
  for (let ms = 0; ms < 20; ms++) bounded(motion.tick(ms));
  assert.ok(Object.values(motion.sample().pose).every(value => value === 0));
});

test('keyframes are sorted, duplicate positions use last value and terminal settle is always rest', () => {
  const clip = fixture();
  clip.attention.keyframes = [
    { at: 1, pose: { bodyLift: .2 } },
    { at: .5, pose: { bodyLift: .3 } },
    { at: 1, pose: { bodyLift: .9 } },
    { at: 0, pose: { bodyLift: 1 } },
  ];
  clip.settle.keyframes = [{ at: 1, pose: { bodyLift: 1 } }];
  const motion = controller({ clips: { lift: clip } });
  motion.tick(0); motion.dispatch({ kind: 'lift' });
  near(motion.sample().pose.bodyLift, 0);
  near(motion.tick(250).pose.bodyLift, .9);
  near(motion.tick(1000).pose.bodyLift, 0);
});

test('configuration, intent and returned snapshot mutations do not mutate internal state', () => {
  const clip = fixture();
  const motion = controller({ clips: { lift: clip } });
  clip.attention.keyframes[0].pose.gazeX.target = 'y';
  clip.attention.duration = 30;
  const intent = { kind: 'lift', target: { x: .8, y: -.9 }, strength: 1 };
  motion.tick(0); motion.dispatch(intent);
  intent.target.x = -1; intent.strength = 0;
  const sample = motion.tick(250);
  near(sample.pose.gazeX, .8);
  sample.pose.gazeX = -100;
  sample.intent.target.x = -100;
  near(motion.sample().pose.gazeX, .8);
  near(motion.sample().intent.target.x, .8);
});

test('reset reproduces the exact trajectory without accumulated offsets', () => {
  const motion = controller();
  const run = () => {
    motion.tick(0); motion.dispatch({ kind: 'lift', target: { x: .5, y: .1 } });
    return [100, 250, 400, 750, 900, 1000].map(ms => motion.tick(ms));
  };
  const first = run();
  for (let i = 0; i < 30; i++) { motion.reset(); assert.deepEqual(run(), first); }
  motion.setEnvironment({ paused: true }); motion.reset();
  assert.equal(motion.sample().suspended, true);
  near(motion.sample().time, 0);
});

test('dispose is idempotent, neutral and leaves an inert controller', () => {
  const motion = controller();
  motion.tick(0); motion.dispatch({ kind: 'lift' }); motion.tick(500);
  motion.dispose(); motion.dispose();
  const disposed = motion.sample();
  assert.ok(Object.values(disposed.pose).every(value => value === 0));
  assert.equal(disposed.intent, null);
  assert.equal(motion.dispatch({ kind: 'lift' }), 'ignored');
  motion.setEnvironment({ paused: false, hidden: false, reducedMotion: false });
  motion.reset();
  assert.deepEqual(motion.tick(1e9), disposed);
});

test('one bounded drain handles short queued actions even when a frame crosses both ends', () => {
  const fast = { attention: { duration: .001 }, gesture: { duration: .001 }, settle: { duration: .001 } };
  const motion = controller({ clips: { a: fast, b: fast }, cooldownSeconds: .001 });
  motion.tick(0); motion.dispatch({ kind: 'a' }); motion.dispatch({ kind: 'b' });
  const end = motion.tick(1000);
  assert.equal(end.phase, 'idle');
  assert.equal(end.pendingKind, null);
  assert.equal(end.intent, null);
  near(end.cooldownRemaining, 0);
  bounded(end);
});
