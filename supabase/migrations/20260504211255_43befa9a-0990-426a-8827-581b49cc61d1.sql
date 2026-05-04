
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.provider_type AS ENUM ('vfs', 'bls', 'tls', 'visametric', 'other');
CREATE TYPE public.slot_source AS ENUM ('scraper', 'user_report');
CREATE TYPE public.notification_channel AS ENUM ('web_push', 'email', 'sms', 'telegram', 'whatsapp', 'in_app');
CREATE TYPE public.subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'incomplete');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone_e164 TEXT,
  telegram_chat_id TEXT,
  channel_email BOOLEAN NOT NULL DEFAULT true,
  channel_web_push BOOLEAN NOT NULL DEFAULT true,
  channel_sms BOOLEAN NOT NULL DEFAULT false,
  channel_telegram BOOLEAN NOT NULL DEFAULT false,
  channel_whatsapp BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  flag_emoji TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  monthly_price_cents INTEGER NOT NULL DEFAULT 1900,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.visa_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.visa_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.centres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  provider public.provider_type NOT NULL,
  provider_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.centres ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.trackers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  centre_id UUID NOT NULL REFERENCES public.centres(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.visa_categories(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT true,
  alert_window JSONB NOT NULL DEFAULT '{"days":[1,2,3,4,5,6,0],"start_hour":0,"end_hour":24}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, centre_id, category_id)
);
ALTER TABLE public.trackers ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_trackers_user ON public.trackers(user_id);
CREATE INDEX idx_trackers_centre_cat ON public.trackers(centre_id, category_id) WHERE active;

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  status public.subscription_status NOT NULL DEFAULT 'trialing',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, country_id)
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.scraper_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  last_heartbeat_at TIMESTAMPTZ,
  last_slot_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scraper_keys ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.slot_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES public.centres(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.visa_categories(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  slot_time TIME,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source public.slot_source NOT NULL DEFAULT 'scraper',
  scraper_id UUID REFERENCES public.scraper_keys(id) ON DELETE SET NULL,
  raw_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.slot_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_slot_events_centre_cat_detected ON public.slot_events(centre_id, category_id, detected_at DESC);
CREATE INDEX idx_slot_events_dedupe ON public.slot_events(centre_id, category_id, slot_date, slot_time, detected_at DESC);

CREATE TABLE public.notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_event_id UUID NOT NULL REFERENCES public.slot_events(id) ON DELETE CASCADE,
  channel public.notification_channel NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  error TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notifications_user ON public.notifications_log(user_id, sent_at DESC);

CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.slot_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  centre_id UUID NOT NULL REFERENCES public.centres(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.visa_categories(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  slot_time TIME,
  notes TEXT,
  screenshot_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.slot_reports ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Public read countries" ON public.countries FOR SELECT USING (true);
CREATE POLICY "Admins write countries" ON public.countries FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Public read categories" ON public.visa_categories FOR SELECT USING (true);
CREATE POLICY "Admins write categories" ON public.visa_categories FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Public read centres" ON public.centres FOR SELECT USING (true);
CREATE POLICY "Admins write centres" ON public.centres FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Users manage own trackers" ON public.trackers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own subs" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view subs" ON public.subscriptions FOR SELECT USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins manage scrapers" ON public.scraper_keys FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Public read slots" ON public.slot_events FOR SELECT USING (true);
CREATE POLICY "Admins write slots" ON public.slot_events FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Users view own notifications" ON public.notifications_log FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users manage own push subs" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users insert own reports" ON public.slot_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own reports" ON public.slot_reports FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage reports" ON public.slot_reports FOR UPDATE USING (public.has_role(auth.uid(),'admin'));

INSERT INTO public.countries (code, name, flag_emoji) VALUES
  ('FR','France','🇫🇷'),
  ('DE','Germany','🇩🇪'),
  ('ES','Spain','🇪🇸'),
  ('IT','Italy','🇮🇹'),
  ('NL','Netherlands','🇳🇱');

INSERT INTO public.visa_categories (code, name, description) VALUES
  ('short_stay','Short-stay (Schengen C)','Tourism, business, family visit ≤ 90 days'),
  ('long_stay','Long-stay (D)','Stays > 90 days'),
  ('work','Work','Employment-based visa'),
  ('study','Study','Student visa');

INSERT INTO public.centres (country_id, city, provider, provider_url)
SELECT id, 'Dublin', 'vfs'::provider_type, 'https://visa.vfsglobal.com/irl/en/fra' FROM public.countries WHERE code = 'FR'
UNION ALL SELECT id, 'Dublin', 'vfs'::provider_type, 'https://visa.vfsglobal.com/irl/en/deu' FROM public.countries WHERE code = 'DE'
UNION ALL SELECT id, 'Dublin', 'bls'::provider_type, 'https://ireland.blsspainvisa.com/' FROM public.countries WHERE code = 'ES'
UNION ALL SELECT id, 'Dublin', 'vfs'::provider_type, 'https://visa.vfsglobal.com/irl/en/ita' FROM public.countries WHERE code = 'IT'
UNION ALL SELECT id, 'Dublin', 'vfs'::provider_type, 'https://visa.vfsglobal.com/irl/en/nld' FROM public.countries WHERE code = 'NL';
