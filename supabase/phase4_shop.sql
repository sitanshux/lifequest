-- =============================================================
-- LifeQuest — Phase 4: Shop & Inventory Migration
-- Run in Supabase SQL Editor → New Query
-- Safe to run multiple times (idempotent)
--
-- FIX: items table pre-existed without is_active column.
-- We add the column via ALTER TABLE ADD COLUMN IF NOT EXISTS
-- so this runs cleanly against either a new or existing table.
-- =============================================================

-- ── 1. items table ────────────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS is a no-op if the table already exists.
CREATE TABLE IF NOT EXISTS public.items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text        NOT NULL DEFAULT '',
  type        text        NOT NULL DEFAULT 'cosmetic',
  price       integer     NOT NULL CHECK (price >= 0),
  image_url   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Add any missing columns to the existing table (idempotent).
-- This is safe whether the table was just created or pre-existed.
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS description text        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS type        text        NOT NULL DEFAULT 'cosmetic',
  ADD COLUMN IF NOT EXISTS image_url   text,
  ADD COLUMN IF NOT EXISTS is_active   boolean     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at  timestamptz NOT NULL DEFAULT now();

-- RLS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.items TO authenticated;

-- Policy: authenticated users can read active items.
-- is_active column now guaranteed to exist from the ALTER TABLE above.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'items' AND policyname = 'Items are publicly readable'
  ) THEN
    CREATE POLICY "Items are publicly readable"
      ON public.items FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

-- ── 2. inventory table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventory (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  item_id     uuid        NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)  -- prevents duplicate ownership
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.inventory TO authenticated;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'inventory' AND policyname = 'Users can view own inventory'
  ) THEN
    CREATE POLICY "Users can view own inventory"
      ON public.inventory FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'inventory' AND policyname = 'Users can insert own inventory'
  ) THEN
    CREATE POLICY "Users can insert own inventory"
      ON public.inventory FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── 3. Seed initial shop items ────────────────────────────────
-- ON CONFLICT (name) DO NOTHING — idempotent re-run.
-- Add unique constraint on name if it doesn't exist yet.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.items'::regclass AND conname = 'items_name_key'
  ) THEN
    ALTER TABLE public.items ADD CONSTRAINT items_name_key UNIQUE (name);
  END IF;
END $$;

INSERT INTO public.items (name, description, type, price, is_active) VALUES
  (
    'Focus Theme',
    'A clean, minimal dark theme to help you concentrate on what matters.',
    'theme',
    150,
    true
  ),
  (
    'Warrior Badge',
    'Awarded to adventurers who push through every challenge. Wear it with pride.',
    'badge',
    200,
    true
  ),
  (
    'Golden Frame',
    'A gilded profile frame that marks your status as a dedicated quester.',
    'frame',
    350,
    true
  )
ON CONFLICT (name) DO NOTHING;

-- ── 4. Atomic purchase_item RPC ───────────────────────────────
-- Runs as a single DB transaction:
--   a. Validates item exists and is_active = true
--   b. Loads user Gold with a row lock (FOR UPDATE)
--   c. Rejects if insufficient Gold
--   d. Deducts Gold from profiles
--   e. Inserts inventory row (unique constraint catches duplicates)
--   f. Returns { new_gold, item_id }
--
-- SECURITY DEFINER: executes as the function owner (postgres).
-- The entire transaction is atomic — Gold is never deducted without
-- the inventory row being created, and vice versa.
--
-- Called from the server action only. The client never invokes this directly.

CREATE OR REPLACE FUNCTION public.purchase_item(
  p_user_id uuid,
  p_item_id  uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_price integer;
  v_user_gold  integer;
  v_new_gold   integer;
BEGIN
  -- 1. Validate item exists and is available
  --    Use a scalar select rather than %ROWTYPE to avoid issues
  --    if the table schema doesn't match the declared type exactly.
  SELECT price INTO v_item_price
  FROM public.items
  WHERE id = p_item_id
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found or not available';
  END IF;

  -- 2. Load user Gold (row lock prevents concurrent double-purchase)
  SELECT gold INTO v_user_gold
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- 3. Validate sufficient Gold
  IF v_user_gold < v_item_price THEN
    RAISE EXCEPTION 'Insufficient Gold: have %, need %', v_user_gold, v_item_price;
  END IF;

  -- 4. Deduct Gold
  v_new_gold := v_user_gold - v_item_price;

  UPDATE public.profiles
  SET gold       = v_new_gold,
      updated_at = now()
  WHERE id = p_user_id;

  -- 5. Create inventory record
  --    The UNIQUE(user_id, item_id) constraint makes this safe from races.
  BEGIN
    INSERT INTO public.inventory (user_id, item_id)
    VALUES (p_user_id, p_item_id);
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'Item already owned';
  END;

  -- 6. Return authoritative result
  RETURN jsonb_build_object(
    'new_gold', v_new_gold,
    'item_id',  p_item_id
  );
END;
$$;

-- Restrict RPC execution to authenticated users only
REVOKE ALL ON FUNCTION public.purchase_item(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purchase_item(uuid, uuid) TO authenticated;
