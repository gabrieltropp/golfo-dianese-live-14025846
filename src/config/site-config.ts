/**
 * ============================================================
 *  DOCUMENTO DI CONFIGURAZIONE — Golfo Dianese Live
 * ============================================================
 *  UNICO file da modificare per cambiare:
 *    1) COLORI DI GRUPPO (semplice)  -> `temi`
 *    2) COLORI AVANZATI (opzionale)  -> `colori`
 *    3) LOGHI e immagini             -> `loghi`
 *    4) TESTI DELLE CARD (4 lingue)  -> `testiCards`
 *    5) ALTRI TESTI (avanzato)       -> `testi`
 *    6) VERIFICA UMANA del login     -> `verificaUmana`
 *
 *  Regole rapide:
 *  - Ogni colore accetta qualsiasi valore CSS: "#0b2b4a",
 *    "oklch(0.26 0.072 250)", "rgb(11 43 74)". Lascia "" per
 *    mantenere il valore predefinito del tema.
 *  - `temi` cambia più elementi insieme (es. il blu notte di
 *    card, header e footer con un solo valore).
 *  - `colori` sovrascrive `temi` per singolo elemento: usalo
 *    solo se serve un'eccezione.
 *  - Nei testi lascia "" per usare la traduzione predefinita.
 *  - Le modifiche sono immediate: nessun altro file da toccare.
 * ============================================================
 */

/* ============================================================
 * 1) COLORI DI GRUPPO — il modo più semplice per cambiare look
 * ========================================================== */
export type SiteThemeGroups = {
  /** Blu notte: sfondo pagina, card, header, footer, pannelli in vetro */
  bluNotte: string;
  /** Sabbia chiara: testo principale e testo dentro le card */
  sabbiaChiara: string;
  /** Accento caldo: bottoni, link, focus, dettagli corallo */
  accentoCaldo: string;
  /** Accento freddo: evidenziazioni positive (verde acqua) */
  accentoFreddo: string;
  /** Testo secondario e bordi (tonalità tenue) */
  dettagliTenui: string;
};

/* ============================================================
 * 2) COLORI AVANZATI — eccezioni sui singoli elementi
 * ========================================================== */
export type SiteColors = {
  /** Sfondo generale della pagina */
  sfondo: string;
  /** Colore del testo principale */
  testo: string;
  /** Colore d'accento principale (bottoni, link attivi) */
  primario: string;
  /** Testo sopra il colore primario */
  primarioTesto: string;
  /** Accento secondario (evidenziazioni positive) */
  accento: string;
  /** Colore dei pannelli/schede */
  scheda: string;
  /** Testo dentro le schede */
  schedaTesto: string;
  /** Testo secondario / didascalie */
  testoSecondario: string;
  /** Bordi */
  bordo: string;
  /** Stato OK (verde) */
  statoOk: string;
  /** Stato attenzione (giallo) */
  statoAttenzione: string;
  /** Stato allerta (arancio) */
  statoAllerta: string;
  /** Stato critico (rosso) */
  statoCritico: string;
  /** Stato non disponibile (grigio) */
  statoNonDisponibile: string;
  /** Blu profondo del mare (header, sfondo video) */
  mareProfondo: string;
  /** Sabbia calda (titoli su header) */
  sabbia: string;
  /** Corallo (accenti caldi) */
  corallo: string;
  /** Sfondo dei pannelli in vetro (glassmorphism) */
  vetroSfondo: string;
  /** Bordo dei pannelli in vetro */
  vetroBordo: string;
};

export type SiteLogos = {
  /** Logo nell'intestazione della home */
  header: string;
  /** Testo alternativo del logo (accessibilità) */
  headerAlt: string;
  /** Logo mostrato sopra il form di login in area riservata ("" = nessun logo) */
  login: string;
};

/** Testo nelle 4 lingue. "" = usa la traduzione predefinita. */
export type Testo4 = { it?: string; en?: string; fr?: string; de?: string };
/** Gruppo di testi di una card: chiave di traduzione -> testo nelle 4 lingue. */
export type GruppoTesti = Record<string, Testo4>;

