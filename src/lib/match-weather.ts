import "server-only";

import { formatSeoulDateInput } from "@/lib/date";
import { getKmaWeatherEnv } from "@/lib/supabase/env";
import { assertNotificationDispatchSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type MatchWeatherMatchRow = {
  address: string;
  end_at: string;
  id: string;
  start_at: string;
  status: "cancelled" | "closed" | "draft" | "open";
  title: string;
  venue_name: string;
  weather_grid_nx: number | null;
  weather_grid_ny: number | null;
};

type MatchWeatherStateRow = {
  forecast_base_at: string | null;
  last_checked_at: string | null;
  last_payload: Record<string, unknown> | null;
  last_precipitation_mm: number | null;
  match_id: string;
  rain_alert_changed_sent_at: string | null;
  rain_alert_sent_at: string | null;
  rain_cancelled_at: string | null;
};

type KmaForecastItem = {
  category?: string;
  fcstDate?: string;
  fcstTime?: string;
  fcstValue?: string;
};

type MatchWeatherClient = NonNullable<
  Awaited<ReturnType<typeof getSupabaseServerClient>>
>;

export type AdminMatchWeatherData = {
  address: string;
  endAt: string;
  forecastBaseAt: string | null;
  lastCheckedAt: string | null;
  lastPrecipitationMm: number | null;
  matchId: string;
  rainAlertChangedSentAt: string | null;
  rainAlertSentAt: string | null;
  rainCancelledAt: string | null;
  startAt: string;
  status: "cancelled" | "closed" | "draft" | "open";
  title: string;
  venueName: string;
  weatherGridNx: number | null;
  weatherGridNy: number | null;
};

export type MatchWeatherCheckResult = {
  data: AdminMatchWeatherData;
  previousPrecipitationMm: number | null;
};

export async function getAdminMatchWeatherData(
  matchId: string,
  supabase?: MatchWeatherClient | null,
) {
  const client = supabase ?? (await getSupabaseServerClient());

  if (!client) {
    return null;
  }

  await assertNotificationDispatchSchemaReady(client);

  const [matchRow, stateRow] = await Promise.all([
    getMatchWeatherMatchRow(client, matchId),
    getMatchWeatherStateRow(client, matchId),
  ]);

  if (!matchRow) {
    return null;
  }

  return buildAdminMatchWeatherData(matchRow, stateRow);
}

export async function checkAndStoreMatchWeather(
  matchId: string,
  supabase?: MatchWeatherClient | null,
) {
  const client = supabase ?? (await getSupabaseServerClient());

  if (!client) {
    throw new Error("Supabase is not configured");
  }

  await assertNotificationDispatchSchemaReady(client);
  const matchRow = await getMatchWeatherMatchRow(client, matchId);

  if (!matchRow) {
    throw new Error("Match not found");
  }

  if (!matchRow.weather_grid_nx || !matchRow.weather_grid_ny) {
    throw new Error("기상청 격자값(nx, ny)이 설정되지 않았습니다.");
  }

  const previousState = await getMatchWeatherStateRow(client, matchId);
  const forecast = await fetchMatchPrecipitationForecast({
    endAt: matchRow.end_at,
    nx: matchRow.weather_grid_nx,
    ny: matchRow.weather_grid_ny,
    startAt: matchRow.start_at,
  });

  const stateRow = await upsertMatchWeatherState(client, matchId, {
    forecastBaseAt: forecast.forecastBaseAt,
    lastCheckedAt: new Date().toISOString(),
    lastPayload: forecast.payload,
    lastPrecipitationMm: forecast.precipitationMm,
  });

  return {
    data: buildAdminMatchWeatherData(matchRow, stateRow),
    previousPrecipitationMm: previousState?.last_precipitation_mm ?? null,
  } satisfies MatchWeatherCheckResult;
}

export async function markRainAlertSent(
  matchId: string,
  supabase?: MatchWeatherClient | null,
) {
  return updateMatchWeatherState(matchId, { rainAlertSentAt: new Date().toISOString() }, supabase);
}

export async function markRainAlertChangedSent(
  matchId: string,
  supabase?: MatchWeatherClient | null,
) {
  return updateMatchWeatherState(
    matchId,
    { rainAlertChangedSentAt: new Date().toISOString() },
    supabase,
  );
}

export async function markRainCancelled(
  matchId: string,
  supabase?: MatchWeatherClient | null,
) {
  return updateMatchWeatherState(matchId, { rainCancelledAt: new Date().toISOString() }, supabase);
}

export function getHoursUntilMatchStart(startAt: string) {
  return (new Date(startAt).getTime() - Date.now()) / (60 * 60 * 1000);
}

export function isRainAlertWindow(startAt: string) {
  return getHoursUntilMatchStart(startAt) > 2;
}

export function isRainAlertChangedWindow(startAt: string) {
  return getHoursUntilMatchStart(startAt) <= 2;
}

async function updateMatchWeatherState(
  matchId: string,
  {
    rainAlertChangedSentAt,
    rainAlertSentAt,
    rainCancelledAt,
  }: {
    rainAlertChangedSentAt?: string;
    rainAlertSentAt?: string;
    rainCancelledAt?: string;
  },
  supabase?: MatchWeatherClient | null,
) {
  const client = supabase ?? (await getSupabaseServerClient());

  if (!client) {
    throw new Error("Supabase is not configured");
  }

  await assertNotificationDispatchSchemaReady(client);
  const existingState = await getMatchWeatherStateRow(client, matchId);

  const { error } = await ((client.from("match_weather_states" as any) as any).upsert(
    {
      match_id: matchId,
      forecast_base_at: existingState?.forecast_base_at ?? null,
      last_checked_at: existingState?.last_checked_at ?? null,
      last_payload: existingState?.last_payload ?? {},
      last_precipitation_mm: existingState?.last_precipitation_mm ?? null,
      rain_alert_changed_sent_at:
        rainAlertChangedSentAt ?? existingState?.rain_alert_changed_sent_at ?? null,
      rain_alert_sent_at: rainAlertSentAt ?? existingState?.rain_alert_sent_at ?? null,
      rain_cancelled_at: rainCancelledAt ?? existingState?.rain_cancelled_at ?? null,
    },
    { onConflict: "match_id" },
  ));

  if (error) {
    throw new Error(`Failed to update match weather state: ${error.message}`);
  }
}

async function upsertMatchWeatherState(
  client: MatchWeatherClient,
  matchId: string,
  {
    forecastBaseAt,
    lastCheckedAt,
    lastPayload,
    lastPrecipitationMm,
  }: {
    forecastBaseAt: string;
    lastCheckedAt: string;
    lastPayload: Record<string, unknown>;
    lastPrecipitationMm: number;
  },
) {
  const existingState = await getMatchWeatherStateRow(client, matchId);
  const { data, error } = await ((client.from("match_weather_states" as any) as any)
    .upsert(
      {
        match_id: matchId,
        forecast_base_at: forecastBaseAt,
        last_checked_at: lastCheckedAt,
        last_payload: lastPayload,
        last_precipitation_mm: lastPrecipitationMm,
        rain_alert_changed_sent_at: existingState?.rain_alert_changed_sent_at ?? null,
        rain_alert_sent_at: existingState?.rain_alert_sent_at ?? null,
        rain_cancelled_at: existingState?.rain_cancelled_at ?? null,
      },
      { onConflict: "match_id" },
    )
    .select(
      "match_id, last_checked_at, forecast_base_at, last_precipitation_mm, last_payload, rain_alert_sent_at, rain_alert_changed_sent_at, rain_cancelled_at",
    )
    .maybeSingle());

  if (error) {
    throw new Error(`Failed to save match weather state: ${error.message}`);
  }

  return (data ?? null) as MatchWeatherStateRow | null;
}

async function getMatchWeatherMatchRow(
  client: MatchWeatherClient,
  matchId: string,
) {
  const { data, error } = await client
    .from("matches")
    .select(
      "id, title, venue_name, address, start_at, end_at, status, weather_grid_nx, weather_grid_ny",
    )
    .eq("id", matchId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load match weather data: ${error.message}`);
  }

  return (data ?? null) as MatchWeatherMatchRow | null;
}

async function getMatchWeatherStateRow(
  client: MatchWeatherClient,
  matchId: string,
) {
  const { data, error } = await client
    .from("match_weather_states")
    .select(
      "match_id, last_checked_at, forecast_base_at, last_precipitation_mm, last_payload, rain_alert_sent_at, rain_alert_changed_sent_at, rain_cancelled_at",
    )
    .eq("match_id", matchId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load match weather state: ${error.message}`);
  }

  return (data ?? null) as MatchWeatherStateRow | null;
}

