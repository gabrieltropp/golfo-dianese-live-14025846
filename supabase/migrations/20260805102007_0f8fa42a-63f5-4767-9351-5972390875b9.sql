ALTER TABLE public.avvisi ADD COLUMN IF NOT EXISTS necessita_revisione boolean NOT NULL DEFAULT false;
UPDATE public.avvisi SET necessita_revisione = true WHERE data_pubblicazione IS NULL;
CREATE INDEX IF NOT EXISTS avvisi_data_pubblicazione_idx ON public.avvisi (data_pubblicazione DESC NULLS LAST);