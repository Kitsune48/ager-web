import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });

  it("merges tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
