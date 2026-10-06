/**
 * Renderer-free motion state for Bekal. This module deliberately ships no authored
 * character clips. An adapter maps normalized channels to ABSOLUTE rest-pose
 * transforms (rest + channel * amplitude), never adds onto last frame's pose.
 *
 * All durations are active seconds; tick() takes RAF-style milliseconds. Call
 * setEnvironment() when visibility, intersection or reduced-motion changes, even
 * if RAF is stopped. A suspended clock never catches up on resume.
 */
export const BEKAL_MOTION_CHANNELS = [
  "gazeX", "gazeY", "bodyLeanX", "bodyLeanZ", "bodyTurn", "bodyLift", "squash",
  "leftArmX", "leftArmZ", "rightArmX", "rightArmZ", "leftStepY", "leftStepZ",
  "rightStepY", "rightStepZ", "expression", "blink",
] as const;
export type BekalMotionChannel = typeof BEKAL_MOTION_CHANNELS[number];
/** Signed channels are [-1, 1]; expression and blink are [0, 1]. Zero is rest. */
export type BekalMotionPose = Record<BekalMotionChannel, number>;
export type BekalMotionPhase = "idle" | "attention" | "gesture" | "settle";
export type BekalMotionIntent = {
  kind: string;
  target?: { x: number; y: number };
  strength?: number;
};
export type BekalMotionValue = number | { target: "x" | "y"; scale?: number };
export type BekalMotionKeyframe = {
  /** Normalized phase position in (0, 1]. Zero is supplied by the controller. */
  at: number;
  /** A complete pose relative to rest: omitted channels mean zero. */
  pose: Partial<Record<BekalMotionChannel, BekalMotionValue>>;
};
export type BekalMotionTrack = {
  /** Clamped to [0.001, 60]. These are authoring values, not frame counts. */
  duration: number;
  keyframes?: readonly BekalMotionKeyframe[];
};
export type BekalMotionClip = {
  attention: BekalMotionTrack;
  gesture: BekalMotionTrack;
  settle: BekalMotionTrack;
};
export type BekalMotionEnvironment = {
  paused: boolean;
  hidden: boolean;
  reducedMotion: boolean;
};
export type BekalMotionOptions = {
  clips?: Readonly<Record<string, BekalMotionClip>>;
  /** Optional loop. Its first and final poses are neutral to prevent a seam. */
  idle?: BekalMotionTrack;
  cooldownSeconds?: number;
  /** Long foreground stalls advance by at most this amount; default 0.05s. */
  maxFrameSeconds?: number;
  environment?: Partial<BekalMotionEnvironment>;
};
export type BekalMotionSample = {
  time: number;
  phase: BekalMotionPhase;
  phaseProgress: number;
  /** Whole attention/gesture/settle cycle progress; zero when idle. */
  actionProgress: number;
  /** Smooth attention-in / settle-out layer weight. */
  blend: number;
  pose: BekalMotionPose;
  intent: BekalMotionIntent | null;
  pendingKind: string | null;
  cooldownRemaining: number;
  suspended: boolean;
};
export type BekalMotionDispatch = "started" | "queued" | "coalesced" | "ignored";
export type BekalMotionController = {
  tick: (nowMilliseconds: number) => BekalMotionSample;
  sample: () => BekalMotionSample;
  dispatch: (intent: BekalMotionIntent) => BekalMotionDispatch;
  setEnvironment: (environment: Partial<BekalMotionEnvironment>) => void;
  /** Reset clock, queue and pose; preserve the current environment flags. */
  reset: () => void;
  dispose: () => void;
};

type Intent = { kind: string; target: { x: number; y: number }; strength: number };
type Value = { constant: number; x: number; y: number };
type TemplateFrame = { at: number; pose: Record<BekalMotionChannel, Value> };
type Track = { duration: number; frames: TemplateFrame[] };
type Clip = { attention: Track; gesture: Track; settle: Track; duration: number };
type Frame = { at: number; pose: BekalMotionPose };
type ResolvedTrack = { duration: number; frames: Frame[] };
type Active = {
  intent: Intent;
  start: number;
  duration: number;
  attention: ResolvedTrack;
  gesture: ResolvedTrack;
  settle: ResolvedTrack;
};

const MAX_CLOCK = 1e9;
const PHASES = ["attention", "gesture", "settle"] as const;
const restIntent: Intent = { kind: "", target: { x: 0, y: 0 }, strength: 1 };
const finite = (value: number, fallback = 0) => Number.isFinite(value) ? value : fallback;
const clamp = (value: number, low: number, high: number, fallback = 0) =>
  Math.max(low, Math.min(high, finite(value, fallback)));
const channelValue = (key: BekalMotionChannel, value: number) =>
  clamp(value, key === "expression" || key === "blink" ? 0 : -1, 1);
const restPose = (): BekalMotionPose => Object.fromEntries(
  BEKAL_MOTION_CHANNELS.map((key) => [key, 0]),
) as BekalMotionPose;

