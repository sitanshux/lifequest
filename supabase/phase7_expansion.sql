-- =============================================================
-- LifeQuest — Phase 7: Game System Expansion Migration
-- Run in Supabase SQL Editor → New Query
-- Idempotent — safe to run multiple times without duplicates
-- =============================================================

-- ── 1. Ensure schema integrity and unique constraints ─────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.items'::regclass AND conname = 'items_name_key'
  ) THEN
    ALTER TABLE public.items ADD CONSTRAINT items_name_key UNIQUE (name);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.achievements'::regclass AND conname = 'achievements_name_key'
  ) THEN
    ALTER TABLE public.achievements ADD CONSTRAINT achievements_name_key UNIQUE (name);
  END IF;
END $$;

-- ── 2. Seed Expanded Shop Items (25 items across 4 categories) ─
-- Categories: theme, badge, frame, cosmetic
-- Progression price tiers: 75 to 10,000 Gold
INSERT INTO public.items (name, description, type, price, is_active) VALUES
  -- Themes
  ('Focus Theme',         'A clean, minimal dark theme to help you concentrate on what matters.',      'theme',    150, true),
  ('Midnight Obsidian',   'A deep, stealthy obsidian dark aesthetic crafted for night-owl questers.',   'theme',    300, true),
  ('Cyberpunk Neon',      'Electric accents and high-contrast styling for the digital operative.',      'theme',    600, true),
  ('Forest Sanctuary',    'Earthy emerald tones and calming hues inspired by ancient woodlands.',       'theme',   1200, true),
  ('Solar Eclipse',       'A striking cosmic palette of corona gold against abyssal black.',            'theme',   2500, true),
  ('Mythic Aurora',       'A shimmering celestial aurora theme reserved for legendary heroes.',         'theme',   5000, true),

  -- Badges
  ('Warrior Badge',       'Awarded to adventurers who push through every challenge. Wear with pride.',  'badge',    200, true),
  ('Iron Will Insignia',  'A rugged emblem marking an adventurer who refuses to surrender.',            'badge',    100, true),
  ('Scholar Quill',       'A polished silver quill symbolising intellectual curiosity and wisdom.',     'badge',    250, true),
  ('Phoenix Crest',       'The mark of rising stronger after every stumble and setback.',               'badge',    500, true),
  ('Titan Sigil',         'An imposing adamantine sigil signifying unyielding physical strength.',      'badge',   1000, true),
  ('Grandmaster Seal',    'A rare golden emblem denoting supreme mastery over daily discipline.',       'badge',   3000, true),
  ('Crown of Sovereign',  'The ultimate badge of distinction for those who have conquered LifeQuest.',  'badge',   7500, true),

  -- Frames
  ('Golden Frame',        'A gilded profile frame that marks your status as a dedicated quester.',      'frame',    350, true),
  ('Bronze Filigree',     'An entry-level hand-carved bronze border for aspiring heroes.',              'frame',    150, true),
  ('Silver Aegis',        'A pristine silver perimeter forged from defensive determination.',           'frame',    500, true),
  ('Prismatic Crystal',   'Refracts pure achievement into dazzling multifaceted crystalline light.',    'frame',   1500, true),
  ('Dragonfire Border',   'Carved from volcanic rock and lined with eternal dragon flame.',             'frame',   3500, true),
  ('Celestial Halo',      'An ethereal, floating golden ring reserved for mythic champions.',           'frame',   8000, true),

  -- Cosmetics
  ('Traveler Cloak Pin',  'A weathered brass clasp for everyday explorers on the road.',               'cosmetic',  75, true),
  ('Companion Pet',       'A loyal spectral sprite that hovers beside you during questing.',           'cosmetic', 400, true),
  ('Hourglass of Focus',  'Contains sands that flow in reverse when you maintain your streaks.',       'cosmetic', 750, true),
  ('Runes of Power',      'Mystic glowing glyphs that radiate around your hero dossier.',              'cosmetic',1800, true),
  ('Aura of Invincible',  'A faint golden shimmer surrounding your character avatar.',                 'cosmetic',4500, true),
  ('Throne of Ascended',  'The pinnacle prestige cosmetic testifying to unmatched dedication.',        'cosmetic',10000, true)
