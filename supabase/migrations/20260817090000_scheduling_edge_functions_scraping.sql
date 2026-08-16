-- Programma l'esecuzione automatica delle Edge Function di scraping
-- (refresh-avvisi, refresh-balneazione), in sostituzione di qualsiasi
-- chiamata esterna alle vecchie route Cloudflare /api/public/hooks/...
-- che causavano l'errore "markAsUncloneable".

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Avvisi Comuni + Rivieracqua: ogni 30 minuti.
select cron.schedule(
  'refresh-avvisi-ogni-30-min',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := 'https://yclutqtzykyjypracnac.supabase.co/functions/v1/refresh-avvisi',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);

-- Balneabilità ARPAL: una volta al giorno, alle 6:00 UTC (7:00/8:00 in Italia
-- a seconda dell'ora legale) — sufficiente dato che ARPAL aggiorna i dati
-- con cadenza non oraria.
select cron.schedule(
  'refresh-balneazione-giornaliero',
  '0 6 * * *',
  $$
  select net.http_post(
    url := 'https://yclutqtzykyjypracnac.supabase.co/functions/v1/refresh-balneazione',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
