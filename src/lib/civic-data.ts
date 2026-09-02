import { supabase } from "@/integrations/supabase/client";

export const COMUNI = [
  { slug: "diano-marina", name: "Diano Marina", lat: 43.9098, lon: 8.0847 },
  { slug: "diano-castello", name: "Diano Castello", lat: 43.9271, lon: 8.0656 },
  { slug: "diano-san-pietro", name: "Diano San Pietro", lat: 43.9349, lon: 8.0847 },
  { slug: "diano-arentino", name: "Diano Arentino", lat: 43.9531, lon: 8.0592 },
  { slug: "san-bartolomeo-al-mare", name: "San Bartolomeo al Mare", lat: 43.9203, lon: 8.1064 },
  { slug: "cervo", name: "Cervo", lat: 43.9245, lon: 8.1153 },
  { slug: "imperia", name: "Imperia", lat: 43.8869, lon: 8.0276 },
] as const;

export type ComuneSlug = (typeof COMUNI)[number]["slug"];

export type AlertColor = "verde" | "giallo" | "arancione" | "rosso";

export type AlertDay = {
  allerta: { colore: AlertColor; descrizione: string; livello: number };
  dettagli: { idraulico: string; temporali: string; idrogeologico: string };
};

export type AlertResponse = {
  comune: string;
  zona: string;
  oggi: AlertDay;
  domani: AlertDay;
  bulletin_info?: { data_bollettino?: string; ora_bollettino?: string };
};

export async function fetchAlert(slug: string): Promise<AlertResponse> {
  const res = await fetch(`https://allertameteo.app/api/alert/${slug}`);
  if (!res.ok) throw new Error("alert fetch failed");
  const json = (await res.json()) as { success: boolean; data: AlertResponse };
  if (!json.success) throw new Error("alert api error");
  return json.data;
}

export type AlertOverride = {
  giorno: "oggi" | "domani";
  attivo: boolean;
  colore: AlertColor;
  descrizione: string | null;
  idraulico: string | null;
  idrogeologico: string | null;
  temporali: string | null;
  updated_at: string;
};

/**
 * Override manuale, usato SOLO come ripiego quando la fonte ufficiale
 * (allertameteo.app) non è raggiungibile — non sostituisce mai un dato
 * ufficiale valido.
 */
export async function fetchAlertOverride(): Promise<AlertOverride[]> {
  const { data, error } = await supabase.from("allerta_override").select("*");
  if (error) throw error;
  return (data ?? []) as unknown as AlertOverride[];
}

export function overrideToDay(o: AlertOverride): AlertDay {
  return {
    allerta: {
      colore: o.colore,
      descrizione: o.descrizione ?? "",
      livello: { verde: 0, giallo: 1, arancione: 2, rosso: 3 }[o.colore],
    },
    dettagli: {
      idraulico: o.idraulico ?? "—",
      idrogeologico: o.idrogeologico ?? "—",
      temporali: o.temporali ?? "—",
    },
  };
}

export type BandieraRossa = {
  attivo: boolean;
  aggiornata_il: string;
  note: string | null;
};

/**
 * Segnalazione NON ufficiale della bandiera rossa ai Bagni Delfino (Diano
 * Marina), rilevata manualmente dall'amministratore guardando la webcam
 * rivolta verso ovest. Riflette solo quel punto preciso della costa, non
 * sostituisce le indicazioni degli stabilimenti balneari o della
 * Capitaneria di Porto.
 */
export async function fetchBandieraRossa(): Promise<BandieraRossa | null> {
  const { data, error } = await supabase
    .from("bandiera_rossa_bagni_delfino")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as BandieraRossa | null;
}

export type WeatherNow = {
  temperature: number;
  wind: number;
  windDirection: number;
  humidity: number;
  code: number;
  maxToday: number;
  minToday: number;
};

