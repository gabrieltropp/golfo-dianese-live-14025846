import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const LANGUAGES = ["it", "en", "fr", "de"] as const;
export type Lang = (typeof LANGUAGES)[number];

type Dict = Record<string, string>;

const it: Dict = {
  "app.title": "Golfo Dianese Live",
  "app.subtitle": "Servizi essenziali in tempo reale",
  "app.updated": "Aggiornato",
  "app.tapDetail": "Tocca per il dettaglio",
  "app.close": "Chiudi",
  "app.loading": "Caricamento…",
  "app.error": "Dato non disponibile al momento",
  "app.admin": "Area riservata",
  "card.weather": "Meteo e Allerta",
  "card.bathing": "Balneabilità",
  "card.water": "Acqua potabile",
  "card.mobility": "Mobilità",
  "weather.comune": "Comune",
  "weather.today": "Oggi",
  "weather.tomorrow": "Domani",
  "weather.hydraulic": "Rischio idraulico",
  "weather.hydro": "Rischio idrogeologico",
  "weather.storms": "Temporali",
  "weather.temp": "Temperatura",
  "weather.wind": "Vento",
  "weather.bulletin": "Bollettino",
  "weather.source": "Fonte: Protezione Civile via allertameteo.app · Meteo: Open-Meteo",
  "bathing.compliant": "Acqua conforme",
  "bathing.nonCompliant": "Non conforme",
  "bathing.unknown": "Dato non disponibile",
  "bathing.explain":
    "«Conforme» significa che l'ultimo campione d'acqua analizzato rispetta i limiti di legge per la balneazione.",
  "bathing.frequency":
    "Attenzione: ARPAL analizza l'acqua circa una volta al mese durante la stagione balneare. Non è un dato giornaliero.",
  "bathing.lastSample": "Ultimo campionamento",
  "bathing.official": "Pagina ufficiale ARPAL",
  "bathing.point": "Punto di monitoraggio",
  "water.none": "Nessun avviso attivo",
  "water.planned": "Lavori programmati",
  "water.outage": "Interruzione in corso",
  "water.zone": "Zona / via",
  "water.restore": "Ripristino previsto",
  "water.published": "Pubblicato",
  "water.kind.planned": "Lavori programmati",
  "water.kind.outage": "Interruzione idrica",
  "water.kind.works": "Lavori in corso",
  "water.source": "Fonte: gestore idrico Rivieracqua (inserimento manuale in fase prototipo)",
  "mobility.traffic": "Traffico veicolare",
  "mobility.trafficHint": "Traffico in tempo reale su Aurelia e accessi al centro.",
  "mobility.bike": "Pista ciclabile",
  "mobility.bike.open": "Percorso aperto",
  "mobility.bike.works": "Lavori in corso",
  "mobility.bike.closed": "Tratto chiuso",
  "mobility.bikeNote":
    "Stato del percorso ciclopedonale sull'ex sede ferroviaria. Non vengono conteggiati i passaggi in tempo reale.",
  "footer.disclaimer":
    "Dati aggregati da fonti ufficiali (Protezione Civile, ARPAL Liguria, Rivieracqua). Servizio informativo indipendente, non sostituisce i canali ufficiali di allerta.",
  "footer.sources": "Fonti ufficiali",
  "admin.title": "Pannello amministratore",
  "admin.login": "Accedi",
  "admin.logout": "Esci",
  "admin.email": "Email",
  "admin.password": "Password",
  "admin.save": "Salva",
  "admin.add": "Aggiungi",
  "admin.delete": "Elimina",
  "admin.noAccess": "Questo account non ha i permessi di amministratore.",
  "admin.back": "Torna alla home",
  "card.webcam": "Webcam sul Golfo",
  "webcam.live": "Diretta",
  "webcam.note": "Immagini in diretta dal Golfo Dianese. Fonte: ipcamlive.",
  "card.comuni": "Comuni del Golfo Dianese",
  "comuni.subtitle": "Avvisi e informazioni per ogni comune",
  "comuni.noNotices": "Nessun avviso attivo",
  "comuni.notices": "Avvisi attivi",
  "mobility.route": "Percorso ciclabile Imperia → Andora",
  "mobility.routeOk": "Percorso percorribile",
  "mobility.routeBlocked": "Interruzione segnalata",
  "weather.conditions": "Condizioni attuali",
};

