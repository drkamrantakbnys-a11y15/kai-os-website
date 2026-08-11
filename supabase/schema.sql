-- Project KAI website — backend schema (Supabase / PostgreSQL)
--
-- Run this once in the Supabase SQL editor for a new project. Nothing
-- in this repository executes this automatically -- it is the exact,
-- complete schema the website's client code (src/lib/supabase.js and
-- friends) expects when PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY
-- are set. Until they are, the website runs in DEMO MODE and none of
-- this is touched.
--
-- Design principles, stated up front because they shape every policy
-- below:
--   - Row Level Security (RLS) is enabled on every table, no exceptions.
--   - The anon key can INSERT (post a comment/reaction/feature request)
--     but can only read/update/delete what's explicitly opened below.
--   - "Anonymous ownership" (editing/deleting your own comment) is
--     deliberately NOT implemented via a client-supplied session id --
--     an anon key cannot cryptographically prove which browser sent a
--     request, so a client-supplied id is not a real security boundary.
--     Self-delete/edit is only offered to real authenticated users
--     (auth.uid()), matching Phase 7's "delete own comment where
--     authentication exists." Anonymous commenters can REPORT a
--     comment instead, which an admin then reviews.
--   - Admin/moderation actions require a real authenticated session
--     whose email appears in the `admins` table -- never a client-side
--     "isAdmin" flag, never trusted from request data.

-- ============================================================
-- 1. Admins allowlist
-- ============================================================
create table if not exists admins (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

-- No public policies at all: readable/writable only via the Supabase
-- dashboard (service role) or the is_admin() function below.

create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from admins where email = auth.jwt() ->> 'email'
  );
$$;

-- ============================================================
-- 2. Comments
-- ============================================================
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  topic text not null,               -- matches CommentSection's `topic` prop, e.g. "AI News"
  item_id text,                      -- optional: a specific content id (NEWS-001, etc.)
  parent_id uuid references comments(id) on delete cascade,
  user_id uuid references auth.users(id),  -- null for anonymous comments
  name text not null default 'Anonymous',
  body text not null,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'pinned')),
  report_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table comments enable row level security;

create index if not exists comments_topic_idx on comments (topic, created_at desc);

-- Public can read visible/pinned comments only -- never hidden ones.
create policy "comments_select_public" on comments
  for select
  using (status in ('visible', 'pinned'));

-- Public (including anonymous) can post a comment. Length caps are
-- enforced here, not only client-side, so a direct API call can't
-- bypass them. user_id must match the caller's own auth id (or be
-- null for anonymous) -- nobody can post "as" someone else.
create policy "comments_insert_public" on comments
  for insert
  with check (
    char_length(body) between 1 and 2000
    and char_length(name) <= 80
    and status = 'visible'
    and (user_id is null or user_id = auth.uid())
  );

-- Only the authenticated author, or an admin, may delete a comment.
-- Anonymous (user_id null) comments can never be self-deleted --
-- there is no way to prove anonymous authorship to Postgres. Use the
-- report flow instead.
create policy "comments_delete_own_or_admin" on comments
  for delete
  using ((user_id is not null and auth.uid() = user_id) or is_admin());

-- Only admins change status (hide/pin) or clear report_count.
create policy "comments_update_admin" on comments
  for update
  using (is_admin())
  with check (is_admin());

-- Abuse control: no more than 5 comments per IP-less proxy (author,
-- when known) per 5 minutes. Applied per user_id when authenticated;
-- anonymous inserts are rate-limited more coarsely per topic to avoid
-- a burst from a single anonymous source, acknowledging this is a
-- soft control, not a strong guarantee, for anonymous traffic.
create or replace function enforce_comment_rate_limit()
returns trigger
language plpgsql
security definer
as $$
declare
  recent_count integer;
begin
  if new.user_id is not null then
    select count(*) into recent_count
    from comments
    where user_id = new.user_id
      and created_at > now() - interval '5 minutes';
  else
    select count(*) into recent_count
    from comments
    where user_id is null
      and topic = new.topic
      and created_at > now() - interval '1 minute';
  end if;

  if recent_count >= 5 then
    raise exception 'Rate limit exceeded: too many comments recently.';
  end if;

  return new;
end;
$$;

drop trigger if exists comments_rate_limit on comments;
create trigger comments_rate_limit
  before insert on comments
  for each row execute function enforce_comment_rate_limit();

