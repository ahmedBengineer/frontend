import { beforeEach, describe, expect, it } from "vitest";
import {
  clearPositions,
  layoutKey,
  loadPositions,
  savePositions,
  structuralHash,
} from "@/components/workflow-editor/utils/layoutStorage";

describe("workflow layout persistence", () => {
  beforeEach(() => localStorage.clear());

  it("isolates positions by agent and structural hash", () => {
    const first = structuralHash({
      workflows: {
        one: { task_group: { a: { kind: "collect" } }, task_order: ["a"] },
      },
    });
    const second = structuralHash({
      workflows: {
        one: { task_group: { b: { kind: "collect" } }, task_order: ["b"] },
      },
    });
    expect(first).not.toBe(second);
    expect(layoutKey(137, first, "main")).not.toBe(
      layoutKey(138, first, "main"),
    );
  });

  it("round trips valid positions and clears them", () => {
    const key = layoutKey(1, "hash", "main");
    savePositions(key, { router: { x: 10, y: 20 } });
    expect(loadPositions(key)).toEqual({ router: { x: 10, y: 20 } });
    clearPositions(key);
    expect(loadPositions(key)).toEqual({});
  });
});
