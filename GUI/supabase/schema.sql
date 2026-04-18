-- ============================================================
-- Emergency Response Platform — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- ─────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin', 'responder')),
  agency        TEXT,
  agency_type   TEXT CHECK (agency_type IN ('Hospital', 'Police', 'Civil Defense', 'Najm')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  contact_number TEXT,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create a profile row whenever a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'responder')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────
-- CAMERAS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cameras (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  location    TEXT NOT NULL,
  stream_url  TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'degraded')),
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  protocol    TEXT CHECK (protocol IN ('rtsp', 'http', 'https')),
  username    TEXT,
  port        INTEGER,
  path        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- INCIDENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.incidents (
  id                   TEXT PRIMARY KEY,
  case_id              TEXT NOT NULL UNIQUE,
  location             TEXT NOT NULL,
  lat                  DOUBLE PRECISION NOT NULL,
  lng                  DOUBLE PRECISION NOT NULL,
  time                 TIMESTAMPTZ NOT NULL,
  severity             TEXT NOT NULL CHECK (severity IN ('high', 'moderate', 'low')),
  status               TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'on_scene', 'scene_cleared', 'closed')),
  ai_summary           TEXT NOT NULL,
  agency_specific_info TEXT,
  estimated_injuries   INTEGER,
  confidence           TEXT NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),
  weather              JSONB,
  traffic              TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- INCIDENT PHOTOS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.incident_photos (
  id          TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL REFERENCES public.incidents (id) ON DELETE CASCADE,
  uri         TEXT NOT NULL,
  timestamp   TIMESTAMPTZ NOT NULL,
  verified    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- ACTION LOGS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.action_logs (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  incident_id TEXT NOT NULL REFERENCES public.incidents (id) ON DELETE CASCADE,
  timestamp   TIMESTAMPTZ NOT NULL,
  user_name   TEXT NOT NULL,
  action      TEXT NOT NULL,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- DISPATCHED UNITS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dispatched_units (
  id          TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL REFERENCES public.incidents (id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  agency      TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('dispatched', 'en_route', 'on_scene', 'cleared')),
  dispatched_at TIMESTAMPTZ NOT NULL,
  on_scene_at   TIMESTAMPTZ,
  cleared_at    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- COLLABORATION MESSAGES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.collaboration_messages (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  incident_id TEXT NOT NULL REFERENCES public.incidents (id) ON DELETE CASCADE,
  timestamp   TIMESTAMPTZ NOT NULL,
  user_name   TEXT NOT NULL,
  agency      TEXT NOT NULL,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- AUDIT LOGS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  timestamp  TIMESTAMPTZ NOT NULL,
  user_id    UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  user_name  TEXT NOT NULL,
  ip_address TEXT,
  action     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cameras               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_photos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatched_units      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs            ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read everything
CREATE POLICY "Authenticated read profiles"              ON public.profiles              FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read cameras"               ON public.cameras               FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read incidents"             ON public.incidents             FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read incident_photos"       ON public.incident_photos       FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read action_logs"           ON public.action_logs           FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read dispatched_units"      ON public.dispatched_units      FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read collaboration_messages" ON public.collaboration_messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read audit_logs"            ON public.audit_logs            FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can insert action logs, collaboration messages
CREATE POLICY "Authenticated insert action_logs"           ON public.action_logs           FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated insert collaboration_messages" ON public.collaboration_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update incidents (status changes, acknowledge)
CREATE POLICY "Authenticated update incidents" ON public.incidents FOR UPDATE USING (auth.role() = 'authenticated');

-- Only admins can insert/update cameras
CREATE POLICY "Admin manage cameras insert" ON public.cameras FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin manage cameras update" ON public.cameras FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin manage cameras delete" ON public.cameras FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can manage profiles
CREATE POLICY "Admin manage profiles" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Admins can insert audit logs
CREATE POLICY "Admin insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
