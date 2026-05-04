
-- Vault table for per-centre login credentials used by scrapers.
-- Sensitive fields are stored as ciphertext (base64) + iv + auth tag,
-- encrypted at the application layer with AES-256-GCM using a server-only key.
CREATE TABLE public.scraper_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id uuid NOT NULL REFERENCES public.centres(id) ON DELETE CASCADE,
  provider provider_type NOT NULL,
  label text NOT NULL,
  username_ciphertext text,
  username_iv text,
  username_tag text,
  password_ciphertext text,
  password_iv text,
  password_tag text,
  notes_ciphertext text,
  notes_iv text,
  notes_tag text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (centre_id, provider, label)
);

ALTER TABLE public.scraper_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage scraper credentials"
  ON public.scraper_credentials
  FOR ALL
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_scraper_credentials_updated_at
  BEFORE UPDATE ON public.scraper_credentials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX scraper_credentials_centre_provider_idx
  ON public.scraper_credentials (centre_id, provider)
  WHERE active = true;
