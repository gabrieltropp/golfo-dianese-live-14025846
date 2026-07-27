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

export type WeatherNow = {
  temperature: number;
  wind: number;
  code: number;
  maxToday: number;
  minToday: number;
};

export async function fetchWeather(lat: number, lon: number): Promise<WeatherNow> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FRome&forecast_days=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("weather fetch failed");
  const j = await res.json();
  return {
    temperature: Math.round(j.current.temperature_2m),
    wind: Math.round(j.current.wind_speed_10m),
    code: j.current.weather_code,
    maxToday: Math.round(j.daily.temperature_2m_max[0]),
    minToday: Math.round(j.daily.temperature_2m_min[0]),
  };
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

export const ARPAL_URL =
  "https://www.arpal.liguria.it/tematiche/mare/balneabilita.html?ANNO=2026&CODICE_ACQUA=IT007008027A001&PROVINCIA=Imperia&COMUNE=Diano+Marina";