/** Chiavi di traduzione -> testo. Vedi src/lib/i18n.tsx per l'elenco completo delle chiavi. */
export type TextOverrides = Partial<Record<"it" | "en" | "fr" | "de", Record<string, string>>>;

export const siteConfig = {
  /* ---------------------------------------------------------
   * 1) COLORI DI GRUPPO — un valore cambia più elementi
   * ------------------------------------------------------- */
  temi: {
    bluNotte: "",
    sabbiaChiara: "",
    accentoCaldo: "",
    accentoFreddo: "",
    dettagliTenui: "",
  } satisfies SiteThemeGroups,

  /* ---------------------------------------------------------
   * 2) COLORI AVANZATI — sovrascrivono i gruppi qui sopra
   * ------------------------------------------------------- */
  colori: {
    sfondo: "",
    testo: "",
    primario: "",
    primarioTesto: "",
    accento: "",
    scheda: "",
    schedaTesto: "",
    testoSecondario: "",
    bordo: "",
    statoOk: "",
    statoAttenzione: "",
    statoAllerta: "",
    statoCritico: "",
    statoNonDisponibile: "",
    mareProfondo: "",
    sabbia: "",
    corallo: "",
    vetroSfondo: "",
    vetroBordo: "",
  } satisfies SiteColors,

  /* ---------------------------------------------------------
   * 3) LOGHI — usa un percorso in /public o un URL completo
   * ------------------------------------------------------- */
  loghi: {
    header: "/icons/icon-512.png",
    headerAlt: "Golfo Dianese Live",
    login: "/icons/icon-512.png",
  } satisfies SiteLogos,

  /* ---------------------------------------------------------
   * 4) TESTI DELLE CARD — raggruppati per card, 4 lingue insieme
   *    Lascia "" per usare la traduzione predefinita.
   *    Esempio:
   *      titolo: { it: "Meteo", en: "Weather", fr: "Météo", de: "Wetter" }
   * ------------------------------------------------------- */
  testiCards: {
    /** Intestazione, sottotitolo e footer del sito */
    generale: {
      "app.title": { it: "", en: "", fr: "", de: "" },
      "app.subtitle": { it: "", en: "", fr: "", de: "" },
      "app.eyebrow": { it: "", en: "", fr: "", de: "" },
      "app.loading": { it: "", en: "", fr: "", de: "" },
      "app.error": { it: "", en: "", fr: "", de: "" },
      "footer.disclaimer": { it: "", en: "", fr: "", de: "" },
      "footer.sources": { it: "", en: "", fr: "", de: "" },
    } satisfies GruppoTesti,

    /** Card "Meteo e Allerta" */
    meteo: {
      "card.weather": { it: "", en: "", fr: "", de: "" },
      "weather.conditions": { it: "", en: "", fr: "", de: "" },
      "weather.temp": { it: "", en: "", fr: "", de: "" },
      "weather.wind": { it: "", en: "", fr: "", de: "" },
      "weather.bulletin": { it: "", en: "", fr: "", de: "" },
      "weather.source": { it: "", en: "", fr: "", de: "" },
    } satisfies GruppoTesti,

    /** Card "Balneabilità" */
    balneazione: {
      "card.bathing": { it: "", en: "", fr: "", de: "" },
      "bathing.explain": { it: "", en: "", fr: "", de: "" },
      "bathing.frequency": { it: "", en: "", fr: "", de: "" },
      "bathing.strip": { it: "", en: "", fr: "", de: "" },
      "bathing.lastSample": { it: "", en: "", fr: "", de: "" },
      "bathing.noData": { it: "", en: "", fr: "", de: "" },
      "bathing.official": { it: "", en: "", fr: "", de: "" },
    } satisfies GruppoTesti,

    /** Card "Acqua potabile" (avvisi Rivieracqua) */
    acqua: {
      "card.water": { it: "", en: "", fr: "", de: "" },
      "water.none": { it: "", en: "", fr: "", de: "" },
      "water.noneGolfo": { it: "", en: "", fr: "", de: "" },
      "water.intervention": { it: "", en: "", fr: "", de: "" },
      "water.involved": { it: "", en: "", fr: "", de: "" },
      "water.source": { it: "", en: "", fr: "", de: "" },
      "water.official": { it: "", en: "", fr: "", de: "" },
    } satisfies GruppoTesti,

    /** Card "Mobilità" (ciclabile + traffico) */
    mobilita: {
      "card.mobility": { it: "", en: "", fr: "", de: "" },
      "mobility.route": { it: "", en: "", fr: "", de: "" },
      "mobility.routeOk": { it: "", en: "", fr: "", de: "" },
      "mobility.routeBlocked": { it: "", en: "", fr: "", de: "" },
      "mobility.bikeNote": { it: "", en: "", fr: "", de: "" },
      "mobility.traffic": { it: "", en: "", fr: "", de: "" },
      "mobility.trafficHint": { it: "", en: "", fr: "", de: "" },
      "mobility.trafficArea": { it: "", en: "", fr: "", de: "" },
    } satisfies GruppoTesti,

    /** Card "Webcam sul Golfo" */
    webcam: {
      "card.webcam": { it: "", en: "", fr: "", de: "" },
      "webcam.live": { it: "", en: "", fr: "", de: "" },
      "webcam.note": { it: "", en: "", fr: "", de: "" },
    } satisfies GruppoTesti,

    /** Card "Comuni del Golfo Dianese" */
    comuni: {
      "card.comuni": { it: "", en: "", fr: "", de: "" },
      "comuni.subtitle": { it: "", en: "", fr: "", de: "" },
      "comuni.notices": { it: "", en: "", fr: "", de: "" },
      "comuni.noNotices": { it: "", en: "", fr: "", de: "" },
      "comuni.sourceUnavailable": { it: "", en: "", fr: "", de: "" },
      "comuni.sources": { it: "", en: "", fr: "", de: "" },
      "comuni.open": { it: "", en: "", fr: "", de: "" },
    } satisfies GruppoTesti,

    /** Card "Bacheca del golfo" (segnalazioni verificate) */
    bacheca: {
      "bacheca.title": { it: "", en: "", fr: "", de: "" },
      "bacheca.eyebrow": { it: "", en: "", fr: "", de: "" },
      "bacheca.subtitle": { it: "", en: "", fr: "", de: "" },
      "bacheca.empty": { it: "", en: "", fr: "", de: "" },
      "bacheca.count": { it: "", en: "", fr: "", de: "" },
      "report.verified": { it: "", en: "", fr: "", de: "" },
      "report.sourceLink": { it: "", en: "", fr: "", de: "" },
    } satisfies GruppoTesti,

    /** Modulo "Segnala qualcosa nel golfo" */
    segnalazioni: {
      "report.title": { it: "", en: "", fr: "", de: "" },
      "report.intro": { it: "", en: "", fr: "", de: "" },
      "report.comune": { it: "", en: "", fr: "", de: "" },
      "report.text": { it: "", en: "", fr: "", de: "" },
      "report.category": { it: "", en: "", fr: "", de: "" },
      "report.photo": { it: "", en: "", fr: "", de: "" },
      "report.contact": { it: "", en: "", fr: "", de: "" },
      "report.contactNote": { it: "", en: "", fr: "", de: "" },
      "report.send": { it: "", en: "", fr: "", de: "" },
      "report.ok": { it: "", en: "", fr: "", de: "" },
      "report.err": { it: "", en: "", fr: "", de: "" },
    } satisfies GruppoTesti,

    /** Area riservata / login */
    areaRiservata: {
      "app.admin": { it: "", en: "", fr: "", de: "" },
      "admin.title": { it: "", en: "", fr: "", de: "" },
      "admin.login": { it: "", en: "", fr: "", de: "" },
      "admin.human": { it: "", en: "", fr: "", de: "" },
      "admin.humanHint": { it: "", en: "", fr: "", de: "" },
      "admin.humanFail": { it: "", en: "", fr: "", de: "" },
    } satisfies GruppoTesti,
  },

  /* ---------------------------------------------------------
   * 5) ALTRI TESTI (avanzato) — per chiavi non elencate sopra.
   *    Sovrascrivono anche `testiCards`.
   *    Esempio: it: { "avviso.noDate": "Senza data" },
   * ------------------------------------------------------- */
  testi: {
    it: {},
    en: {},
    fr: {},
    de: {},
  } satisfies TextOverrides,

  /* ---------------------------------------------------------
   * 6) VERIFICA UMANA del login (somma matematica)
   * ------------------------------------------------------- */
  verificaUmana: {
    /** Valore minimo/massimo degli addendi generati */
    minimo: 1,
    massimo: 9,
    /** Quanti addendi sommare (2 = "3 + 5") */
    addendi: 2,
  },
};