/** C1-continuous ease with exact endpoints and safe non-finite input handling. */
export function bekalMotionEase(progress: number): number {
  const t = clamp(progress, 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * A pure timing window for staggered secondary movement on ONE shared action
 * clock. E.g. window(actionProgress, 0.2 + person * 0.04, 0.5 + person * 0.04).
 * Apply the shared bodyLift channel once to a carried object; do not stagger it.
 * The return value holds at one after the window; author a second window for a
 * recovery envelope: window(t, a, b) * (1 - window(t, c, d)).
 * A collapsed or reversed window is disabled (zero), never a sudden step.
 */
export function bekalMotionWindow(progress: number, start: number, end: number): number {
  const from = clamp(start, 0, 1);
  const to = clamp(end, 0, 1);
  const t = clamp(progress, 0, 1);
  if (to <= from) return 0;
  return bekalMotionEase((t - from) / (to - from));
}

function compileTrack(track: BekalMotionTrack): Track {
  // Bound authoring work and copy every value; later caller mutation has no effect.
  const byPosition = new Map<number, TemplateFrame>();
  for (const frame of (track.keyframes ?? []).slice(0, 128)) {
    if (!Number.isFinite(frame.at) || frame.at <= 0 || frame.at > 1) continue;
    const pose = {} as TemplateFrame["pose"];
    for (const key of BEKAL_MOTION_CHANNELS) {
      const value = frame.pose[key];
      pose[key] = typeof value === "number"
        ? { constant: channelValue(key, value), x: 0, y: 0 }
        : {
          constant: 0,
          x: value?.target === "x" ? clamp(value.scale ?? 1, -1, 1) : 0,
          y: value?.target === "y" ? clamp(value.scale ?? 1, -1, 1) : 0,
        };
    }
    byPosition.set(frame.at, { at: frame.at, pose });
  }
  return {
    duration: clamp(track.duration, 0.001, 60, 0.001),
    frames: [...byPosition.values()].sort((a, b) => a.at - b.at),
  };
}

function resolveTrack(track: Track, start: BekalMotionPose, intent: Intent, returnToRest = false): ResolvedTrack {
  const frames: Frame[] = [{ at: 0, pose: { ...start } }];
  for (const frame of track.frames) {
    const pose = restPose();
    for (const key of BEKAL_MOTION_CHANNELS) {
      const value = frame.pose[key];
      pose[key] = channelValue(key, value.constant + intent.target.x * value.x + intent.target.y * value.y);
    }
    frames.push({ at: frame.at, pose });
  }
  // Phase starts inherit the preceding endpoint. Settle and idle close at rest.
  if (returnToRest && frames.at(-1)!.at === 1) frames.pop();
  if (frames.at(-1)!.at !== 1) frames.push({
    at: 1, pose: returnToRest ? restPose() : { ...frames.at(-1)!.pose },
  });
  return { duration: track.duration, frames };
}

function sampleTrack(track: ResolvedTrack, progress: number): BekalMotionPose {
  const t = clamp(progress, 0, 1);
  let left = track.frames[0];
  for (let index = 1; index < track.frames.length; index++) {
    const right = track.frames[index];
    if (t <= right.at) {
      const mix = bekalMotionEase((t - left.at) / (right.at - left.at));
      const pose = restPose();
      for (const key of BEKAL_MOTION_CHANNELS) pose[key] = left.pose[key] + (right.pose[key] - left.pose[key]) * mix;
      return pose;
    }
    left = right;
  }
  return { ...left.pose };
}

/**
 * A deterministic one-shot scheduler. Same-kind input never restarts the active
 * clip. Other kinds share ONE latest-wins pending slot; repeats replace its
 * target/strength without adding replays. Cooldown starts at the clip's end.
 * Paused/hidden input is ignored. Reduced motion cancels active/queued gestures,
 * outputs rest, and freezes the clock; turning it off cannot replay old input.
 */
export function createBekalMotionController(options: BekalMotionOptions = {}): BekalMotionController {
  const clips = new Map<string, Clip>();
  for (const [kind, input] of Object.entries(options.clips ?? {})) {
    const attention = compileTrack(input.attention);
    const gesture = compileTrack(input.gesture);
    const settle = compileTrack(input.settle);
    clips.set(kind, { attention, gesture, settle, duration: attention.duration + gesture.duration + settle.duration });
  }
  const idle = options.idle ? resolveTrack(compileTrack(options.idle), restPose(), restIntent, true) : null;
  const cooldown = clamp(options.cooldownSeconds ?? 0.3, 0, 60);
  const maxFrame = clamp(options.maxFrameSeconds ?? 0.05, 0.001, 1, 0.05);
  const environment: BekalMotionEnvironment = {
    paused: options.environment?.paused ?? false,
    hidden: options.environment?.hidden ?? false,
    reducedMotion: options.environment?.reducedMotion ?? false,
  };
  let clock = 0;
  let previous: number | null = null;
  let active: Active | null = null;
  let pending: { intent: Intent; queuedAt: number } | null = null;
  let cooldownUntil = 0;
  let disposed = false;
  const suspended = () => disposed || environment.paused || environment.hidden || environment.reducedMotion;

  function start(intent: Intent, at: number): Active {
    const clip = clips.get(intent.kind)!;
    const attention = resolveTrack(clip.attention, restPose(), intent);
    const gesture = resolveTrack(clip.gesture, attention.frames.at(-1)!.pose, intent);
    const settle = resolveTrack(clip.settle, gesture.frames.at(-1)!.pose, intent, true);
    return { intent, start: at, duration: clip.duration, attention, gesture, settle };
  }

  function completeAndDrain() {
    if (active && clock >= active.start + active.duration) {
      cooldownUntil = Math.min(MAX_CLOCK, active.start + active.duration + cooldown);
      active = null;
    }
    if (!active && pending && clock >= cooldownUntil) {
      const queued = pending;
      pending = null;
      active = start(queued.intent, Math.max(cooldownUntil, queued.queuedAt));
      // One bounded drain is enough: there is never more than one pending clip.
      if (active && clock >= active.start + active.duration) {
        cooldownUntil = Math.min(MAX_CLOCK, active.start + active.duration + cooldown);
        active = null;
      }
    }
  }

  function sample(): BekalMotionSample {
    const idleProgress = idle ? (clock % idle.duration) / idle.duration : 0;
    const idlePose = idle ? sampleTrack(idle, idleProgress) : restPose();
    let phase: BekalMotionPhase = "idle";
    let phaseProgress = idleProgress;
    let blend = 0;
    let pose = idlePose;
    if (active && !environment.reducedMotion && !disposed) {
      let elapsed = Math.max(0, clock - active.start);
      for (const name of PHASES) {
        const track = active[name];
        if (elapsed < track.duration || name === "settle") {
          phase = name;
          phaseProgress = clamp(elapsed / track.duration, 0, 1);
          blend = name === "attention" ? bekalMotionEase(phaseProgress)
            : name === "settle" ? 1 - bekalMotionEase(phaseProgress) : 1;
          const authored = sampleTrack(track, phaseProgress);
          pose = restPose();
          for (const key of BEKAL_MOTION_CHANNELS) {
            pose[key] = channelValue(key, idlePose[key] * (1 - blend) + authored[key] * active.intent.strength * blend);
          }
          break;
        }
        elapsed -= track.duration;
      }
    }
    if (environment.reducedMotion || disposed) pose = restPose();
    return {
      time: clock, phase, phaseProgress,
      actionProgress: active ? clamp((clock - active.start) / active.duration, 0, 1) : 0,
      blend, pose,
      intent: active ? { ...active.intent, target: { ...active.intent.target } } : null,
      pendingKind: pending?.intent.kind ?? null,
      cooldownRemaining: Math.max(0, cooldownUntil - clock),
      suspended: suspended(),
    };
  }

  const controller: BekalMotionController = {
    tick(nowMilliseconds) {
      if (suspended()) { previous = null; return sample(); }
      if (!Number.isFinite(nowMilliseconds)) return sample();
      if (previous !== null) {
        // Rebase backward clocks without reversing state; clamp forward stalls.
        const delta = Math.min(maxFrame, Math.max(0, (nowMilliseconds - previous) / 1000));
        clock = Math.min(MAX_CLOCK, clock + delta);
      }
      previous = nowMilliseconds;
      completeAndDrain();
      return sample();
    },
    sample,
    dispatch(input) {
      if (suspended() || !clips.has(input.kind)) return "ignored";
      const intent: Intent = {
        kind: input.kind,
        target: { x: clamp(input.target?.x ?? 0, -1, 1), y: clamp(input.target?.y ?? 0, -1, 1) },
        strength: clamp(input.strength ?? 1, 0, 1),
      };
      if (active?.intent.kind === intent.kind) return "coalesced";
      if (active || clock < cooldownUntil) {
        const result = pending?.intent.kind === intent.kind ? "coalesced" : "queued";
        pending = { intent, queuedAt: pending?.queuedAt ?? clock };
        return result;
      }
      active = start(intent, clock);
      return "started";
    },
    setEnvironment(update) {
      if (disposed) return;
      const wasSuspended = suspended();
      for (const key of ["paused", "hidden", "reducedMotion"] as const) {
        if (typeof update[key] === "boolean") environment[key] = update[key];
      }
      if (wasSuspended !== suspended()) previous = null;
      if (environment.reducedMotion) { active = null; pending = null; cooldownUntil = clock; }
    },
    reset() {
      if (disposed) return;
      clock = 0; previous = null; active = null; pending = null; cooldownUntil = 0;
    },
    dispose() {
      disposed = true; previous = null; active = null; pending = null; cooldownUntil = clock;
    },
  };
  return controller;
}