ON CONFLICT (name) DO UPDATE
  SET description = EXCLUDED.description,
      type        = EXCLUDED.type,
      price       = EXCLUDED.price,
      is_active   = EXCLUDED.is_active;

-- ── 3. Seed Expanded Achievements (66 achievements) ───────────
-- Categories:
--   quests_completed: 1, 10, 25, 50, 100, 250, 500, 1000
--   streak:           3, 7, 14, 30, 60, 100, 365
--   level:            5, 10, 20, 30, 50, 75, 100
--   intellect:        100, 500, 1000, 2500, 5000, 10000, 25000, 50000
--   strength:         100, 500, 1000, 2500, 5000, 10000, 25000, 50000
--   wellness:         100, 500, 1000, 2500, 5000, 10000, 25000, 50000
--   creativity:       100, 500, 1000, 2500, 5000, 10000, 25000, 50000
--   discipline:       100, 500, 1000, 2500, 5000, 10000, 25000, 50000
--   items_purchased:  1, 5, 10
--   gold_held:        1000

INSERT INTO public.achievements (name, description, requirement_type, requirement_value) VALUES
  -- Quest Completion Milestones
  ('First Quest',            'Complete your first quest.',                              'quests_completed', 1),
  ('Adventurer',             'Complete 10 quests.',                                     'quests_completed', 10),
  ('Quest Veteran',          'Complete 25 quests.',                                     'quests_completed', 25),
  ('Quest Master',           'Complete 50 quests.',                                     'quests_completed', 50),
  ('Century Hero',           'Complete 100 quests.',                                    'quests_completed', 100),
  ('Legendary Quester',      'Complete 250 quests.',                                    'quests_completed', 250),
  ('Mythic Champion',        'Complete 500 quests.',                                    'quests_completed', 500),
  ('Grandmaster Adventurer', 'Complete 1,000 quests.',                                  'quests_completed', 1000),

  -- Streak Milestones
  ('First Streak',           'Maintain a 3-day activity streak.',                       'streak', 3),
  ('Weekly Warrior',         'Maintain a 7-day activity streak.',                       'streak', 7),
  ('Fortnight Focus',        'Maintain a 14-day activity streak.',                      'streak', 14),
  ('Monthly Momentum',       'Maintain a 30-day activity streak.',                      'streak', 30),
  ('Iron Habit',             'Maintain a 60-day activity streak.',                      'streak', 60),
  ('Centurion of Consistency','Maintain a 100-day activity streak.',                    'streak', 100),
  ('Year of Triumph',        'Maintain a 365-day activity streak.',                     'streak', 365),

  -- Level Milestones
  ('Novice Risen',           'Reach character level 5.',                                'level', 5),
  ('Level 10',               'Reach character level 10.',                               'level', 10),
  ('Seasoned Hero',          'Reach character level 20.',                               'level', 20),
  ('Veteran Vanguard',       'Reach character level 30.',                               'level', 30),
  ('Hero of Renown',         'Reach character level 50.',                               'level', 50),
  ('Ascended Paragon',       'Reach character level 75.',                               'level', 75),
  ('Living Legend',          'Reach character level 100.',                              'level', 100),

  -- Intellect Milestones
  ('Keen Mind',              'Earn 100 Intellect points.',                              'intellect', 100),
  ('Scholar',                'Earn 500 Intellect points.',                              'intellect', 500),
  ('Sage',                   'Earn 1,000 Intellect points.',                            'intellect', 1000),
  ('Grand Polymath',         'Earn 2,500 Intellect points.',                            'intellect', 2500),
  ('Master of Arcana',       'Earn 5,000 Intellect points.',                            'intellect', 5000),
  ('Omniscient Thinker',     'Earn 10,000 Intellect points.',                           'intellect', 10000),
  ('Universal Mind',         'Earn 25,000 Intellect points.',                           'intellect', 25000),
  ('Enlightened Sovereign',  'Earn 50,000 Intellect points.',                           'intellect', 50000),

  -- Strength Milestones
  ('Iron Will',              'Earn 100 Strength points.',                               'strength', 100),
  ('Warrior',                'Earn 500 Strength points.',                               'strength', 500),
  ('Gladiator',              'Earn 1,000 Strength points.',                             'strength', 1000),
  ('Colossus',               'Earn 2,500 Strength points.',                             'strength', 2500),
  ('Titan of Might',         'Earn 5,000 Strength points.',                             'strength', 5000),
  ('Unstoppable Force',      'Earn 10,000 Strength points.',                            'strength', 10000),
  ('Mountain Shaker',        'Earn 25,000 Strength points.',                            'strength', 25000),
  ('God of War',             'Earn 50,000 Strength points.',                            'strength', 50000),

  -- Wellness Milestones
  ('Fresh Start',            'Earn 100 Wellness points.',                               'wellness', 100),
  ('Vital Spirit',           'Earn 500 Wellness points.',                               'wellness', 500),
  ('Rejuvenator',            'Earn 1,000 Wellness points.',                             'wellness', 1000),
  ('Font of Life',           'Earn 2,500 Wellness points.',                             'wellness', 2500),
  ('Zenith of Health',       'Earn 5,000 Wellness points.',                             'wellness', 5000),
  ('Immortal Vigor',         'Earn 10,000 Wellness points.',                            'wellness', 10000),
  ('Harmonic Guardian',      'Earn 25,000 Wellness points.',                            'wellness', 25000),
  ('Eternal Fountain',       'Earn 50,000 Wellness points.',                            'wellness', 50000),

  -- Creativity Milestones
  ('Spark of Genius',        'Earn 100 Creativity points.',                             'creativity', 100),
  ('Artisan',                'Earn 500 Creativity points.',                             'creativity', 500),
  ('Visionary',              'Earn 1,000 Creativity points.',                           'creativity', 1000),
  ('Master Crafter',         'Earn 2,500 Creativity points.',                           'creativity', 2500),
  ('Architect of Dreams',    'Earn 5,000 Creativity points.',                           'creativity', 5000),
  ('Cosmic Creator',         'Earn 10,000 Creativity points.',                          'creativity', 10000),
  ('Infinite Muse',          'Earn 25,000 Creativity points.',                          'creativity', 25000),
  ('Demiurge',               'Earn 50,000 Creativity points.',                          'creativity', 50000),

  -- Discipline Milestones
  ('Steadfast Step',         'Earn 100 Discipline points.',                             'discipline', 100),
  ('Unshakable',             'Earn 500 Discipline points.',                             'discipline', 500),
  ('Sentinel of Order',      'Earn 1,000 Discipline points.',                           'discipline', 1000),
  ('Adamantine Will',        'Earn 2,500 Discipline points.',                           'discipline', 2500),
  ('Grand Inquisitor',       'Earn 5,000 Discipline points.',                           'discipline', 5000),
  ('Absolute Resolve',       'Earn 10,000 Discipline points.',                          'discipline', 10000),
  ('Unyielding Sovereign',   'Earn 25,000 Discipline points.',                          'discipline', 25000),
  ('Master of Destiny',      'Earn 50,000 Discipline points.',                          'discipline', 50000),

  -- Special & Progression Milestones
  ('First Purchase',         'Make your first purchase in the Shop.',                   'items_purchased', 1),
  ('Loot Collector',         'Acquire 5 items in your inventory.',                      'items_purchased', 5),
  ('Curator of Vaults',      'Collect 10 shop items in your inventory.',                'items_purchased', 10),
  ('Gold Hoarder',           'Hold 1,000 Gold at one time.',                            'gold_held', 1000)
ON CONFLICT (name) DO UPDATE
  SET description       = EXCLUDED.description,
      requirement_type  = EXCLUDED.requirement_type,
      requirement_value = EXCLUDED.requirement_value;
