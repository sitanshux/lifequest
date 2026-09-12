-- =============================================================
-- LifeQuest — Phase 6: Achievements Migration (CORRECTED)
-- Run in Supabase SQL Editor → New Query
-- Idempotent — safe to run even after a failed previous attempt
-- =============================================================

-- ── 1. achievements table ─────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS is a no-op if it already exists.
CREATE TABLE IF NOT EXISTS public.achievements (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text        NOT NULL,
  description       text        NOT NULL DEFAULT '',
  requirement_type  text        NOT NULL,
  requirement_value integer     NOT NULL,
  icon              text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Ensure any missing columns exist (idempotent against pre-existing table).
ALTER TABLE public.achievements
  ADD COLUMN IF NOT EXISTS description       text    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS requirement_type  text    NOT NULL DEFAULT 'quests_completed',
  ADD COLUMN IF NOT EXISTS requirement_value integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS icon              text;

-- Unique constraint on name — enables ON CONFLICT (name) in seed.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.achievements'::regclass
      AND conname = 'achievements_name_key'
  ) THEN
    ALTER TABLE public.achievements ADD CONSTRAINT achievements_name_key UNIQUE (name);
  END IF;
END $$;

-- RLS: all authenticated users can read the achievements catalog.
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.achievements TO authenticated;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'achievements'
      AND policyname = 'Achievements are publicly readable'
  ) THEN
    CREATE POLICY "Achievements are publicly readable"
      ON public.achievements FOR SELECT
      USING (true);
  END IF;
END $$;

-- ── 2. user_achievements table ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid        NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.user_achievements TO authenticated;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_achievements'
      AND policyname = 'Users can view own achievements'
  ) THEN
    CREATE POLICY "Users can view own achievements"
      ON public.user_achievements FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_achievements'
      AND policyname = 'Users can insert own achievements'
  ) THEN
    CREATE POLICY "Users can insert own achievements"
      ON public.user_achievements FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── 3. Seed achievements with correct schema ──────────────────
-- requirement_type values used by the server-side achievement checker:
--   quests_completed  → count of completed quests >= requirement_value
--   streak            → current streak >= requirement_value
--   intellect         → intellect attribute total >= requirement_value
--   strength          → strength attribute total >= requirement_value
--   level             → current character level >= requirement_value
--
-- ON CONFLICT (name) DO UPDATE ensures correct requirement_type/value
-- even if a previous partial run inserted rows without these columns.
INSERT INTO public.achievements (name, description, requirement_type, requirement_value) VALUES
  ('First Quest',  'Complete your first quest.',               'quests_completed', 1),
  ('First Streak', 'Maintain a 3-day activity streak.',        'streak',           3),
  ('Quest Master', 'Complete 50 quests.',                      'quests_completed', 50),
  ('Scholar',      'Earn 500 Intellect points.',               'intellect',        500),
  ('Warrior',      'Earn 500 Strength points.',                'strength',         500),
  ('Level 10',     'Reach character level 10.',                'level',            10)
ON CONFLICT (name) DO UPDATE
  SET description       = EXCLUDED.description,
      requirement_type  = EXCLUDED.requirement_type,
      requirement_value = EXCLUDED.requirement_value;
