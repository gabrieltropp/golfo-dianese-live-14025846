ALTER TABLE public.avvisi
  ADD COLUMN IF NOT EXISTS comuni_citati text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS data_intervento text;

CREATE INDEX IF NOT EXISTS avvisi_fonte_idx ON public.avvisi (fonte);