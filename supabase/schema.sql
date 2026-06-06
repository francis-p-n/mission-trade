-- Mission Market Schema
-- Run this in your Supabase SQL Editor

-- Enable realtime (run this if not already enabled)
-- alter publication supabase_realtime add table sessions, players, paths, rounds, choices, events;

-- ─── SESSIONS ────────────────────────────────────────────────────────────────
create table if not exists sessions (
  id          uuid primary key default gen_random_uuid(),
  session_code text unique not null,
  status      text not null default 'lobby', -- lobby | active | paused | ended
  current_round integer not null default 0,
  show_intro  boolean not null default false, -- controls intro screen visibility
  created_at  timestamptz not null default now(),
  started_at  timestamptz,
  ended_at    timestamptz
);

-- ─── PLAYERS ─────────────────────────────────────────────────────────────────
create table if not exists players (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references sessions(id) on delete cascade,
  display_name    text not null,
  credits         numeric not null default 500,
  current_path_id uuid,
  is_connected    boolean not null default true,
  joined_at       timestamptz not null default now()
);

-- ─── PATHS ───────────────────────────────────────────────────────────────────
create table if not exists paths (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references sessions(id) on delete cascade,
  name                text not null,
  key                 text not null, -- stable | popular | success | foundation
  description         text not null,
  tagline             text not null,
  current_value       numeric not null default 100,
  hidden_target_value numeric not null default 100,
  visible_trend       text not null default 'steady', -- steady | rising | falling | surging | uncertain
  volatility          numeric not null default 0.05,
  min_change          numeric not null default -0.02,
  max_change          numeric not null default 0.04,
  is_locked           boolean not null default false,
  trend_override      text,       -- admin can force a trend label
  rigging_mode        text not null default 'random', -- random | scripted | override
  scripted_values     jsonb,      -- array of per-round multipliers
  player_count        integer not null default 0
);

-- ─── ROUNDS ──────────────────────────────────────────────────────────────────
create table if not exists rounds (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  round_number integer not null,
  status      text not null default 'open', -- open | locked | resolved
  duration_seconds integer not null default 60,
  started_at  timestamptz not null default now(),
  locked_at   timestamptz,
  resolved_at timestamptz
);

-- ─── CHOICES ─────────────────────────────────────────────────────────────────
create table if not exists choices (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  round_id    uuid not null references rounds(id) on delete cascade,
  player_id   uuid not null references players(id) on delete cascade,
  path_id     uuid not null references paths(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (round_id, player_id)
);

-- ─── EVENTS ──────────────────────────────────────────────────────────────────
create table if not exists events (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references sessions(id) on delete cascade,
  event_type    text not null, -- hype_surge | market_drop | stable_boost | foundation_surge | full_reset | round_resolved | player_joined | path_switched
  message       text not null,
  payload       jsonb,
  triggered_by  text not null default 'system', -- admin | system
  triggered_at  timestamptz not null default now()
);

-- ─── LEADERBOARD SNAPSHOTS ───────────────────────────────────────────────────
create table if not exists leaderboard_snapshots (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  round_id    uuid not null references rounds(id) on delete cascade,
  player_id   uuid not null references players(id) on delete cascade,
  rank        integer not null,
  credits     numeric not null,
  created_at  timestamptz not null default now()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
create index if not exists idx_players_session on players(session_id);
create index if not exists idx_paths_session on paths(session_id);
create index if not exists idx_rounds_session on rounds(session_id);
create index if not exists idx_choices_round on choices(round_id);
create index if not exists idx_choices_player on choices(player_id);
create index if not exists idx_events_session on events(session_id);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
-- Disable RLS for simplicity (admin password gating is done in app layer)
alter table sessions disable row level security;
alter table players disable row level security;
alter table paths disable row level security;
alter table rounds disable row level security;
alter table choices disable row level security;
alter table events disable row level security;
alter table leaderboard_snapshots disable row level security;

-- ─── REALTIME ────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table paths;
alter publication supabase_realtime add table rounds;
alter publication supabase_realtime add table choices;
alter publication supabase_realtime add table events;
