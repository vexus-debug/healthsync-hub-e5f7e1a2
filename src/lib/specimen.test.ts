import { describe, it, expect } from "vitest";
import { nextStage, tubeFor } from "./specimen";
describe("specimen workflow", () => {
  it("advances Registered to Sample Collected", () => expect(nextStage("Registered")).toBe("Sample Collected"));
  it("does not advance In Analysis (completion happens on sign-off)", () => expect(nextStage("In Analysis")).toBeNull());
  it("rejected specimens go back to collection", () => expect(nextStage("Rejected")).toBe("Sample Collected"));
  it("FBC uses EDTA tube", () => expect(tubeFor("FBC").tube).toBe("EDTA"));
  it("FBS uses Fluoride tube", () => expect(tubeFor("FBS").tube).toBe("Fluoride"));
});
