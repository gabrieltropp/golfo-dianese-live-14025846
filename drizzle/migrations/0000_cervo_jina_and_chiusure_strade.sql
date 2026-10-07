CREATE OR REPLACE FUNCTION public.refresh_avvisi()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  now_ts timestamptz := now();
  html text;
  report jsonb := '{}'::jsonb;
  n int;
  mesi text[] := ARRAY['gennaio','febbraio','marzo','aprile','maggio','giugno',
                        'luglio','agosto','settembre','ottobre','novembre','dicembre'];
  mi int;
  rec record;
  data_pub timestamptz;
BEGIN
  PERFORM http_set_curlopt('CURLOPT_CONNECTTIMEOUT', '15');
  PERFORM http_set_curlopt('CURLOPT_TIMEOUT', '25');

  -- ===== Comune di Diano Marina =====
  BEGIN
    n := 0;
    html := (http_get('https://www.comune.dianomarina.im.it/novita/news')).content;
    FOR rec IN
      SELECT t.href, t.titolo, d.data_raw
      FROM (
        SELECT row_number() OVER () rn, m[1] AS href, trim(m[2]) AS titolo
        FROM regexp_matches(
          html,
          '<h[34][^>]*class="[^"]*card-title[^"]*"[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>\s*([^<]+?)\s*</a>',
          'gi'
        ) m
      ) t
      FULL JOIN (
        SELECT row_number() OVER () rn, m[1] AS data_raw
        FROM regexp_matches(
          html,
          'time-created-news-list[^"]*"[^>]*>\s*([0-9]{1,2}\s+[A-Za-zÀ-ù]+\s+[0-9]{4})',
          'gi'
        ) m
      ) d USING (rn)
      WHERE t.href IS NOT NULL
    LOOP
      data_pub := NULL;
      IF rec.data_raw IS NOT NULL THEN
        mi := array_position(mesi, lower(split_part(trim(rec.data_raw), ' ', 2)));
        IF mi IS NOT NULL THEN
          data_pub := make_timestamptz(
            split_part(trim(rec.data_raw), ' ', 3)::int, mi,
            split_part(trim(rec.data_raw), ' ', 1)::int, 0, 0, 0);
        END IF;
      END IF;
      INSERT INTO public.avvisi (fonte, comune, titolo, testo_breve, url, data_pubblicazione, categoria, fetched_at, necessita_revisione)
      VALUES ('Comune di Diano Marina', 'Diano Marina', rec.titolo, NULL,
              CASE WHEN rec.href LIKE 'http%' THEN rec.href ELSE 'https://www.comune.dianomarina.im.it' || rec.href END,
              data_pub, 'Notizia', now_ts, data_pub IS NULL)
      ON CONFLICT (url) DO UPDATE
        SET titolo = excluded.titolo, data_pubblicazione = excluded.data_pubblicazione,
            fetched_at = excluded.fetched_at, necessita_revisione = excluded.necessita_revisione;
      n := n + 1;
    END LOOP;
    report := report || jsonb_build_object('Comune di Diano Marina', jsonb_build_object('ok', true, 'items', n));
    INSERT INTO public.fonti_stato (fonte, ok, error, items, last_success_at, fetched_at, fail_streak)
    VALUES ('Comune di Diano Marina', true, null, n, now_ts, now_ts, 0)
    ON CONFLICT (fonte) DO UPDATE SET ok=true, error=null, items=n, last_success_at=now_ts, fetched_at=now_ts, fail_streak=0;
  EXCEPTION WHEN OTHERS THEN
    report := report || jsonb_build_object('Comune di Diano Marina', jsonb_build_object('ok', false, 'error', sqlerrm));
    INSERT INTO public.fonti_stato (fonte, ok, error, items, fetched_at, fail_streak)
    VALUES ('Comune di Diano Marina', false, sqlerrm, 0, now_ts, 1)
    ON CONFLICT (fonte) DO UPDATE SET ok=false, error=sqlerrm, fetched_at=now_ts, fail_streak=fonti_stato.fail_streak+1;
  END;

  -- ===== Comune di San Bartolomeo al Mare =====
  BEGIN
    n := 0;
    html := (http_get('https://www.comune.sanbartolomeoalmare.im.it/novita/')).content;
    FOR rec IN
      SELECT t.href, t.titolo, d.data_raw
      FROM (
        SELECT row_number() OVER () rn, m[1] AS href, trim(m[2]) AS titolo
        FROM regexp_matches(
          html,
          '<a[^>]+href="([^"]*/novita/[^"]+)"[^>]*>\s*<h3[^>]*class="[^"]*card-title[^"]*"[^>]*>\s*([^<]+?)\s*</h3>',
          'gi'
        ) m
      ) t
      FULL JOIN (
        SELECT row_number() OVER () rn, m[1] AS data_raw
        FROM regexp_matches(html, '<span[^>]*class="[^"]*\bdata\b[^"]*"[^>]*>\s*([^<]+)</span>', 'gi') m
      ) d USING (rn)
      WHERE t.href IS NOT NULL
    LOOP
      data_pub := NULL;
      IF rec.data_raw IS NOT NULL THEN
        mi := array_position(mesi, lower(split_part(trim(rec.data_raw), ' ', 2)));
        IF mi IS NOT NULL THEN
          data_pub := make_timestamptz(
            split_part(trim(rec.data_raw), ' ', 3)::int, mi,
            split_part(trim(rec.data_raw), ' ', 1)::int, 0, 0, 0);
        END IF;
      END IF;
      INSERT INTO public.avvisi (fonte, comune, titolo, testo_breve, url, data_pubblicazione, categoria, fetched_at, necessita_revisione)
      VALUES ('Comune di San Bartolomeo al Mare', 'San Bartolomeo al Mare', rec.titolo, NULL,
              CASE WHEN rec.href LIKE 'http%' THEN rec.href ELSE 'https://www.comune.sanbartolomeoalmare.im.it' || rec.href END,
              data_pub, 'Notizia', now_ts, data_pub IS NULL)
      ON CONFLICT (url) DO UPDATE
        SET titolo = excluded.titolo, data_pubblicazione = excluded.data_pubblicazione,
            fetched_at = excluded.fetched_at, necessita_revisione = excluded.necessita_revisione;
      n := n + 1;
    END LOOP;
    report := report || jsonb_build_object('Comune di San Bartolomeo al Mare', jsonb_build_object('ok', true, 'items', n));
    INSERT INTO public.fonti_stato (fonte, ok, error, items, last_success_at, fetched_at, fail_streak)
    VALUES ('Comune di San Bartolomeo al Mare', true, null, n, now_ts, now_ts, 0)
    ON CONFLICT (fonte) DO UPDATE SET ok=true, error=null, items=n, last_success_at=now_ts, fetched_at=now_ts, fail_streak=0;
  EXCEPTION WHEN OTHERS THEN
    report := report || jsonb_build_object('Comune di San Bartolomeo al Mare', jsonb_build_object('ok', false, 'error', sqlerrm));
    INSERT INTO public.fonti_stato (fonte, ok, error, items, fetched_at, fail_streak)
    VALUES ('Comune di San Bartolomeo al Mare', false, sqlerrm, 0, now_ts, 1)
    ON CONFLICT (fonte) DO UPDATE SET ok=false, error=sqlerrm, fetched_at=now_ts, fail_streak=fonti_stato.fail_streak+1;
  END;

  -- ===== Comune di Cervo (via lettore testuale: il sito blocca il server) =====
  BEGIN
    n := 0;
    html := (http((
      'GET',
      'https://r.jina.ai/https://www.comune.cervo.im.it/home/novita.html',
      ARRAY[http_header('User-Agent','Mozilla/5.0 GolfoDianeseLive')],
      NULL, NULL
    )::http_request)).content;
    FOR rec IN
      SELECT DISTINCT ON (m[6]) m[1] AS cat, m[2]::int AS gg, lower(m[3]) AS mese, m[4]::int AS anno,
             trim(m[5]) AS titolo, m[6] AS href, nullif(trim(m[7]),'') AS testo
      FROM regexp_matches(
        html,
        '(Avviso|Notizia|Comunicato|Ordinanza|Evento|Bando)\s+(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})[^\n]*\n\s*\n###\s*\[([^\]]+)\]\((https://www\.comune\.cervo\.im\.it/notizie/[^)\s]+)\)\s*\n\s*\n([^\n]*)',
        'g'
      ) m
    LOOP
      mi := array_position(mesi, rec.mese);
      data_pub := CASE WHEN mi IS NULL THEN NULL
                  ELSE make_timestamptz(rec.anno, mi, rec.gg, 12, 0, 0, 'Europe/Rome') END;
      INSERT INTO public.avvisi (fonte, comune, titolo, testo_breve, url, data_pubblicazione, categoria, fetched_at, necessita_revisione)
      VALUES ('Comune di Cervo', 'Cervo', rec.titolo, left(rec.testo, 400), rec.href,
              data_pub, rec.cat, now_ts, data_pub IS NULL)
      ON CONFLICT (url) DO UPDATE
        SET titolo = excluded.titolo, testo_breve = excluded.testo_breve,
            data_pubblicazione = excluded.data_pubblicazione,
            necessita_revisione = excluded.necessita_revisione, fetched_at = excluded.fetched_at;
      n := n + 1;
    END LOOP;
    IF n = 0 THEN RAISE EXCEPTION 'Cervo: nessun avviso riconosciuto nella pagina'; END IF;
    report := report || jsonb_build_object('Comune di Cervo', jsonb_build_object('ok', true, 'items', n));
    INSERT INTO public.fonti_stato (fonte, ok, error, items, last_success_at, fetched_at, fail_streak)
    VALUES ('Comune di Cervo', true, null, n, now_ts, now_ts, 0)
    ON CONFLICT (fonte) DO UPDATE SET ok=true, error=null, items=n, last_success_at=now_ts, fetched_at=now_ts, fail_streak=0;
  EXCEPTION WHEN OTHERS THEN
    report := report || jsonb_build_object('Comune di Cervo', jsonb_build_object('ok', false, 'error', sqlerrm));
    INSERT INTO public.fonti_stato (fonte, ok, error, items, fetched_at, fail_streak)
    VALUES ('Comune di Cervo', false, sqlerrm, 0, now_ts, 1)
    ON CONFLICT (fonte) DO UPDATE SET ok=false, error=sqlerrm, fetched_at=now_ts, fail_streak=fonti_stato.fail_streak+1;
  END;

  -- ===== Rivieracqua =====
  BEGIN
    n := 0;
    html := (http_get('https://rivieracqua.it/category/avvisi/')).content;
    FOR rec IN
      SELECT h.href, ti.titolo, ex.excerpt
      FROM (
        SELECT row_number() OVER () rn, m[1] AS href
        FROM regexp_matches(html, '<a href="(https://rivieracqua\.it/[^"]+)"\s+class="plain">', 'gi') m
      ) h
      JOIN (
        SELECT row_number() OVER () rn, trim(m[1]) AS titolo
        FROM regexp_matches(html, '<h5[^>]*class="[^"]*post-title[^"]*"[^>]*>\s*([^<]+?)\s*</h5>', 'gi') m
      ) ti USING (rn)
      LEFT JOIN (
        SELECT row_number() OVER () rn, trim(m[1]) AS excerpt
        FROM regexp_matches(html, 'from_the_blog_excerpt[^"]*"[^>]*>\s*([^<]+?)\s*</p>', 'gi') m
      ) ex USING (rn)
      LIMIT 15
    LOOP
      data_pub := NULL;
      DECLARE
        dm text[];
      BEGIN
        dm := regexp_match(rec.titolo, '^(\d{1,2})\.(\d{1,2})\.(\d{2,4})');
        IF dm IS NOT NULL THEN
          data_pub := make_timestamptz(
            CASE WHEN length(dm[3]) = 2 THEN 2000 + dm[3]::int ELSE dm[3]::int END,
            dm[2]::int, dm[1]::int, 0, 0, 0);
        END IF;
      END;
      INSERT INTO public.avvisi (fonte, comune, titolo, testo_breve, url, data_pubblicazione, categoria, fetched_at, necessita_revisione, comuni_citati)
      VALUES (
        'Rivieracqua', 'Provincia di Imperia', rec.titolo, left(rec.excerpt, 400), rec.href,
        data_pub, 'Servizio idrico', now_ts, data_pub IS NULL,
        ARRAY(SELECT c FROM unnest(ARRAY['Diano Marina','San Bartolomeo al Mare','Cervo']) c
              WHERE (rec.titolo || ' ' || coalesce(rec.excerpt, '')) ILIKE '%' || c || '%')
      )
      ON CONFLICT (url) DO UPDATE
        SET titolo = excluded.titolo, testo_breve = excluded.testo_breve, data_pubblicazione = excluded.data_pubblicazione,
            fetched_at = excluded.fetched_at, necessita_revisione = excluded.necessita_revisione,
            comuni_citati = excluded.comuni_citati;
      n := n + 1;
    END LOOP;
    report := report || jsonb_build_object('Rivieracqua', jsonb_build_object('ok', true, 'items', n));
    INSERT INTO public.fonti_stato (fonte, ok, error, items, last_success_at, fetched_at, fail_streak)
    VALUES ('Rivieracqua', true, null, n, now_ts, now_ts, 0)
    ON CONFLICT (fonte) DO UPDATE SET ok=true, error=null, items=n, last_success_at=now_ts, fetched_at=now_ts, fail_streak=0;
  EXCEPTION WHEN OTHERS THEN
    report := report || jsonb_build_object('Rivieracqua', jsonb_build_object('ok', false, 'error', sqlerrm));
    INSERT INTO public.fonti_stato (fonte, ok, error, items, fetched_at, fail_streak)
    VALUES ('Rivieracqua', false, sqlerrm, 0, now_ts, 1)
    ON CONFLICT (fonte) DO UPDATE SET ok=false, error=sqlerrm, fetched_at=now_ts, fail_streak=fonti_stato.fail_streak+1;
  END;

  DELETE FROM public.avvisi WHERE data_pubblicazione < now_ts - interval '31 days';
  DELETE FROM public.avvisi WHERE data_pubblicazione IS NULL AND fetched_at < now_ts - interval '31 days';

  RETURN jsonb_build_object('ok', true, 'at', now_ts, 'report', report);
END;
$function$;

CREATE TABLE public.chiusure_strade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strada text NOT NULL,
  luogo text NOT NULL,
  data_inizio timestamptz NOT NULL,
  data_fine timestamptz,
  nota text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.chiusure_strade TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.chiusure_strade TO authenticated;
GRANT ALL ON public.chiusure_strade TO service_role;
ALTER TABLE public.chiusure_strade ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read chiusure" ON public.chiusure_strade FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage chiusure" ON public.chiusure_strade FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));