function buildAdminMatchWeatherData(
  matchRow: MatchWeatherMatchRow,
  stateRow: MatchWeatherStateRow | null,
) {
  return {
    address: matchRow.address,
    endAt: matchRow.end_at,
    forecastBaseAt: stateRow?.forecast_base_at ?? null,
    lastCheckedAt: stateRow?.last_checked_at ?? null,
    lastPrecipitationMm: stateRow?.last_precipitation_mm ?? null,
    matchId: matchRow.id,
    rainAlertChangedSentAt: stateRow?.rain_alert_changed_sent_at ?? null,
    rainAlertSentAt: stateRow?.rain_alert_sent_at ?? null,
    rainCancelledAt: stateRow?.rain_cancelled_at ?? null,
    startAt: matchRow.start_at,
    status: matchRow.status,
    title: matchRow.title,
    venueName: matchRow.venue_name,
    weatherGridNx: matchRow.weather_grid_nx,
    weatherGridNy: matchRow.weather_grid_ny,
  } satisfies AdminMatchWeatherData;
}

async function fetchMatchPrecipitationForecast({
  endAt,
  nx,
  ny,
  startAt,
}: {
  endAt: string;
  nx: number;
  ny: number;
  startAt: string;
}) {
  const env = getKmaWeatherEnv();

  if (!env) {
    throw new Error("기상청 API 키가 설정되지 않았습니다.");
  }

  const candidates = getVillageForecastCandidates(new Date());
  let lastError: Error | null = null;

  for (const candidate of candidates) {
    try {
      const payload = await requestVillageForecast({
        baseDate: candidate.baseDate,
        baseTime: candidate.baseTime,
        nx,
        ny,
        serviceKey: env.serviceKey,
      });
      const items = getVillageForecastItems(payload);
      const precipitationMm = getMaxMatchPrecipitation(items, { endAt, startAt });

      if (precipitationMm === null) {
        throw new Error("매치 시간대에 해당하는 강수 예보를 찾지 못했습니다.");
      }

      return {
        forecastBaseAt: buildForecastBaseAt(candidate.baseDate, candidate.baseTime).toISOString(),
        payload,
        precipitationMm,
      };
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error("기상청 예보를 조회하지 못했습니다.");
    }
  }

  throw lastError ?? new Error("기상청 예보를 조회하지 못했습니다.");
}