/** Mappa gruppo di colore -> variabili CSS del tema. Non modificare. */
export const THEME_GROUP_VAR_MAP: Record<keyof SiteThemeGroups, string[]> = {
  bluNotte: ["--background", "--card", "--popover", "--sea-deep", "--glass-bg"],
  sabbiaChiara: ["--foreground", "--card-foreground", "--popover-foreground", "--sand"],
  accentoCaldo: ["--primary", "--ring", "--coral"],
  accentoFreddo: ["--accent"],
  dettagliTenui: ["--muted-foreground", "--border", "--input"],
};

/** Mappa colore configurabile -> variabile CSS del tema. Non modificare. */
export const COLOR_VAR_MAP: Record<keyof SiteColors, string[]> = {
  sfondo: ["--background"],
  testo: ["--foreground"],
  primario: ["--primary", "--ring"],
  primarioTesto: ["--primary-foreground"],
  accento: ["--accent"],
  scheda: ["--card", "--popover"],
  schedaTesto: ["--card-foreground", "--popover-foreground"],
  testoSecondario: ["--muted-foreground"],
  bordo: ["--border", "--input"],
  statoOk: ["--status-green"],
  statoAttenzione: ["--status-yellow"],
  statoAllerta: ["--status-orange"],
  statoCritico: ["--status-red", "--destructive"],
  statoNonDisponibile: ["--status-grey"],
  mareProfondo: ["--sea-deep"],
  sabbia: ["--sand"],
  corallo: ["--coral"],
  vetroSfondo: ["--glass-bg"],
  vetroBordo: ["--glass-border"],
};

