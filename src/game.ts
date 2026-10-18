import type {
  Game,
  InitApi,
  RenderApi,
  UpdateApi,
} from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import * as C from "./constants";

export const BACKGROUND = "#07111f";
export type Screen =
  "title" | "howto" | "countdown" | "playing" | "paused" | "matchover";
export type Mode = "solo" | "versus";
export type Side = "left" | "right";
export interface PaddleState {
  readonly cy: number;
  readonly vy: number;
  readonly driven: boolean;
  readonly drivenVy: number;
}
export interface AiState {
  readonly tracking: boolean;
  readonly movement: boolean;
}
export interface TrailSample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}
export interface BallState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly spin: number;
  readonly held: boolean;
  readonly holdTimer: number;
  readonly serveSign: 1 | -1;
  readonly trail: readonly TrailSample[];
}
export interface ObstacleState {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
  readonly theta: number;
}
export interface CaromState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";
  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;
  readonly paddles: { readonly left: PaddleState; readonly right: PaddleState };
  readonly ai: AiState;
  readonly receiver: Side;
  readonly ball: BallState | null;
  readonly obstacles: readonly ObstacleState[];
  readonly obstacleClock: number;
  readonly obstacleClockRunning: boolean;
  readonly simTime: number;
  readonly muted: boolean;
}
export interface CaromDebugApi {
  readonly version: number;
  clearWorld(s: DeepReadonly<CaromState>): CaromState;
  spawnBall(s: DeepReadonly<CaromState>): CaromState;
  spawnObstacle(s: DeepReadonly<CaromState>, i: number): CaromState;
  reset(s: DeepReadonly<CaromState>): CaromState;
  reconcile(s: DeepReadonly<CaromState>): CaromState;
  setScreen(s: DeepReadonly<CaromState>, v: Screen): CaromState;
  setMode(s: DeepReadonly<CaromState>, v: Mode): CaromState;
  setMenuIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setTitleIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setResumeScreen(
    s: DeepReadonly<CaromState>,
    v: "countdown" | "playing",
  ): CaromState;
  setScore(s: DeepReadonly<CaromState>, p1: number, p2: number): CaromState;
  setWinner(s: DeepReadonly<CaromState>, v: Side | null): CaromState;
  setReceiver(s: DeepReadonly<CaromState>, v: Side): CaromState;
  setPaddleCy(s: DeepReadonly<CaromState>, side: Side, v: number): CaromState;
  setPaddleVy(s: DeepReadonly<CaromState>, side: Side, v: number): CaromState;
  setPaddleDriven(
    s: DeepReadonly<CaromState>,
    side: Side,
    v: boolean,
  ): CaromState;
  setBallPosition(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallVelocity(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallSpin(s: DeepReadonly<CaromState>, v: number): CaromState;
  setBallHeld(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setBallHoldTimer(s: DeepReadonly<CaromState>, v: number): CaromState;
  setBallServeSign(s: DeepReadonly<CaromState>, v: 1 | -1): CaromState;
  drawBallServeSign(s: DeepReadonly<CaromState>): CaromState;
  setAiTracking(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setAiMovement(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setMuted(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setObstacleClock(s: DeepReadonly<CaromState>, v: number): CaromState;
  setObstacleClockRunning(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  snapshot(s: DeepReadonly<CaromState>): object;
  menuItemRect(
    s: DeepReadonly<CaromState>,
    i: number,
  ): { x: number; y: number; w: number; h: number } | null;
}
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const coin = (): 1 | -1 => (Math.random() < 0.5 ? -1 : 1);
const obstacle = (i: number, t: number): ObstacleState => {
  const p = C.OBSTACLE_CENTERS[i];
  const w =
    C.OBSTACLE_SWAY_AMP * Math.sin((2 * Math.PI * t) / C.OBSTACLE_SWAY_PERIOD);
  return {
    index: i,
    cx: p.x,
    cy: p.y + (i === 0 ? w : -w),
    theta: C.OBSTACLE_SPIN_RATE * t,
  };
};
const pstate = (): PaddleState => ({
  cy: C.FIELD_CY,
  vy: 0,
  driven: false,
  drivenVy: 0,
});
const ball = (): BallState => ({
  x: C.FIELD_CX,
  y: C.FIELD_CY,
  vx: 0,
  vy: 0,
  spin: 0,
  held: true,
  holdTimer: C.HOLD_TIME,
  serveSign: coin(),
  trail: [],
});
const initial = (muted = false): CaromState => ({
  screen: "title",
  mode: "solo",
  menuIndex: 0,
  titleIndex: 0,
  resumeScreen: "playing",
  score: { p1: 0, p2: 0 },
  winner: null,
  paddles: { left: pstate(), right: pstate() },
  ai: { tracking: true, movement: true },
  receiver: "left",
  ball: ball(),
  obstacles: [obstacle(0, 0), obstacle(1, 0)],
  obstacleClock: 0,
  obstacleClockRunning: true,
  simTime: 0,
  muted,
});
const withBall = (
  s: DeepReadonly<CaromState>,
  f: (b: BallState) => BallState,
): CaromState => {
  if (!s.ball) throw new Error("Carom: no ball");
  return { ...s, ball: f(s.ball) };
};
const withPaddle = (
  s: DeepReadonly<CaromState>,
  side: Side,
  f: (p: PaddleState) => PaddleState,
): CaromState => ({
  ...s,
  paddles: { ...s.paddles, [side]: f(s.paddles[side]) },
});
const move = (p: PaddleState, v: number, dt: number): PaddleState => {
  const cy = clamp(
    p.cy + (p.driven ? p.drivenVy : v) * dt,
    C.PADDLE_MIN_CY,
    C.PADDLE_MAX_CY,
  );
  return { ...p, cy, vy: dt > 0 ? (cy - p.cy) / dt : 0 };
};
function rect(s: DeepReadonly<CaromState>, i: number) {
  const n =
    s.screen === "title"
      ? 3
      : s.screen === "paused"
        ? 3
        : s.screen === "matchover"
          ? 2
          : s.screen === "howto"
            ? 1
            : 0;
  return i >= 0 && i < n ? { x: 390, y: 392 + i * 58, w: 500, h: 46 } : null;
}
function hitObstacle(
  b: { x: number; y: number; vx: number; vy: number },
  o: ObstacleState,
) {
  const c = Math.cos(o.theta),
    q = Math.sin(o.theta),
    dx = b.x - o.cx,
    dy = b.y - o.cy,
    lx = dx * c + dy * q,
    ly = -dx * q + dy * c,
    qx = clamp(lx, -C.OBSTACLE_HW, C.OBSTACLE_HW),
    qy = clamp(ly, -C.OBSTACLE_HH, C.OBSTACLE_HH);
  let nx = lx - qx,
    ny = ly - qy;
  const d = Math.hypot(nx, ny);
  if (d >= C.BALL_R) return false;
  if (d < 1e-6) {
    if (C.OBSTACLE_HW - Math.abs(lx) < C.OBSTACLE_HH - Math.abs(ly)) {
      nx = lx < 0 ? -1 : 1;
      ny = 0;
    } else {
      nx = 0;
      ny = ly < 0 ? -1 : 1;
    }
  } else {
    nx /= d;
    ny /= d;
  }
  const wx = nx * c - ny * q,
    wy = nx * q + ny * c,
    dot = b.vx * wx + b.vy * wy;
  if (dot < 0) {
    b.vx -= 2 * dot * wx;
    b.vy -= 2 * dot * wy;
  }
  b.x += wx * (C.BALL_R - d + 0.01);
  b.y += wy * (C.BALL_R - d + 0.01);
  return true;
}
function advanceBall(
  old: BallState,
  s: DeepReadonly<CaromState>,
  dt: number,
  api: UpdateApi,
  left: PaddleState,
  right: PaddleState,
) {
  const b = { ...old, trail: [...old.trail] as TrailSample[] };
  const n = Math.max(
    1,
    Math.ceil((Math.hypot(b.vx, b.vy) * dt) / C.MAX_SUBSTEP),
  );
  const h = dt / n;
  let point: Side | null = null;
  for (let z = 0; z < n; z++) {
    const v = Math.hypot(b.vx, b.vy);
    if (v) {
      const a = (b.spin / v) * h,
        c = Math.cos(a),
        q = Math.sin(a),
        vx = b.vx * c - b.vy * q;
      b.vy = b.vx * q + b.vy * c;
      b.vx = vx;
    }
    b.spin *= 0.5 ** (h / C.SPIN_HALFLIFE);
    b.x += b.vx * h;
    b.y += b.vy * h;
    if (b.y - C.BALL_R < 0 && b.vy < 0) {
      b.y = C.BALL_R;
      b.vy = -b.vy;
      api.audio.play(C.CUES.wallBounce);
    }
    if (b.y + C.BALL_R > C.FIELD_H && b.vy > 0) {
      b.y = C.FIELD_H - C.BALL_R;
      b.vy = -b.vy;
      api.audio.play(C.CUES.wallBounce);
    }
    for (const [side, p, x0, x1] of [
      ["left", left, C.P1_X0, C.P1_X1],
      ["right", right, C.P2_X0, C.P2_X1],
    ] as [Side, PaddleState, number, number][])
      if (
        b.x > x0 - C.BALL_R &&
        b.x < x1 + C.BALL_R &&
        b.y > p.cy - C.PADDLE_HALF - C.BALL_R &&
        b.y < p.cy + C.PADDLE_HALF + C.BALL_R
      ) {
        const dl = b.x - x0 + C.BALL_R,
          dr = x1 + C.BALL_R - b.x,
          top = b.y - p.cy + C.PADDLE_HALF + C.BALL_R,
          bot = p.cy + C.PADDLE_HALF + C.BALL_R - b.y,
          m = Math.min(dl, dr, top, bot);
        if (m === dl || m === dr) {
          const th =
              clamp((b.y - p.cy) / C.PADDLE_HALF, -1, 1) * C.MAX_BOUNCE_ANGLE,
            sp = Math.min(Math.hypot(b.vx, b.vy) * C.SPEED_MULT, C.SPEED_CAP),
            dir = side === "left" ? 1 : -1;
          b.vx = dir * sp * Math.cos(th);
          b.vy = sp * Math.sin(th);
          b.spin = clamp(
            b.spin + p.vy * C.SPIN_FROM_PADDLE,
            -C.SPIN_CLAMP,
            C.SPIN_CLAMP,
          );
          b.x = side === "left" ? x1 + C.BALL_R : x0 - C.BALL_R;
          api.audio.play(C.CUES.paddleHit);
        } else {
          b.y =
            m === top
              ? p.cy - C.PADDLE_HALF - C.BALL_R
              : p.cy + C.PADDLE_HALF + C.BALL_R;
          b.vy = -b.vy;
          api.audio.play(C.CUES.wallBounce);
        }
      }
    for (const o of s.obstacles)
      if (hitObstacle(b, o)) api.audio.play(C.CUES.obstacleBounce);
    if (b.x - C.BALL_R > C.FIELD_W) {
      point = "left";
      break;
    }
    if (b.x + C.BALL_R < 0) {
      point = "right";
      break;
    }
  }
  const t = s.simTime + dt;
  b.trail.push({ x: b.x, y: b.y, t });
  return {
    ball: { ...b, trail: b.trail.filter((v) => v.t >= t - C.TRAIL_TIME) },
    point,
  };
}
const start = (s: DeepReadonly<CaromState>, mode: Mode): CaromState => ({
  ...s,
  screen: "countdown",
  mode,
  menuIndex: 0,
  resumeScreen: "playing",
  score: { p1: 0, p2: 0 },
  winner: null,
  receiver: "left",
  ball: ball(),
  paddles: { left: pstate(), right: pstate() },
  obstacles: [obstacle(0, 0), obstacle(1, 0)],
  obstacleClock: 0,
  obstacleClockRunning: true,
});

export const game: Game<CaromState, CaromDebugApi> = {
  initialize(api: InitApi<CaromState>) {
    for (const a of C.ACTIONS)
      api.input.register(a, { keys: [...C.BINDINGS[a]] });
    api.audio.define(C.CUES.paddleHit, {
      wave: "square",
      freq: 220,
      freqTo: 440,
      gain: 0.04,
      durationMs: 70,
    });
    api.audio.define(C.CUES.wallBounce, {
      wave: "triangle",
      freq: 170,
      freqTo: 120,
      gain: 0.035,
      durationMs: 60,
    });
    api.audio.define(C.CUES.obstacleBounce, {
      freq: 300,
      freqTo: 160,
      gain: 0.04,
      durationMs: 80,
    });
    api.audio.define(C.CUES.score, {
      wave: "sawtooth",
      freq: 120,
      freqTo: 70,
      gain: 0.05,
      durationMs: 180,
    });
    const s = initial();
    api.diagnostics.register("screen", (v) => v.screen);
    api.diagnostics.register("mode", (v) => v.mode);
    api.diagnostics.register("score", (v) => `${v.score.p1}-${v.score.p2}`);
    api.diagnostics.register("ball", (v) =>
      v.ball ? `${v.ball.x.toFixed(0)},${v.ball.y.toFixed(0)}` : "none",
    );
    api.diagnostics.register("speed", (v) =>
      v.ball ? Math.hypot(v.ball.vx, v.ball.vy) : 0,
    );
    api.diagnostics.register("spin", (v) => v.ball?.spin ?? 0);
    api.diagnostics.register("p1", (v) => v.paddles.left.cy);
    api.diagnostics.register("p2", (v) => v.paddles.right.cy);
    return [s, debug()];
  },
  update(state, api, dt) {
    let s = { ...state, simTime: state.simTime + dt, muted: api.audio.muted() };
    if (api.input.pressed("mute")) {
      api.audio.setMuted(!s.muted);
      s = { ...s, muted: api.audio.muted() };
    }
    const u = api.input.pressed("p1-up") || api.input.pressed("p2-up"),
      d = api.input.pressed("p1-down") || api.input.pressed("p2-down"),
      confirm = api.input.pressed("confirm"),
      back = api.input.pressed("back"),
      pause = api.input.pressed("pause");
    const up1 = api.input.value("p1-up"),
      dn1 = api.input.value("p1-down"),
      up2 = api.input.value("p2-up"),
      dn2 = api.input.value("p2-down");
    const moveMenu = (n: number) =>
      u ? (s.menuIndex + n - 1) % n : d ? (s.menuIndex + 1) % n : s.menuIndex;
    if (s.screen === "title") {
      if (u || d) s = { ...s, menuIndex: moveMenu(3) };
      if (confirm) {
        s = { ...s, titleIndex: s.menuIndex };
        s =
          s.menuIndex === 2
            ? { ...s, screen: "howto", menuIndex: 0 }
            : start(s, s.menuIndex === 0 ? "solo" : "versus");
      }
    } else if (s.screen === "howto") {
      if (confirm || back)
        s = {
          ...initial(s.muted),
          titleIndex: s.titleIndex,
          menuIndex: s.titleIndex,
          simTime: s.simTime,
        };
    } else if (s.screen === "paused") {
      if (pause || back) s = { ...s, screen: s.resumeScreen };
      else if (u || d) s = { ...s, menuIndex: moveMenu(3) };
      else if (confirm)
        s =
          s.menuIndex === 0
            ? { ...s, screen: s.resumeScreen }
            : s.menuIndex === 1
              ? start(s, s.mode)
              : {
                  ...initial(s.muted),
                  titleIndex: s.titleIndex,
                  menuIndex: s.titleIndex,
                  simTime: s.simTime,
                };
    } else if (s.screen === "matchover") {
      if (back || (confirm && s.menuIndex === 1))
        s = {
          ...initial(s.muted),
          titleIndex: s.titleIndex,
          menuIndex: s.titleIndex,
          simTime: s.simTime,
        };
      else if (u || d) s = { ...s, menuIndex: moveMenu(2) };
      else if (confirm) s = start(s, s.mode);
    } else if (s.screen === "countdown" || s.screen === "playing") {
      if (pause)
        s = { ...s, screen: "paused", resumeScreen: s.screen, menuIndex: 0 };
      const l = move(
        s.paddles.left,
        s.mode === "solo" ? dn1 + dn2 - up1 - up2 : dn1 - up1,
        dt,
      );
      let r = s.paddles.right;
      if (r.driven) r = move(r, 0, dt);
      else if (s.mode === "versus") r = move(r, dn2 - up2, dt);
      else {
        let target = C.AI_HOME_Y,
          dead = C.AI_HOME_DEADZONE;
        if (
          s.ai.tracking &&
          s.screen === "playing" &&
          s.ball !== null &&
          s.ball.vx > 0
        ) {
          target = s.ball.y - s.ball.vy * C.AI_REACT;
          dead = C.AI_DEADZONE;
        }
        const diff = target - r.cy;
        const v =
          !s.ai.movement || Math.abs(diff) <= dead || !dt
            ? 0
            : Math.sign(diff) * Math.min(C.AI_SPEED, Math.abs(diff) / dt);
        r = move(r, v / C.PADDLE_SPEED, dt);
      }
      s = { ...s, paddles: { left: l, right: r } };
      if (s.obstacleClockRunning) {
        const t = s.obstacleClock + dt;
        s = {
          ...s,
          obstacleClock: t,
          obstacles: s.obstacles.map((o) => obstacle(o.index, t)),
        };
      }
      if (s.ball) {
        if (s.screen === "countdown" && s.ball.held) {
          const h = s.ball.holdTimer - dt;
          s =
            h <= 0
              ? {
                  ...s,
                  screen: "playing",
                  ball: {
                    ...s.ball,
                    held: false,
                    holdTimer: 0,
                    vx:
                      (s.receiver === "left" ? -1 : 1) *
                      C.SERVE_SPEED *
                      Math.cos(C.SERVE_ANGLE),
                    vy:
                      s.ball.serveSign *
                      C.SERVE_SPEED *
                      Math.sin(C.SERVE_ANGLE),
                    trail: [],
                  },
                }
              : { ...s, ball: { ...s.ball, holdTimer: h, trail: [] } };
        } else if (s.screen === "playing") {
          const q = advanceBall(s.ball, s, dt, api, l, r);
          s = { ...s, ball: q.ball };
          if (q.point) {
            api.audio.play(C.CUES.score);
            const score = {
              ...s.score,
              [q.point === "left" ? "p1" : "p2"]:
                s.score[q.point === "left" ? "p1" : "p2"] + 1,
            };
            const w =
              score.p1 >= C.WIN_SCORE && score.p1 - score.p2 >= C.WIN_LEAD
                ? "left"
                : score.p2 >= C.WIN_SCORE && score.p2 - score.p1 >= C.WIN_LEAD
                  ? "right"
                  : null;
            s = w
              ? { ...s, score, winner: w, screen: "matchover", menuIndex: 0 }
              : {
                  ...s,
                  score,
                  receiver: q.point === "left" ? "right" : "left",
                  ball: ball(),
                  screen: "countdown",
                };
          }
        }
      }
    }
    return s;
  },
  render(s, api: RenderApi) {
    draw(s, api.ctx);
  },
};

function debug(): CaromDebugApi {
  const d = {} as CaromDebugApi;
  Object.defineProperty(d, "version", {
    value: C.CAROM_DEBUG_VERSION,
    enumerable: true,
  });
  d.clearWorld = (s) => ({ ...s, ball: null, obstacles: [] });
  d.spawnBall = (s) => ({ ...s, ball: ball() });
  d.spawnObstacle = (s, i) => {
    if (i !== 0 && i !== 1) throw new Error("Carom: invalid obstacle index");
    return {
      ...s,
      obstacles: [
        ...s.obstacles.filter((o) => o.index !== i),
        obstacle(i, s.obstacleClock),
      ].sort((a, b) => a.index - b.index),
    };
  };
  d.reset = (s) => ({
    ...initial(s.muted),
    titleIndex: s.titleIndex,
    menuIndex: s.titleIndex,
  });
  d.reconcile = (s) => ({
    ...s,
    obstacles: s.obstacles.map((o) => obstacle(o.index, s.obstacleClock)),
  });
  d.setScreen = (s, v) => ({ ...s, screen: v });
  d.setMode = (s, v) => ({ ...s, mode: v });
  d.setMenuIndex = (s, v) => ({ ...s, menuIndex: v });
  d.setTitleIndex = (s, v) => ({ ...s, titleIndex: v });
  d.setResumeScreen = (s, v) => ({ ...s, resumeScreen: v });
  d.setScore = (s, p1, p2) => ({ ...s, score: { p1, p2 } });
  d.setWinner = (s, v) => ({ ...s, winner: v });
  d.setReceiver = (s, v) => ({ ...s, receiver: v });
  d.setPaddleCy = (s, x, v) =>
    withPaddle(s, x, (p) => ({
      ...p,
      cy: clamp(v, C.PADDLE_MIN_CY, C.PADDLE_MAX_CY),
    }));
  d.setPaddleVy = (s, x, v) => withPaddle(s, x, (p) => ({ ...p, drivenVy: v }));
  d.setPaddleDriven = (s, x, v) =>
    withPaddle(s, x, (p) => ({ ...p, driven: v }));
  d.setBallPosition = (s, x, y) => withBall(s, (b) => ({ ...b, x, y }));
  d.setBallVelocity = (s, x, y) => withBall(s, (b) => ({ ...b, vx: x, vy: y }));
  d.setBallSpin = (s, v) => withBall(s, (b) => ({ ...b, spin: v }));
  d.setBallHeld = (s, v) => withBall(s, (b) => ({ ...b, held: v }));
  d.setBallHoldTimer = (s, v) => withBall(s, (b) => ({ ...b, holdTimer: v }));
  d.setBallServeSign = (s, v) => withBall(s, (b) => ({ ...b, serveSign: v }));
  d.drawBallServeSign = (s) =>
    withBall(s, (b) => ({ ...b, serveSign: coin() }));
  d.setAiTracking = (s, v) => ({ ...s, ai: { ...s.ai, tracking: v } });
  d.setAiMovement = (s, v) => ({ ...s, ai: { ...s.ai, movement: v } });
  d.setMuted = (s, v) => ({ ...s, muted: v });
  d.setObstacleClock = (s, v) => ({
    ...s,
    obstacleClock: v,
    obstacles: s.obstacles.map((o) => obstacle(o.index, v)),
  });
  d.setObstacleClockRunning = (s, v) => ({ ...s, obstacleClockRunning: v });
  d.snapshot = (s) => ({
    version: 1,
    screen: s.screen,
    mode: s.mode,
    menuIndex: s.menuIndex,
    titleIndex: s.titleIndex,
    resumeScreen: s.resumeScreen,
    score: { ...s.score },
    winner: s.winner,
    muted: s.muted,
    paddles: { left: { ...s.paddles.left }, right: { ...s.paddles.right } },
    ai: { ...s.ai },
    receiver: s.receiver,
    ball: s.ball
      ? {
          ...s.ball,
          speed: Math.hypot(s.ball.vx, s.ball.vy),
          trail: s.ball.trail.map((x) => ({ ...x })),
        }
      : null,
    obstacles: s.obstacles.map((x) => ({ ...x })),
    obstacleClock: s.obstacleClock,
    obstacleClockRunning: s.obstacleClockRunning,
    simTime: s.simTime,
  });
  d.menuItemRect = (s, i) => rect(s, i);
  return d;
}

function draw(s: DeepReadonly<CaromState>, g: CanvasRenderingContext2D) {
  g.fillStyle = "#0b1a2c";
  g.fillRect(0, 0, C.FIELD_W, C.FIELD_H);
  g.setLineDash([12, 18]);
  g.strokeStyle = "rgba(165,210,235,.28)";
  g.beginPath();
  g.moveTo(C.NET_X, 34);
  g.lineTo(C.NET_X, C.FIELD_H - 34);
  g.stroke();
  g.setLineDash([]);
  for (const o of s.obstacles) {
    g.save();
    g.translate(o.cx, o.cy);
    g.rotate(o.theta);
    g.fillStyle = "#f3a447";
    g.shadowColor = "#f3a447";
    g.shadowBlur = 18;
    g.roundRect(-C.OBSTACLE_HW, -C.OBSTACLE_HH, C.OBSTACLE_W, C.OBSTACLE_H, 10);
    g.fill();
    g.restore();
  }
  for (const [x, p, c] of [
    [C.P1_X0, s.paddles.left, "#5de1e6"],
    [C.P2_X0, s.paddles.right, "#ff6482"],
  ] as [number, PaddleState, string][]) {
    g.fillStyle = c;
    g.shadowColor = c;
    g.shadowBlur = 22;
    g.roundRect(x, p.cy - C.PADDLE_H / 2, C.PADDLE_W, C.PADDLE_H, 8);
    g.fill();
    g.shadowBlur = 0;
  }
  if (s.ball) {
    g.fillStyle = "#f4fbff";
    g.shadowColor = "#fff";
    g.shadowBlur = 22;
    g.beginPath();
    g.arc(s.ball.x, s.ball.y, C.BALL_R, 0, Math.PI * 2);
    g.fill();
    g.shadowBlur = 0;
  }
  const txt = (
    v: string,
    x: number,
    y: number,
    n: number,
    c: string,
    align: CanvasTextAlign = "left",
  ) => {
    g.font = `700 ${n}px ui-sans-serif,system-ui`;
    g.fillStyle = c;
    g.textAlign = align;
    g.fillText(v, x, y);
  };
  if (s.screen === "title") {
    g.fillStyle = "rgba(4,10,20,.78)";
    g.fillRect(250, 90, 780, 560);
    txt(C.TITLE_TEXT, 640, 225, 104, "#f4fbff", "center");
    txt("SPIN. BANK. RETURN.", 640, 264, 17, "#63dce5", "center");
    menu(g, [...C.TITLE_ITEMS], s.menuIndex, txt);
    txt(
      "W/S or ↑/↓ to navigate  ·  ENTER to select  ·  M to mute",
      640,
      605,
      14,
      "#88a9bb",
      "center",
    );
  } else if (s.screen === "howto") {
    g.fillStyle = "rgba(4,10,20,.9)";
    g.fillRect(250, 65, 780, 590);
    txt("HOW TO PLAY", 640, 145, 42, "#f4fbff", "center");
    txt("W / S", 900, 220, 18, "#dff6ff", "right");
    txt("↑ / ↓", 900, 270, 18, "#dff6ff", "right");
    txt("Paddle motion adds spin at contact.", 380, 345, 18, "#b8d6e8");
    txt(
      "Curve the flight into bank shots around the rotating bars.",
      380,
      382,
      18,
      "#b8d6e8",
    );
    txt("First to 11, with a two-point lead, wins.", 380, 419, 18, "#b8d6e8");
    menu(g, ["BACK TO TITLE"], s.menuIndex, txt);
  } else {
    if (s.screen !== "countdown" && s.screen !== "playing") {
      txt(`${s.score.p1}`, 520, 94, 58, "#5de1e6");
      txt(`${s.score.p2}`, 760, 94, 58, "#ff6482");
    }
    if (s.screen === "paused") menu(g, [...C.PAUSE_ITEMS], s.menuIndex, txt);
    if (s.screen === "matchover") {
      txt(
        s.winner === "left" ? "PLAYER ONE WINS" : "PLAYER TWO WINS",
        640,
        235,
        34,
        "#fff",
        "center",
      );
      menu(g, [...C.MATCHOVER_ITEMS], s.menuIndex, txt);
    }
    if (s.screen === "countdown" && s.ball)
      txt(`${Math.ceil(s.ball.holdTimer)}`, 640, 280, 92, "#fff", "center");
  }
}
function menu(
  g: CanvasRenderingContext2D,
  items: readonly string[],
  sel: number,
  txt: (
    v: string,
    x: number,
    y: number,
    n: number,
    c: string,
    a?: CanvasTextAlign,
  ) => void,
) {
  items.forEach((v, i) => {
    const y = 392 + i * 58;
    if (i === sel) {
      g.fillStyle = "#e9f7ff";
      g.roundRect(390, y - 34, 500, 46, 12);
      g.fill();
      txt(v, 640, y - 3, 18, "#0a1725", "center");
    } else txt(v, 640, y - 3, 18, "#a6bfcc", "center");
  });
}
