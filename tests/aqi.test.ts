import { describe, expect, it } from "vitest";
import { classifyUsAqi, findSafestWindow, type HourlyPoint } from "@/lib/aqi";

describe("classifyUsAqi", () => {
  it("maps standard EPA breakpoints accurately", () => {
    expect(classifyUsAqi(35).level).toBe("good");
    expect(classifyUsAqi(80).level).toBe("moderate");
    expect(classifyUsAqi(130).level).toBe("sensitive");
    expect(classifyUsAqi(179).level).toBe("unhealthy");
    expect(classifyUsAqi(265).level).toBe("very_unhealthy");
    expect(classifyUsAqi(420).level).toBe("hazardous");
  });

  it("handles boundary values and non-finite inputs safely", () => {
    expect(classifyUsAqi(50).level).toBe("good");
    expect(classifyUsAqi(51).level).toBe("moderate");
    expect(classifyUsAqi(-15).level).toBe("good");
    expect(classifyUsAqi(Number.NaN).level).toBe("good");
  });
});

describe("findSafestWindow", () => {
  it("identifies the contiguous 3-hour window with the lowest average PM2.5", () => {
    const hourly: HourlyPoint[] = [
      { time: "2026-11-25T08:00", hourLabel: "08:00", usAqi: 240, pm25: 190 },
      { time: "2026-11-25T09:00", hourLabel: "09:00", usAqi: 210, pm25: 160 },
      { time: "2026-11-25T10:00", hourLabel: "10:00", usAqi: 180, pm25: 110 },
      { time: "2026-11-25T13:00", hourLabel: "13:00", usAqi: 155, pm25: 62 },
      { time: "2026-11-25T14:00", hourLabel: "14:00", usAqi: 150, pm25: 58 },
      { time: "2026-11-25T15:00", hourLabel: "15:00", usAqi: 158, pm25: 65 },
      { time: "2026-11-25T19:00", hourLabel: "19:00", usAqi: 260, pm25: 210 },
    ];

    expect(findSafestWindow(hourly)).toBe(
      "13:00 – 15:00 (avg PM2.5: 62 µg/m³)",
    );
  });

  it("returns no reliable window when hourly telemetry is empty", () => {
    expect(findSafestWindow([])).toBe("No reliable 3-hour window available");
  });

  it("rejects forecast entries with missing hours", () => {
    const hourly: HourlyPoint[] = [
      { time: "2026-11-25T08:00", hourLabel: "08:00", usAqi: 200, pm25: 150 },
      { time: "2026-11-25T10:00", hourLabel: "10:00", usAqi: 180, pm25: 100 },
      { time: "2026-11-25T11:00", hourLabel: "11:00", usAqi: 160, pm25: 80 },
    ];

    expect(findSafestWindow(hourly)).toBe(
      "No reliable 3-hour window available",
    );
  });

  it("does not claim a 3-hour window with fewer than three points", () => {
    const shortSeries: HourlyPoint[] = [
      { time: "2026-11-25T14:00", hourLabel: "14:00", usAqi: 120, pm25: 44 },
      { time: "2026-11-25T15:00", hourLabel: "15:00", usAqi: 140, pm25: 55 },
    ];

    expect(findSafestWindow(shortSeries)).toBe(
      "No reliable 3-hour window available",
    );
  });
});