export async function fetchWeather(lat: number, lon: number): Promise<WeatherNow> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FRome&forecast_days=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("weather fetch failed");
  const j = await res.json();
  return {
    temperature: Math.round(j.current.temperature_2m),
    wind: Math.round(j.current.wind_speed_10m),
    windDirection: Math.round(j.current.wind_direction_10m),
    humidity: Math.round(j.current.relative_humidity_2m),
    code: j.current.weather_code,
    maxToday: Math.round(j.daily.temperature_2m_max[0]),
    minToday: Math.round(j.daily.temperature_2m_min[0]),
  };
}

export type MarineNow = {
  waveHeight: number | null;
  wavePeriod: number | null;
  waveDirection: number | null;
  seaTemperature: number | null;
};

// Un solo punto di riferimento al largo del golfo: le condizioni del mare
// non cambiano in modo apprezzabile tra Diano Marina, San Bartolomeo al
// Mare e Cervo (pochi km di costa), quindi non serve legarle al comune
// selezionato nel meteo.
const GOLFO_MARINE_POINT = { lat: 43.895, lon: 8.11 };

export async function fetchMarine(): Promise<MarineNow> {
  const { lat, lon } = GOLFO_MARINE_POINT;
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_period,wave_direction,sea_surface_temperature&timezone=Europe%2FRome`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("marine fetch failed");
  const j = await res.json();
  const waveHeight = j.current?.wave_height;
  const wavePeriod = j.current?.wave_period;
  const waveDirection = j.current?.wave_direction;
  const seaTemperature = j.current?.sea_surface_temperature;
  return {
    waveHeight: typeof waveHeight === "number" ? waveHeight : null,
    wavePeriod: typeof wavePeriod === "number" ? wavePeriod : null,
    waveDirection: typeof waveDirection === "number" ? waveDirection : null,
    seaTemperature: typeof seaTemperature === "number" ? Math.round(seaTemperature * 10) / 10 : null,
  };
}

// Converte un angolo (0-360°) nel punto cardinale/intercardinale più vicino,
// nella forma abbreviata usata comunemente per vento e mare (es. "NO", "SE").
export function degreesToCompass(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  return dirs[Math.round(deg / 45) % 8];
}

export type BathingWater = {
  id: string;
  water_code: string;
  beach_name: string;
  comune: string;
  status: "compliant" | "non_compliant" | "unknown";
  last_sampled_on: string | null;
  source_url: string | null;
  notes: string | null;
  updated_at: string;
};

export type WaterAdvisory = {
  id: string;
  zone: string;
  comune: string;
  kind: "planned" | "outage" | "works";
  description: string | null;
  expected_restore_at: string | null;
  published_at: string;
  is_active: boolean;
  source_url: string | null;
};

export type BikePath = {
  id: string;
  segment: string;
  status: "open" | "works" | "closed";
  message_it: string | null;
  message_en: string | null;
  updated_at: string;
};

export async function fetchBathingWater() {
  const { data, error } = await supabase.from("bathing_water").select("*").order("beach_name").limit(20);
  if (error) throw error;
  return (data ?? []) as unknown as BathingWater[];
}

export async function fetchWaterAdvisories() {
  const { data, error } = await supabase
    .from("water_advisories")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as WaterAdvisory[];
}

export async function fetchBikePath() {
  const { data, error } = await supabase
    .from("bike_path_status")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return (data ?? []) as unknown as BikePath[];
}

export type BikeSegment = {
  id: number;
  da: string;
  a: string;
  ordine: number;
  stato: "open" | "closed";
  nota: string | null;
};

export async function fetchBikeSegments() {
  const { data, error } = await supabase
    .from("tratti_ciclabile")
    .select("*")
    .order("ordine", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as BikeSegment[];
}


export const ARPAL_URL =
  "https://www.arpal.liguria.it/tematiche/mare/balneabilita.html?ANNO=2026&CODICE_ACQUA=IT007008027A001&PROVINCIA=Imperia&COMUNE=Diano+Marina";

export type Avviso = {
  id: string;
  fonte: string;
  comune: string;
  titolo: string;
  testo_breve: string | null;
  url: string;
  data_pubblicazione: string | null;
  categoria: string | null;
  fetched_at: string;
  comuni_citati: string[] | null;
  data_intervento: string | null;
  /** Set by the scraper when the publication date could not be parsed reliably. */
  necessita_revisione?: boolean | null;
};

/** Source label written by the Rivieracqua scraper. Routing is by source, never by keywords. */
export const FONTE_RIVIERACQUA = "Rivieracqua";

/** The three towns of the Golfo Dianese used to scope Rivieracqua notices. */
export const GOLFO_COMUNI = ["Diano Marina", "San Bartolomeo al Mare", "Cervo"] as const;

export function golfoComuniOf(a: Avviso): string[] {
  const cited = a.comuni_citati ?? [];
  return GOLFO_COMUNI.filter((c) => cited.includes(c));
}

/** Notices older than one month are not shown (and are purged server-side). */
export const AVVISO_MAX_AGE_MS = 31 * 24 * 60 * 60 * 1000;

/** Real publication time, or null when the date is unknown. Never guessed. */
export function avvisoDate(a: Avviso): number | null {
  if (!a.data_pubblicazione) return null;
  const t = new Date(a.data_pubblicazione).getTime();
  return Number.isNaN(t) ? null : t;
}

export function dataNonRilevata(a: Avviso): boolean {
  return avvisoDate(a) === null;
}

/**
 * Chronological order, newest first. Notices without a reliable date are never
 * mixed into the ranking: they always sink to the bottom.
 */
export function byDataDesc(a: Avviso, b: Avviso): number {
  const da = avvisoDate(a);
  const db = avvisoDate(b);
  if (da === null && db === null) return a.titolo.localeCompare(b.titolo);
  if (da === null) return 1;
  if (db === null) return -1;
  return db - da;
}

export function isRecente(a: Avviso, now = Date.now()): boolean {
  const d = avvisoDate(a);
  // Undated notices use the fetch time only for retention, never for ordering.
  const ref = d ?? new Date(a.fetched_at).getTime();
  return now - ref <= AVVISO_MAX_AGE_MS;
}

/** Rivieracqua notices that mention at least one town of the gulf. */
export function rivieracquaAvvisi(avvisi: Avviso[]): Avviso[] {
  return avvisi
    .filter((a) => a.fonte === FONTE_RIVIERACQUA && golfoComuniOf(a).length > 0 && isRecente(a))
    .sort(byDataDesc);
}

/** Town-council notices only: Rivieracqua never appears in the Comuni section. */
export function comuneAvvisi(avvisi: Avviso[], comune: string): Avviso[] {
  return avvisi
    .filter((a) => a.fonte !== FONTE_RIVIERACQUA && a.comune === comune && isRecente(a))
    .sort(byDataDesc);
}

export async function fetchAvvisi() {
  const { data, error } = await supabase
    .from("avvisi")
    .select("*")
    .order("data_pubblicazione", { ascending: false, nullsFirst: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as Avviso[];
}

export type BalneazionePoint = {
  codice_acqua: string;
  comune: string;
  nome_punto: string;
  ordine_costa: number;
  stato: "compliant" | "non_compliant" | "unknown";
  stato_raw: string | null;
  classificazione: string | null;
  motivo: string | null;
  anno: number | null;
  data_ultimo_controllo: string | null;
  source_url: string | null;
  fetched_at: string | null;
};

export async function fetchBalneazione(): Promise<BalneazionePoint[]> {
  const [punti, stati] = await Promise.all([
    supabase
      .from("punti_balneazione")
      .select("codice_acqua, comune, nome_punto, ordine_costa")
      .order("ordine_costa", { ascending: true }),
    supabase.from("balneazione_stato").select("*"),
  ]);
  if (punti.error) throw punti.error;
  if (stati.error) throw stati.error;
  const byCode = new Map(
    (stati.data ?? []).map((s) => [(s as { codice_acqua: string }).codice_acqua, s]),
  );
  return (punti.data ?? []).map((row) => {
    const s = byCode.get(row.codice_acqua) as Record<string, unknown> | undefined;
    return {
      codice_acqua: row.codice_acqua,
      comune: row.comune,
      nome_punto: row.nome_punto,
      ordine_costa: row.ordine_costa,
      stato: ((s?.stato as string) ?? "unknown") as BalneazionePoint["stato"],
      stato_raw: (s?.stato_raw as string) ?? null,
      classificazione: (s?.classificazione as string) ?? null,
      motivo: (s?.motivo as string) ?? null,
      anno: (s?.anno as number) ?? null,
      data_ultimo_controllo: (s?.data_ultimo_controllo as string) ?? null,
      source_url: (s?.source_url as string) ?? null,
      fetched_at: (s?.fetched_at as string) ?? null,
    };
  });
}

export type FonteStato = {
  fonte: string;
  ok: boolean;
  error: string | null;
  items: number;
  last_success_at: string | null;
  fetched_at: string;
  fail_streak?: number;
  /** Coherence warning raised by a refresh job (shown in the admin panel). */
  anomalia?: string | null;
};

/** A source is considered stale after 3 consecutive failed runs. */
export const STALE_AFTER_FAILURES = 3;

export function fonteOf(fonti: FonteStato[] | undefined, fonte: string): FonteStato | undefined {
  return (fonti ?? []).find((f) => f.fonte === fonte);
}

/** Aggregates several sources into one freshness signal for a card. */
export function freshnessOf(fonti: FonteStato[] | undefined, fonti_names: string[]) {
  const rows = (fonti ?? []).filter((f) => fonti_names.includes(f.fonte));
  const lastSuccessAt = rows
    .map((r) => r.last_success_at)
    .filter((v): v is string => Boolean(v))
    .sort()
    .at(-1) ?? null;
  const failStreak = rows.reduce((max, r) => Math.max(max, r.fail_streak ?? 0), 0);
  return { lastSuccessAt, failStreak, rows };
}

export async function fetchFontiStato() {
  const { data, error } = await supabase.from("fonti_stato").select("*");
  if (error) throw error;
  return (data ?? []) as unknown as FonteStato[];
}

/** Bathing season in Liguria: April → September. */
export function isBathingSeason(d = new Date()): boolean {
  const m = d.getMonth() + 1;
  return m >= 4 && m <= 9;
}

const WEATHER_TEXT: Record<string, Record<string, string>> = {
  clear: { it: "Sereno", en: "Clear", fr: "Dégagé", de: "Klar" },
  mainlyClear: { it: "Poco nuvoloso", en: "Mainly clear", fr: "Peu nuageux", de: "Heiter" },
  cloudy: { it: "Nuvoloso", en: "Cloudy", fr: "Nuageux", de: "Bewölkt" },
  fog: { it: "Nebbia", en: "Fog", fr: "Brouillard", de: "Nebel" },
  drizzle: { it: "Pioviggine", en: "Drizzle", fr: "Bruine", de: "Nieselregen" },
  rain: { it: "Pioggia", en: "Rain", fr: "Pluie", de: "Regen" },
  heavyRain: { it: "Pioggia forte", en: "Heavy rain", fr: "Forte pluie", de: "Starkregen" },
  snow: { it: "Neve", en: "Snow", fr: "Neige", de: "Schnee" },
  showers: { it: "Rovesci", en: "Showers", fr: "Averses", de: "Schauer" },
  thunder: { it: "Temporale", en: "Thunderstorm", fr: "Orage", de: "Gewitter" },
};

function weatherKey(code: number): string {
  if (code === 0) return "clear";
  if (code <= 2) return "mainlyClear";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code >= 61 && code <= 63) return "rain";
  if (code === 65 || code === 67) return "heavyRain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 80 && code <= 82) return "showers";
  if (code >= 95) return "thunder";
  return "cloudy";
}

export function weatherDescription(code: number, lang: string): string {
  const entry = WEATHER_TEXT[weatherKey(code)];
  return entry[lang] ?? entry.en;
}
