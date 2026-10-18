import { describe, expect, it } from "vitest";
import type { InitApi } from "@clockwyrks/simple-2d";
import { game, type CaromState } from "./game";

function initApi(): InitApi<CaromState> {
  return {
    input: { register() {}, layout: () => null },
    audio: { define() {}, load: async () => {} },
    assets: {
      loadImage: async () => undefined as never,
      loadAudio: async () => undefined as never,
      load: async () => new Blob(),
      resolve: (path) => path,
    },
    diagnostics: { register() {} },
    events: {} as InitApi<CaromState>["events"],
    viewport: () => undefined as never,
  };
}

describe("Carom", () => {
  it("initializes a complete title state and debug surface", async () => {
    const [state, debug] = await game.initialize(initApi());
    expect(state.screen).toBe("title");
    expect(state.ball?.held).toBe(true);
    expect(state.obstacles).toHaveLength(2);
    expect(debug.snapshot(state)).toMatchObject({
      screen: "title",
      mode: "solo",
    });
  });

  it("poses and reads the render-free world", async () => {
    const [state, debug] = await game.initialize(initApi());
    const posed = debug.setBallVelocity(
      debug.setBallPosition(state, 300, 240),
      100,
      -40,
    );
    const snapshot = debug.snapshot(posed) as {
      ball: { x: number; speed: number };
    };
    expect(snapshot.ball.x).toBe(300);
    expect(snapshot.ball.speed).toBeCloseTo(Math.hypot(100, -40));
  });
});
