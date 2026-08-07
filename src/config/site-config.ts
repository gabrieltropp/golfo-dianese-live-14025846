/**
 * ============================================================
 *  DOCUMENTO DI CONFIGURAZIONE — Golfo Dianese Live
 * ============================================================
 *  Questo è l'UNICO file da modificare per cambiare:
 *    1) COLORI del sito           -> `colori`
 *    2) LOGHI e immagini          -> `loghi`
 *    3) TESTI in tutte le lingue  -> `testi`
 *    4) VERIFICA UMANA del login  -> `verificaUmana`
 *
 *  Regole rapide:
 *  - I colori accettano qualsiasi valore CSS valido: "#0b2b4a",
 *    "oklch(0.26 0.072 250)", "rgb(11 43 74)". Lascia "" per
 *    mantenere il valore predefinito del tema.
 *  - I testi sovrascrivono le traduzioni predefinite: scrivi solo
 *    le chiavi che vuoi cambiare, per la lingua che vuoi cambiare.
 *  - Dopo il salvataggio le modifiche sono immediate: non serve
 *    toccare nessun altro file.
 * ============================================================
 */

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

/** Chiavi di traduzione -> testo. Vedi src/lib/i18n.tsx per l'elenco completo delle chiavi. */
export type TextOverrides = Partial<Record<"it" | "en" | "fr" | "de", Record<string, string>>>;

export const siteConfig = {
  /* ---------------------------------------------------------
   * 1) COLORI — lascia "" per usare il valore predefinito
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
   * 2) LOGHI — usa un percorso in /public o un URL completo
   * ------------------------------------------------------- */
  loghi: {
    header: "/icons/icon-512.png",
    headerAlt: "Golfo Dianese Live",
    login: "/icons/icon-512.png",
  } satisfies SiteLogos,

  /* ---------------------------------------------------------
   * 3) TESTI — sovrascrivono le traduzioni predefinite.
   *    Esempio:
   *      it: { "app.subtitle": "Il golfo in tempo reale" },
   *      en: { "app.subtitle": "The gulf in real time" },
   * ------------------------------------------------------- */
  testi: {
    it: {},
    en: {},
    fr: {},
    de: {},
  } satisfies TextOverrides,

  /* ---------------------------------------------------------
   * 4) VERIFICA UMANA del login (somma matematica)
   * ------------------------------------------------------- */
  verificaUmana: {
    /** Valore minimo/massimo degli addendi generati */
    minimo: 1,
    massimo: 9,
    /** Quanti addendi sommare (2 = "3 + 5") */
    addendi: 2,
  },
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

/** CSS generato dai colori configurati (solo quelli valorizzati). */
export function siteColorCss(): string {
  const decls = (Object.keys(COLOR_VAR_MAP) as (keyof SiteColors)[])
    .flatMap((key) => {
      const value = siteConfig.colori[key]?.trim();
      if (!value) return [];
      return COLOR_VAR_MAP[key].map((cssVar) => `${cssVar}: ${value};`);
    })
    .join("\n  ");
  return decls ? `:root {\n  ${decls}\n}` : "";
}