/** CSS generato dai gruppi + dai colori avanzati (che hanno la precedenza). */
export function siteColorCss(): string {
  const vars = new Map<string, string>();

  for (const key of Object.keys(THEME_GROUP_VAR_MAP) as (keyof SiteThemeGroups)[]) {
    const value = siteConfig.temi[key]?.trim();
    if (!value) continue;
    for (const cssVar of THEME_GROUP_VAR_MAP[key]) {
      // I pannelli in vetro restano semi-trasparenti anche col colore di gruppo.
      vars.set(
        cssVar,
        cssVar === "--glass-bg" ? `color-mix(in oklab, ${value} 70%, transparent)` : value,
      );
    }
  }

  for (const key of Object.keys(COLOR_VAR_MAP) as (keyof SiteColors)[]) {
    const value = siteConfig.colori[key]?.trim();
    if (!value) continue;
    for (const cssVar of COLOR_VAR_MAP[key]) vars.set(cssVar, value);
  }

  const decls = [...vars].map(([k, v]) => `${k}: ${v};`).join("\n  ");
  return decls ? `:root {\n  ${decls}\n}` : "";
}

/** Override di testo per lingua, ricavati da `testiCards` + `testi`. Non modificare. */
export function textOverridesFor(lang: "it" | "en" | "fr" | "de"): Record<string, string> {
  const out: Record<string, string> = {};
  for (const gruppo of Object.values(siteConfig.testiCards) as GruppoTesti[]) {
    for (const [key, valori] of Object.entries(gruppo)) {
      const value = valori[lang]?.trim();
      if (value) out[key] = value;
    }
  }
  return { ...out, ...(siteConfig.testi[lang] ?? {}) };
}