async function requestVillageForecast({
  baseDate,
  baseTime,
  nx,
  ny,
  serviceKey,
}: {
  baseDate: string;
  baseTime: string;
  nx: number;
  ny: number;
  serviceKey: string;
}) {
  const query = new URLSearchParams({
    ServiceKey: normalizeServiceKey(serviceKey),
    base_date: baseDate,
    base_time: baseTime,
    dataType: "JSON",
    numOfRows: "1000",
    nx: String(nx),
    ny: String(ny),
    pageNo: "1",
  });

  const response = await fetch(
    `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?${query.toString()}`,
    {
      cache: "no-store",
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  if (!response.ok) {
    throw new Error("기상청 예보 응답이 실패했습니다.");
  }

  const resultCode = getKmaResultCode(payload);

  if (resultCode !== "00") {
    throw new Error(getKmaResultMessage(payload));
  }

  return payload ?? {};
}

function getVillageForecastCandidates(now: Date) {
  const reference = new Date(now.getTime() - 15 * 60 * 1000);
  const baseTimes = ["2300", "2000", "1700", "1400", "1100", "0800", "0500", "0200"];
  const candidates: Array<{ baseDate: string; baseTime: string; sortKey: string }> = [];

  for (let offset = 0; offset <= 1; offset += 1) {
    const currentDate = new Date(reference.getTime());
    currentDate.setUTCDate(currentDate.getUTCDate() - offset);
    const dateLabel = formatSeoulDateInput(currentDate).replaceAll("-", "");

    for (const baseTime of baseTimes) {
      const baseAt = buildForecastBaseAt(dateLabel, baseTime);

      if (baseAt.getTime() > reference.getTime()) {
        continue;
      }

      candidates.push({
        baseDate: dateLabel,
        baseTime,
        sortKey: `${dateLabel}${baseTime}`,
      });
    }
  }

  return candidates
    .sort((left, right) => right.sortKey.localeCompare(left.sortKey))
    .slice(0, 6);
}

function getVillageForecastItems(payload: Record<string, unknown>) {
  const response = payload.response;

  if (!response || typeof response !== "object") {
    return [];
  }

  const body = (response as Record<string, unknown>).body;

  if (!body || typeof body !== "object") {
    return [];
  }

  const items = (body as Record<string, unknown>).items;

  if (!items || typeof items !== "object") {
    return [];
  }

  const item = (items as Record<string, unknown>).item;

  if (Array.isArray(item)) {
    return item as KmaForecastItem[];
  }

  return item && typeof item === "object" ? [item as KmaForecastItem] : [];
}

function getMaxMatchPrecipitation(
  items: KmaForecastItem[],
  {
    endAt,
    startAt,
  }: {
    endAt: string;
    startAt: string;
  },
) {
  const matchStart = new Date(startAt);
  const matchEnd = new Date(endAt);

  if (Number.isNaN(matchStart.getTime()) || Number.isNaN(matchEnd.getTime())) {
    return null;
  }

  let maxPrecipitation: number | null = null;

  for (const item of items) {
    if (item.category !== "PCP" || !item.fcstDate || !item.fcstTime) {
      continue;
    }

    const forecastAt = new Date(
      `${item.fcstDate.slice(0, 4)}-${item.fcstDate.slice(4, 6)}-${item.fcstDate.slice(6, 8)}T${item.fcstTime.slice(0, 2)}:${item.fcstTime.slice(2, 4)}:00+09:00`,
    );

    if (Number.isNaN(forecastAt.getTime())) {
      continue;
    }

    const slotEnd = new Date(forecastAt.getTime() + 60 * 60 * 1000);

    if (slotEnd <= matchStart || forecastAt >= matchEnd) {
      continue;
    }

    const precipitation = parsePrecipitationValue(item.fcstValue);

    if (precipitation === null) {
      continue;
    }

    maxPrecipitation = maxPrecipitation === null
      ? precipitation
      : Math.max(maxPrecipitation, precipitation);
  }

  return maxPrecipitation;
}

function parsePrecipitationValue(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();

  if (!normalized || normalized === "강수없음" || normalized.includes("1mm 미만")) {
    return 0;
  }

  const rangeMatch = normalized.match(/^([0-9]+(?:\.[0-9]+)?)\s*~/);

  if (rangeMatch) {
    return Number.parseFloat(rangeMatch[1] ?? "0");
  }

  const directMatch = normalized.match(/([0-9]+(?:\.[0-9]+)?)/);

  if (!directMatch) {
    return null;
  }

  return Number.parseFloat(directMatch[1] ?? "0");
}

function getKmaResultCode(payload: Record<string, unknown> | null) {
  const header = getKmaHeader(payload);

  return typeof header?.resultCode === "string" ? header.resultCode : null;
}

function getKmaResultMessage(payload: Record<string, unknown> | null) {
  const header = getKmaHeader(payload);

  return typeof header?.resultMsg === "string"
    ? header.resultMsg
    : "기상청 예보 조회에 실패했습니다.";
}

function getKmaHeader(payload: Record<string, unknown> | null) {
  const response = payload?.response;

  if (!response || typeof response !== "object") {
    return null;
  }

  const header = (response as Record<string, unknown>).header;
  return header && typeof header === "object"
    ? (header as Record<string, unknown>)
    : null;
}

function buildForecastBaseAt(baseDate: string, baseTime: string) {
  return new Date(
    `${baseDate.slice(0, 4)}-${baseDate.slice(4, 6)}-${baseDate.slice(6, 8)}T${baseTime.slice(0, 2)}:${baseTime.slice(2, 4)}:00+09:00`,
  );
}

function normalizeServiceKey(serviceKey: string) {
  try {
    return decodeURIComponent(serviceKey);
  } catch {
    return serviceKey;
  }
}
