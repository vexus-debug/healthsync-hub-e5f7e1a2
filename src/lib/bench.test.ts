import { describe, it, expect } from "vitest";
import { findCriticalValues, isNoticeComplete, expandMacros, cycleSusceptibility } from "./bench";

describe("critical values", () => {
  it("flags potassium below 2.8", () => {
    expect(findCriticalValues({ potassium: "2.5" })[0].direction).toBe("LOW");
  });
  it("flags potassium above 6.2", () => {
    expect(findCriticalValues({ potassium: "6.5" })[0].direction).toBe("HIGH");
  });
  it("does not flag potassium 4.0", () => {
    expect(findCriticalValues({ potassium: "4.0" })).toHaveLength(0);
  });
  it("flags platelets below 20", () => {
    expect(findCriticalValues({ platelets: "15" })).toHaveLength(1);
  });
  it("flags glucose via label", () => {
    expect(findCriticalValues({ x1: "30" }, { x1: "Random Blood Sugar" })).toHaveLength(1);
  });
  it("requires read-back for complete notice", () => {
    expect(isNoticeComplete({ physician: "Dr A", phone: "080", at: "now", readBack: false })).toBe(false);
    expect(isNoticeComplete({ physician: "Dr A", phone: "080", at: "now", readBack: true })).toBe(true);
  });
});

describe("macros & AST", () => {
  it("expands .uti", () => {
    expect(expandMacros("note .uti", [{ id: "1", shortcut: ".uti", title: "", body: "UTI TEXT" }])).toBe("note UTI TEXT");
  });
  it("cycles S → I → R → empty", () => {
    expect(cycleSusceptibility(undefined)).toBe("S");
    expect(cycleSusceptibility("S")).toBe("I");
    expect(cycleSusceptibility("I")).toBe("R");
    expect(cycleSusceptibility("R")).toBeUndefined();
  });
});