-- ============================================================
-- 3. Comment reports (anyone flagging a comment for moderation --
--    the anonymous-commenter's path to "delete" something objectionable)
-- ============================================================
create table if not exists comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references comments(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now()
);

alter table comment_reports enable row level security;

create policy "reports_insert_public" on comment_reports
  for insert
  with check (char_length(coalesce(reason, '')) <= 500);

create policy "reports_select_admin" on comment_reports
  for select
  using (is_admin());

create or replace function bump_comment_report_count()
returns trigger
language plpgsql
security definer
as $$
begin
  update comments set report_count = report_count + 1 where id = new.comment_id;
  return new;
end;
$$;

drop trigger if exists comment_reports_bump on comment_reports;
create trigger comment_reports_bump
  after insert on comment_reports
  for each row execute function bump_comment_report_count();

-- ============================================================
-- 4. Reactions
-- ============================================================
-- Deliberately NOT deduplicated at the database level for anonymous
-- reactions (the anon key can't prove "this is the same browser as
-- before" any more than it can for comments). The client (ReactionBar)
-- prevents accidental double-reacting via localStorage; a determined
-- user could still submit more than one row via a direct API call, the
-- same limitation nearly every anonymous-reaction system has. Real,
-- one-per-person dedup is only guaranteed for authenticated users,
-- via the unique constraint below.
create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  item_id text not null,             -- matches ReactionBar's `itemId` prop
  reaction text not null,
  user_id uuid references auth.users(id),  -- null for anonymous
  created_at timestamptz not null default now()
);

alter table reactions enable row level security;

create unique index if not exists reactions_one_per_user
  on reactions (item_id, user_id) where user_id is not null;

create index if not exists reactions_item_idx on reactions (item_id);

-- Public can read reaction rows to compute a real aggregate count --
-- never a fabricated one.
create policy "reactions_select_public" on reactions
  for select
  using (true);

create policy "reactions_insert_public" on reactions
  for insert
  with check (
    char_length(reaction) <= 40
    and (user_id is null or user_id = auth.uid())
  );

create policy "reactions_delete_own" on reactions
  for delete
  using (user_id is not null and auth.uid() = user_id);

-- ============================================================
-- 5. Feature requests
-- ============================================================
create table if not exists feature_requests (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  category text not null check (category in ('CONTENT', 'FEATURE', 'AI', 'YOUTUBE', 'COMMUNITY', 'DISCOVERY', 'LEARNING', 'OTHER')),
  request text not null,
  reason text,
  priority text not null default 'NORMAL' check (priority in ('LOW', 'NORMAL', 'HIGH')),
  status text not null default 'new' check (status in ('new', 'reviewed', 'planned', 'declined')),
  created_at timestamptz not null default now()
);

alter table feature_requests enable row level security;

-- Public can submit; nobody (not even the submitter) can read requests
-- back -- prevents email harvesting via the public API. Only admins,
-- via the /admin dashboard, can read them.
create policy "feature_requests_insert_public" on feature_requests
  for insert
  with check (char_length(request) between 1 and 2000);

create policy "feature_requests_select_admin" on feature_requests
  for select
  using (is_admin());

create policy "feature_requests_update_admin" on feature_requests
  for update
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- 6. Bookmarks (authenticated users only -- anonymous bookmarks use
--    localStorage on the client and never touch this table)
-- ============================================================
create table if not exists bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  item_type text not null,
  created_at timestamptz not null default now(),
  unique (user_id, item_id)
);

alter table bookmarks enable row level security;

create policy "bookmarks_all_own" on bookmarks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 7. Page views (real, aggregate-only site analytics -- Website
--    Intelligence + Media Network Activation Sprint, Phase 15)
-- ============================================================
-- Deliberately minimal: a path and a timestamp, nothing else. No
-- visitor identity, no IP address, no cookie, no user_id. Public can
-- insert (fires once per page load); only admins can read, and only
-- ever in aggregate (see /admin) -- never exposed as a public
-- unauthenticated "live view counter."
create table if not exists page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  created_at timestamptz not null default now()
);

alter table page_views enable row level security;

create index if not exists page_views_path_idx on page_views (path);

create policy "page_views_insert_public" on page_views
  for insert
  with check (char_length(path) <= 200);

create policy "page_views_select_admin" on page_views
  for select
  using (is_admin());

-- ============================================================
-- Setup notes (not executed by this file)
-- ============================================================
-- 1. After running this file, add at least one admin so /admin has
--    someone who can sign in and moderate:
--      insert into admins (email) values ('you@example.com');
-- 2. Enable an auth provider (email/password is simplest) in the
--    Supabase dashboard under Authentication -- required for anyone
--    to sign in, whether as an admin or as a user who wants to
--    delete their own comments / keep server-side bookmarks.
-- 3. PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY (Project
--    Settings -> API) are the only two values this website's code
--    ever needs. The service-role key must never be entered anywhere
--    in this repository or its environment variables.