const en: Dict = {
  // placeholder-anchor
  "app.title": "Golfo Dianese Live",
  "app.subtitle": "Essential services at a glance",
  "app.updated": "Updated",
  "app.tapDetail": "Tap for details",
  "app.close": "Close",
  "app.loading": "Loading…",
  "app.error": "Data currently unavailable",
  "app.admin": "Admin area",
  "card.weather": "Weather & Alerts",
  "card.bathing": "Swimming water",
  "card.water": "Drinking water",
  "card.mobility": "Getting around",
  "weather.comune": "Town",
  "weather.today": "Today",
  "weather.tomorrow": "Tomorrow",
  "weather.hydraulic": "Flood risk",
  "weather.hydro": "Landslide risk",
  "weather.storms": "Thunderstorms",
  "weather.temp": "Temperature",
  "weather.wind": "Wind",
  "weather.bulletin": "Bulletin",
  "weather.source": "Source: Italian Civil Protection via allertameteo.app · Weather: Open-Meteo",
  "bathing.compliant": "Safe for swimming",
  "bathing.nonCompliant": "Not compliant",
  "bathing.unknown": "No data available",
  "bathing.explain":
    "“Compliant” means the last analysed water sample met the legal limits for bathing water.",
  "bathing.frequency":
    "Please note: ARPAL samples the water about once a month during the bathing season. This is not a daily measurement.",
  "bathing.lastSample": "Last sample",
  "bathing.official": "Official ARPAL page",
  "bathing.point": "Monitoring point",
  "water.none": "No active notice",
  "water.planned": "Planned works",
  "water.outage": "Supply interruption",
  "water.zone": "Area / street",
  "water.restore": "Expected back by",
  "water.published": "Published",
  "water.kind.planned": "Planned works",
  "water.kind.outage": "Water outage",
  "water.kind.works": "Works in progress",
  "water.source": "Source: Rivieracqua water utility (manually entered in this prototype)",
  "mobility.traffic": "Road traffic",
  "mobility.trafficHint": "Live congestion on the Aurelia road and town accesses.",
  "mobility.bike": "Cycle path",
  "mobility.bike.open": "Path open",
  "mobility.bike.works": "Works in progress",
  "mobility.bike.closed": "Section closed",
  "mobility.bikeNote":
    "Status of the seaside cycle path on the former railway line. Live cyclist counts are not measured.",
  "footer.disclaimer":
    "Data aggregated from official sources (Civil Protection, ARPAL Liguria, Rivieracqua). Independent information service — it does not replace official alert channels.",
  "footer.sources": "Official sources",
  "admin.title": "Admin panel",
  "admin.login": "Sign in",
  "admin.logout": "Sign out",
  "admin.email": "Email",
  "admin.password": "Password",
  "admin.save": "Save",
  "admin.add": "Add",
  "admin.delete": "Delete",
  "admin.noAccess": "This account has no administrator rights.",
  "admin.back": "Back to home",
  "card.webcam": "Webcam on the gulf",
  "webcam.live": "Live",
  "webcam.note": "Live images from the Golfo Dianese. Source: ipcamlive.",
  "card.comuni": "Towns of the Golfo Dianese",
  "comuni.subtitle": "Notices and info for each town",
  "comuni.noNotices": "No active notices",
  "comuni.notices": "Active notices",
  "mobility.route": "Cycle path Imperia → Andora",
  "mobility.routeOk": "Route open",
  "mobility.routeBlocked": "Interruption reported",
  "weather.conditions": "Current conditions",
};

// FR / DE: structure ready, partially populated. Missing keys fall back to EN.
const fr: Dict = {
  "app.subtitle": "Les services essentiels en un coup d'œil",
  "app.tapDetail": "Toucher pour le détail",
  "app.close": "Fermer",
  "app.loading": "Chargement…",
  "card.weather": "Météo et alertes",
  "card.bathing": "Eau de baignade",
  "card.water": "Eau potable",
  "card.mobility": "Se déplacer",
  "weather.today": "Aujourd'hui",
  "weather.tomorrow": "Demain",
  "weather.comune": "Commune",
  "bathing.compliant": "Baignade autorisée",
  "bathing.nonCompliant": "Non conforme",
  "bathing.unknown": "Donnée indisponible",
  "water.none": "Aucun avis en cours",
  "mobility.traffic": "Trafic routier",
  "mobility.bike": "Piste cyclable",
};

const de: Dict = {
  "app.subtitle": "Wichtige Dienste auf einen Blick",
  "app.tapDetail": "Für Details tippen",
  "app.close": "Schließen",
  "app.loading": "Wird geladen…",
  "card.weather": "Wetter & Warnungen",
  "card.bathing": "Badewasser",
  "card.water": "Trinkwasser",
  "card.mobility": "Unterwegs",
  "weather.today": "Heute",
  "weather.tomorrow": "Morgen",
  "weather.comune": "Gemeinde",
  "bathing.compliant": "Baden erlaubt",
  "bathing.nonCompliant": "Nicht konform",
  "bathing.unknown": "Keine Daten",
  "water.none": "Keine aktuellen Hinweise",
  "mobility.traffic": "Straßenverkehr",
  "mobility.bike": "Radweg",
};

const DICTS: Record<Lang, Dict> = { it, en, fr, de };

export const LANGUAGE_LABELS: Record<Lang, string> = { it: "IT", en: "EN", fr: "FR", de: "DE" };

type I18nValue = { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string };

const I18nContext = createContext<I18nValue>({ lang: "it", setLang: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("it");

  useEffect(() => {
    const stored = window.localStorage.getItem("gdl-lang") as Lang | null;
    if (stored && LANGUAGES.includes(stored)) {
      setLang(stored);
      return;
    }
    const nav = navigator.language.slice(0, 2) as Lang;
    if (LANGUAGES.includes(nav)) setLang(nav);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang: (l) => {
        setLang(l);
        window.localStorage.setItem("gdl-lang", l);
      },
      t: (key) => DICTS[lang][key] ?? en[key] ?? it[key] ?? key,
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}