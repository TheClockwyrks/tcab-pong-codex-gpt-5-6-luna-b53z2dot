# Carom

Carom is a browser-based top-down paddle duel built around a simple idea: the
motion of a paddle bends the ball after contact. Bank shots become puzzles as
the ball ricochets off two rotating, swaying obstacles. Play Solo against the
AI or Versus with two local players; first to 11 with a two-point lead wins.

## Install and run

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. To create the static production site:

```sh
npm run build
npm run preview
```

The deployable site is emitted to `dist/`.

## Controls

- Solo: `W` / `S` move your paddle.
- Versus: player one uses `W` / `S`; player two uses `↑` / `↓`.
- `Enter` or `Space` selects menus, `P` pauses, `Escape` backs out or resumes,
  and `M` toggles mute.

Move while striking: downward motion adds clockwise spin and upward motion adds
counter-clockwise spin. Use the obstacles and the top and bottom walls to bend
your return into the open goal behind your opponent.
