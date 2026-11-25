export type AqiLevel =
  | "good"
  | "moderate"
  | "sensitive"
  | "unhealthy"
  | "very_unhealthy"
  | "hazardous";

export interface AqiSeverity {
  level: AqiLevel;
  category: string;
  guidance: string;
}

export interface HourlyPoint {
  time: string;
  hourLabel: string;
  usAqi: number;
  pm25: number;
}

export interface AirQualityReport {
  location: {
    name: string;
    region: string;
    country: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  current: {
    observedAt: string;
    usAqi: number;
    pm25: number;
    pm10: number;
    no2: number;
    ozone: number;
  };
  severity: AqiSeverity;
  safestWindow: string;
  hourlyForecast: HourlyPoint[];
}

export class CityNotFoundError extends Error {
  constructor(city: string) {
    super(`Could not find location data for "${city}".`);
    this.name = "CityNotFoundError";
  }
}

export class UpstreamWeatherError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UpstreamWeatherError";
  }
}

/**
 * Maps numeric US AQI values to standard EPA categories and actionable guidance.
 */
export function classifyUsAqi(usAqi: number): AqiSeverity {
  const safeAqi = Number.isFinite(usAqi) ? Math.max(0, usAqi) : 0;

  if (safeAqi <= 50) {
    return {
      level: "good",
      category: "Good",
      guidance:
        "Air quality is satisfactory. Normal outdoor activities and cross-ventilation are safe.",
    };
  }
  if (safeAqi <= 100) {
    return {
      level: "moderate",
      category: "Moderate",
      guidance:
        "Acceptable for most, though unusually sensitive individuals should limit prolonged outdoor exertion.",
    };
  }
  if (safeAqi <= 150) {
    return {
      level: "sensitive",
      category: "Unhealthy for Sensitive Groups",
      guidance:
        "Children, older adults, and people with asthma should reduce prolonged outdoor exertion.",
    };
  }
  if (safeAqi <= 200) {
    return {
      level: "unhealthy",
      category: "Unhealthy",
      guidance:
        "Everyone may begin to experience health effects. Wear an N95 mask outdoors and keep windows closed.",
    };
  }
  if (safeAqi <= 300) {
    return {
      level: "very_unhealthy",
      category: "Very Unhealthy",
      guidance:
        "Health alert: avoid outdoor exercise, run indoor air filtration, and seal window drafts.",
    };
  }
  return {
    level: "hazardous",
    category: "Hazardous",
    guidance:
      "Emergency smog conditions: stay indoors, run HEPA/DIY filtration continuously, and eliminate indoor smoke sources.",
  };
}

/**
 * Finds the contiguous 3-hour window with the lowest average PM2.5 concentration
 * so families know when brief ventilation or essential errands carry the least exposure.
 */
export function findSafestWindow(hourly: HourlyPoint[]): string {
  if (hourly.length === 0) {
    return "Afternoon hours (typically lowest inversion trapping)";
  }

  if (hourly.length < 3) {
    const best = hourly.reduce(
      (min, cur) => (cur.pm25 < min.pm25 ? cur : min),
      hourly[0],
    );
    return `${best.hourLabel} (PM2.5: ${Math.round(best.pm25)} µg/m³)`;
  }

  let bestStartIdx = 0;
  let lowestAvgPm25 = Number.POSITIVE_INFINITY;

  for (let i = 0; i <= hourly.length - 3; i++) {
    const avgPm25 =
      (hourly[i].pm25 + hourly[i + 1].pm25 + hourly[i + 2].pm25) / 3;
    if (avgPm25 < lowestAvgPm25) {
      lowestAvgPm25 = avgPm25;
      bestStartIdx = i;
    }
  }

  const startLabel = hourly[bestStartIdx].hourLabel;
  const endLabel = hourly[bestStartIdx + 2].hourLabel;
  return `${startLabel} – ${endLabel} (avg PM2.5: ${Math.round(lowestAvgPm25)} µg/m³)`;
}

function extractHourLabel(isoTimestamp: string): string {
  const timePart = isoTimestamp.split("T")[1];
  return timePart ? timePart.slice(0, 5) : isoTimestamp;
}

interface GeocodingApiResponse {
  results?: Array<{
    name: string;
    admin1?: string;
    country: string;
    latitude: number;
    longitude: number;
    timezone?: string;
  }>;
}

interface AirQualityApiResponse {
  timezone?: string;
  current?: {
    time: string;
    us_aqi: number;
    pm2_5: number;
    pm10: number;
    nitrogen_dioxide?: number;
    ozone?: number;
  };
  hourly?: {
    time: string[];
    us_aqi: number[];
    pm2_5: number[];
  };
}

export async function fetchCityAirQuality(
  city: string,
): Promise<AirQualityReport> {
  const geoUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
  geoUrl.searchParams.set("name", city);
  geoUrl.searchParams.set("count", "1");
  geoUrl.searchParams.set("language", "en");
  geoUrl.searchParams.set("format", "json");

  const geoRes = await fetch(geoUrl.toString(), {
    next: { revalidate: 3600 },
  });

  if (!geoRes.ok) {
    throw new UpstreamWeatherError(
      "Geocoding service is temporarily unavailable.",
    );
  }

  const geoData = (await geoRes.json()) as GeocodingApiResponse;
  const place = geoData.results?.[0];

  if (!place) {
    throw new CityNotFoundError(city);
  }

  const aqUrl = new URL(
    "https://air-quality-api.open-meteo.com/v1/air-quality",
  );
  aqUrl.searchParams.set("latitude", String(place.latitude));
  aqUrl.searchParams.set("longitude", String(place.longitude));
  aqUrl.searchParams.set("current", "us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone");
  aqUrl.searchParams.set("hourly", "us_aqi,pm2_5");
  aqUrl.searchParams.set("forecast_days", "1");
  aqUrl.searchParams.set("timezone", "auto");

  const aqRes = await fetch(aqUrl.toString(), {
    next: { revalidate: 900 },
  });

  if (!aqRes.ok) {
    throw new UpstreamWeatherError(
      "Air quality telemetry service is temporarily unavailable.",
    );
  }

  const aqData = (await aqRes.json()) as AirQualityApiResponse;

  if (!aqData.current) {
    throw new UpstreamWeatherError(
      "Incomplete air quality telemetry returned for this location.",
    );
  }

  const times = aqData.hourly?.time ?? [];
  const aqis = aqData.hourly?.us_aqi ?? [];
  const pm25s = aqData.hourly?.pm2_5 ?? [];

  const hourlyForecast: HourlyPoint[] = times.map((time, idx) => ({
    time,
    hourLabel: extractHourLabel(time),
    usAqi: Math.round(aqis[idx] ?? 0),
    pm25: Number((pm25s[idx] ?? 0).toFixed(1)),
  }));

  const usAqi = Math.round(aqData.current.us_aqi);

  return {
    location: {
      name: place.name,
      region: place.admin1 ?? "",
      country: place.country,
      latitude: place.latitude,
      longitude: place.longitude,
      timezone: aqData.timezone ?? place.timezone ?? "UTC",
    },
    current: {
      observedAt: aqData.current.time,
      usAqi,
      pm25: Number(aqData.current.pm2_5.toFixed(1)),
      pm10: Number(aqData.current.pm10.toFixed(1)),
      no2: Number((aqData.current.nitrogen_dioxide ?? 0).toFixed(1)),
      ozone: Number((aqData.current.ozone ?? 0).toFixed(1)),
    },
    severity: classifyUsAqi(usAqi),
    safestWindow: findSafestWindow(hourlyForecast),
    hourlyForecast,
  };
}
