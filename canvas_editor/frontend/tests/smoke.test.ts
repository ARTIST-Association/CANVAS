import { describe, expect, it } from "vitest";

describe("toolchain", () => {
  it("runs vitest under jsdom", () => {
    expect(typeof document).toBe("object");
    expect(1 + 1).toBe(2);
  });
});
