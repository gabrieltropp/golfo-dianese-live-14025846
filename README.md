# Golfo Dianese Live

Crea una web app mobile-first chiamata "Golfo Dianese Live": un cruscotto informativo in tempo reale per turisti e residenti di Diano Marina (Liguria, Italia) durante la stagione estiva. L'obiettivo è dare in un colpo d'occhio lo stato di 4 servizi essenziali, con un linguaggio semplice adatto anche a turisti stranieri.

Struttura della home

Una griglia di 4 card cliccabili, stile "semaforo": ogni card ha un colore di stato immediato (verde/giallo/arancione/rosso) e un'icona grande. Al tap/click, la card si espande mostrando il dettaglio. Layout a colonna singola su mobile, griglia 2x2 su desktop/tablet.

Card 1 — Meteo e Allerta

Mostra lo stato di allerta Protezione Civile per il Comune di Diano Marina (e possibilità di cambiare comune tra Diano Marina, Diano Castello, Diano San Pietro, Diano Arentino, San Bartolomeo al Mare, Cervo, Imperia)

Badge colorato: Verde / Giallo / Arancione / Rosso, con etichetta testuale (es. "Nessuna allerta", "Criticità ordinaria")

Dettaglio per tipologia di rischio: idraulico, idrogeologico, temporali — sia per "oggi" che "domani"

Fonte dati: integra la API REST pubblica e gratuita di allertameteo.app (nessuna chiave richiesta). Endpoint principale: GET https://allertameteo.app/api/alert/{comune} (slug in minuscolo, es. "diano-marina"). La risposta è JSON con struttura: data.oggi.allerta.colore, data.oggi.allerta.descrizione, data.oggi.dettagli.idraulico/temporali/idrogeologico, e lo stesso per data.domani. Verifica lo slug esatto del comune chiamando prima GET /api/comuni?provincia=imperia se necessario.

Aggiungi anche temperatura attuale e previsione breve (puoi usare un servizio meteo generico tipo Open-Meteo, gratuito e senza chiave, per lat/long di Diano Marina 43.9098, 8.0847)

Card 2 — Balneabilità

Stato di balneabilità del punto di monitoraggio ARPAL di Diano Marina (codice acqua IT007008027A001)

Badge: Conforme (verde) / Non conforme (rosso) / Dato non disponibile (grigio)

Testo esplicativo semplice per turisti: cosa significa "conforme", quando viene aggiornato il dato (il monitoraggio ARPAL è mensile per legge durante la stagione balneare, non giornaliero — comunicalo chiaramente per gestire le aspettative)

Per il prototipo: poiché ARPAL non espone una API pubblica diretta, usa dati di esempio/placeholder editabili da un pannello admin semplice (vedi sezione Backend), con un campo "ultimo aggiornamento" e un link diretto alla pagina ufficiale ARPAL per approfondimento: https://www.arpal.liguria.it/tematiche/mare/balneabilita.html?ANNO=2026&CODICE_ACQUA=IT007008027A001&PROVINCIA=Imperia&COMUNE=Diano+Marina

Card 3 — Acqua Potabile

Elenco cronologico di avvisi attivi: guasti, interruzioni programmate, lavori in corso sulla rete idrica

Ogni avviso mostra: zona/via interessata, tipo di intervento, orario previsto di ripristino, data pubblicazione

Badge card: Verde (nessun avviso attivo) / Giallo (lavori programmati) / Rosso (interruzione in corso)

Per il prototipo: usa un pannello admin semplice per inserire/rimuovere avvisi manualmente (in produzione andrà collegato a un feed RSS o scraper del sito del gestore idrico Rivieracqua — predisponi la struttura dati in modo che sia facile collegare una fonte automatica in futuro senza rifare il frontend)

Card 4 — Mobilità

Due sotto-sezioni chiare, non fonderle in un unico dato:

Traffico veicolare: incorpora una mappa con il layer traffico di Google Maps (iframe embed) centrata su Diano Marina, mostra congestione in tempo reale sulla viabilità principale (Aurelia, uscite autostradali)

Percorso ciclabile: NON mostrare "traffico ciclabile" in tempo reale (non esiste un dato di conteggio per una città di queste dimensioni). Mostra invece lo stato della pista ciclabile (l'ex sede ferroviaria) con eventuali chiusure/lavori come avviso testuale semplice, aggiornabile da admin, più una mappa statica del percorso

Design

Palette: blu mare profondo come colore primario, azzurro cielo come accento, corallo/arancione caldo per gli stati di allerta — evita di riciclare palette aziendali private, questo è un prodotto pubblico/civico

Tipografia grande e leggibile, alto contrasto (deve essere leggibile all'aperto, sotto il sole, da telefono)

Icone semplici e universali (evita testo dove un'icona basta, pensa a un turista che non parla italiano)

Deve funzionare bene come PWA installabile ("Aggiungi a schermata Home")

Nessun login richiesto per l'uso base — è un servizio informativo pubblico

Multilingua

Predisponi la struttura testi per 4 lingue: Italiano, Inglese, Francese, Tedesco (i turisti prevalenti sulla riviera ligure). Per il prototipo puoi partire con IT/EN completi e le altre due come struttura pronta da popolare.

Backend / dati

Usa Supabase per: storicizzare gli avvisi (acqua, ciclabile), gestire un pannello admin minimale (protetto da login semplice) per inserire/aggiornare balneabilità e avvisi manualmente

La chiamata all'API meteo (allertameteo.app) può essere fatta lato client, è pubblica e senza chiave

Predisponi la struttura dati in modo modulare, così in una fase 2 sarà possibile collegare uno scraper automatico (es. una Edge Function schedulata) per i dati di Rivieracqua e ARPAL senza dover rifare l'interfaccia

Footer

Disclaimer chiaro: "Dati aggregati da fonti ufficiali (Protezione Civile, ARPAL Liguria, Rivieracqua). Servizio informativo indipendente, non sostituisce i canali ufficiali di allerta." Con link alle fonti originali.

Scope del prototipo (fase 1)

Concentrati solo su Diano Marina e i comuni limitrofi del Golfo Dianese. Non serve copertura nazionale o multi-regione: è pensato per essere presentato come proof-of-concept a un ente locale (Comune o consorzio turistico), non come app consumer di massa.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://golfo-dianese-live.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cec822f0-e787-44f4-b339-140b77eee89b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
