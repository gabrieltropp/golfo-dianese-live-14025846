
CREATE TABLE public.admin_users (
  user_id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view admin list" ON public.admin_users FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.bathing_water (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  water_code text NOT NULL UNIQUE,
  beach_name text NOT NULL,
  comune text NOT NULL DEFAULT 'Diano Marina',
  status text NOT NULL DEFAULT 'unknown' CHECK (status IN ('compliant','non_compliant','unknown')),
  last_sampled_on date,
  source_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bathing_water TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bathing_water TO authenticated;
GRANT ALL ON public.bathing_water TO service_role;
ALTER TABLE public.bathing_water ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read bathing water" ON public.bathing_water FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage bathing water" ON public.bathing_water FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER bathing_water_updated BEFORE UPDATE ON public.bathing_water FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.water_advisories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone text NOT NULL,
  comune text NOT NULL DEFAULT 'Diano Marina',
  kind text NOT NULL DEFAULT 'planned' CHECK (kind IN ('planned','outage','works')),
  description text,
  expected_restore_at timestamptz,
  published_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  source text NOT NULL DEFAULT 'manual',
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.water_advisories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.water_advisories TO authenticated;
GRANT ALL ON public.water_advisories TO service_role;
ALTER TABLE public.water_advisories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read water advisories" ON public.water_advisories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage water advisories" ON public.water_advisories FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER water_advisories_updated BEFORE UPDATE ON public.water_advisories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.bike_path_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment text NOT NULL DEFAULT 'Diano Marina - San Bartolomeo al Mare',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','works','closed')),
  message_it text,
  message_en text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bike_path_status TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bike_path_status TO authenticated;
GRANT ALL ON public.bike_path_status TO service_role;
ALTER TABLE public.bike_path_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read bike path" ON public.bike_path_status FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage bike path" ON public.bike_path_status FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER bike_path_updated BEFORE UPDATE ON public.bike_path_status FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.bathing_water (water_code, beach_name, comune, status, last_sampled_on, source_url, notes)
VALUES ('IT007008027A001', 'Diano Marina - Spiaggia centrale', 'Diano Marina', 'compliant', '2026-07-06',
'https://www.arpal.liguria.it/tematiche/mare/balneabilita.html?ANNO=2026&CODICE_ACQUA=IT007008027A001&PROVINCIA=Imperia&COMUNE=Diano+Marina',
'Campionamento mensile ARPAL, stagione balneare 2026.');

INSERT INTO public.water_advisories (zone, comune, kind, description, expected_restore_at, published_at, is_active)
VALUES ('Via Genova / Lungomare', 'Diano Marina', 'planned', 'Lavori programmati sulla rete idrica: possibili cali di pressione.', now() + interval '2 day', now() - interval '1 day', true);

INSERT INTO public.bike_path_status (segment, status, message_it, message_en)
VALUES ('Pista ciclabile ex ferrovia: Diano Marina - San Bartolomeo al Mare', 'open',
'Percorso interamente percorribile. Nessuna chiusura segnalata.',
'Route fully open. No closures reported.');
