import {
  applyThumbValue,
  clamp,
  nearestThumb,
  positionToValue,
  resolveActiveThumb,
  valueToPosition,
} from "./rangeSliderMath";

describe("clamp", () => {
  it("clamps below, within, and above", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe("positionToValue", () => {
  const w = 200; // 0..10 over 200px => 20px per grade
  it("snaps to the nearest grade", () => {
    expect(positionToValue(0, w, 0, 10, 1)).toBe(0);
    expect(positionToValue(200, w, 0, 10, 1)).toBe(10);
    expect(positionToValue(100, w, 0, 10, 1)).toBe(5);
    expect(positionToValue(109, w, 0, 10, 1)).toBe(5); // 5.45 -> 5
    expect(positionToValue(111, w, 0, 10, 1)).toBe(6); // 5.55 -> 6
  });
  it("clamps out-of-range positions to the bounds", () => {
    expect(positionToValue(-50, w, 0, 10, 1)).toBe(0);
    expect(positionToValue(9999, w, 0, 10, 1)).toBe(10);
  });
});

describe("valueToPosition", () => {
  it("maps grades to pixels and round-trips with positionToValue", () => {
    expect(valueToPosition(0, 200, 0, 10)).toBe(0);
    expect(valueToPosition(10, 200, 0, 10)).toBe(200);
    expect(valueToPosition(5, 200, 0, 10)).toBe(100);
    expect(positionToValue(valueToPosition(7, 200, 0, 10), 200, 0, 10, 1)).toBe(7);
  });
});

describe("nearestThumb", () => {
  it("returns the closer thumb", () => {
    expect(nearestThumb(10, 0, 200)).toBe("low");
    expect(nearestThumb(190, 0, 200)).toBe("high");
  });
  it("returns low on an exact tie", () => {
    expect(nearestThumb(100, 0, 200)).toBe("low");
  });
});

describe("resolveActiveThumb", () => {
  it("picks the nearest thumb when the thumbs are apart", () => {
    expect(resolveActiveThumb({ touchX: 190, lowX: 0, highX: 200, low: 0, high: 10, dx: 0 })).toBe(
      "high"
    );
  });
  it("is undecided at touch-down when the thumbs overlap", () => {
    expect(
      resolveActiveThumb({ touchX: 100, lowX: 100, highX: 100, low: 5, high: 5, dx: 0 })
    ).toBeNull();
  });
  it("moves high when overlapped and dragging right", () => {
    expect(resolveActiveThumb({ touchX: 100, lowX: 100, highX: 100, low: 5, high: 5, dx: 8 })).toBe(
      "high"
    );
  });
  it("moves low when overlapped and dragging left", () => {
    expect(
      resolveActiveThumb({ touchX: 100, lowX: 100, highX: 100, low: 5, high: 5, dx: -8 })
    ).toBe("low");
  });
});

describe("applyThumbValue", () => {
  it("moves low but clamps it to not exceed high", () => {
    expect(
      applyThumbValue({ active: "low", rawValue: 3, low: 1, high: 6, min: 0, max: 10 })
    ).toEqual({ low: 3, high: 6 });
    expect(
      applyThumbValue({ active: "low", rawValue: 9, low: 1, high: 6, min: 0, max: 10 })
    ).toEqual({ low: 6, high: 6 });
  });
  it("moves high but clamps it to not go below low", () => {
    expect(
      applyThumbValue({ active: "high", rawValue: 8, low: 2, high: 6, min: 0, max: 10 })
    ).toEqual({ low: 2, high: 8 });
    expect(
      applyThumbValue({ active: "high", rawValue: 1, low: 2, high: 6, min: 0, max: 10 })
    ).toEqual({ low: 2, high: 2 });
  });
  it("clamps to the global bounds", () => {
    expect(
      applyThumbValue({ active: "low", rawValue: -5, low: 3, high: 6, min: 0, max: 10 })
    ).toEqual({ low: 0, high: 6 });
    expect(
      applyThumbValue({ active: "high", rawValue: 99, low: 3, high: 6, min: 0, max: 10 })
    ).toEqual({ low: 3, high: 10 });
  });
});
