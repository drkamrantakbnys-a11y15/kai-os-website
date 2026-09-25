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

-- The admin dashboard calls this via client.rpc("is_admin") only after a
-- real signed-in session exists (see src/pages/admin.astro) -- the
-- `authenticated` role needs EXECUTE to invoke it at all. It runs SECURITY
-- DEFINER, so the function body itself doesn't need a grant on `admins` for
-- the caller's role. `anon` never calls this (no site code does), so no
-- anon grant is added. admins itself gets NO grants to anon or
-- authenticated anywhere in this file -- it stays reachable only through
-- this function or the dashboard/service role.
grant execute on function is_admin() to authenticated;

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

-- Least-privilege table grants (Supabase Least-Privilege Grant Audit).
-- RLS policies above only ever run once these base GRANTs let a role
-- touch the table at all -- both are required, RLS alone is not enough.
-- anon: comments_select_public (read) + comments_insert_public (post,
-- src/components/CommentSection.astro), both used unauthenticated.
grant select, insert on comments to anon;
-- authenticated: same read/post path when signed in, plus
-- comments_update_admin and comments_delete_own_or_admin -- the admin
-- dashboard (src/pages/admin.astro) runs these as `authenticated`,
-- narrowed further by is_admin() inside the policy itself.
grant select, insert, update, delete on comments to authenticated;

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

-- Least-privilege table grants. reports_insert_public is used
-- unauthenticated AND signed-in (CommentSection.astro's report button has
-- no auth gate); reports_select_admin is only ever read from the admin
-- dashboard as `authenticated` + is_admin().
grant insert on comment_reports to anon;
grant select, insert on comment_reports to authenticated;

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

-- Least-privilege table grants. reactions_select_public and
-- reactions_insert_public (ReactionBar.astro) are both used unauthenticated
-- and signed-in. reactions_delete_own has NO corresponding call in the
-- website source today (no code calls .from("reactions").delete()), so no
-- DELETE grant is added here -- the policy stays inert until something
-- actually needs it, at which point the grant should be added alongside.
grant select, insert on reactions to anon;
grant select, insert on reactions to authenticated;

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
  -- Added for the Founder Vision + Support + Community phase: a plain
  -- boolean flag, not a privilege grant of any kind -- an idea submission
  -- (and this flag) is DATA ONLY. If this column does not yet exist on an
  -- already-provisioned database, run:
  --   alter table feature_requests add column if not exists collaboration_interest boolean not null default false;
  collaboration_interest boolean not null default false,
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

-- Least-privilege table grants. feature_requests_insert_public
-- (FeatureRequest.astro) is unauthenticated-only in practice; nothing in
-- the site reads or updates requests except the admin dashboard
-- (`authenticated` + is_admin()), so anon gets INSERT only -- never
-- SELECT/UPDATE, matching the "nobody, not even the submitter, can read
-- requests back" design note above.
grant insert on feature_requests to anon;
grant select, update on feature_requests to authenticated;

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

-- Least-privilege table grant. bookmarks_all_own covers all four verbs,
-- but src/lib/bookmarks.js -- always gated on a real client.auth.getUser()
-- result -- only ever calls insert() and delete(); there is no select() or
-- update() call anywhere in the site source, so only those two verbs are
-- granted here. No anon grant at all: anonymous bookmarks are
-- localStorage-only and never touch this table.
grant insert, delete on bookmarks to authenticated;

-- ============================================================
-- 7. Page views (real, aggregate-only site analytics -- Website
--    Intelligence + Media Network Activation Sprint, Phase 15)
-- ============================================================
-- Deliberately minimal: a path and a timestamp, nothing else. No
-- visitor identity, no IP address, no cookie, no user_id. Public can
-- insert (fires once per page load); only admins can read, and only
-- ever in aggregate (see /admin) -- never exposed as a public
-- unauthenticated "live view counter."
--
-- utm_source/utm_medium/utm_campaign added for the YouTube -> Project
-- KAI Attribution Foundation (CEO-authorized UTM Database Migration
-- Readiness phase): traffic-source attribution metadata only, same
-- privacy posture as `path` -- nullable (an ordinary non-campaign visit
-- has none of these and remains a fully valid row), no PII, no viewer
-- identity, no cookie. If this table/these columns do not yet exist on
-- an already-provisioned database, run (same upgrade-path convention as
-- feature_requests' collaboration_interest/contribution_area/
-- relevant_link columns above):
--   alter table page_views add column if not exists utm_source text;
--   alter table page_views add column if not exists utm_medium text;
--   alter table page_views add column if not exists utm_campaign text;
--   drop policy if exists "page_views_insert_public" on page_views;
--   create policy "page_views_insert_public" on page_views
--     for insert
--     with check (
--       char_length(path) <= 200
--       and char_length(coalesce(utm_source, '')) <= 100
--       and char_length(coalesce(utm_medium, '')) <= 100
--       and char_length(coalesce(utm_campaign, '')) <= 100
--     );
-- THIS FILE DOES NOT EXECUTE THESE STATEMENTS -- see the setup notes at
-- the bottom of this file. Applying them against the real project
-- requires a human to run them in the Supabase SQL editor.
create table if not exists page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now()
);

alter table page_views enable row level security;

create index if not exists page_views_path_idx on page_views (path);

-- No index on utm_campaign/utm_source/utm_medium yet -- at current
-- traffic volume a sequential scan for an admin-only, low-frequency
-- aggregate query is fine; add one later only with concrete evidence
-- (row count/query latency) that it's needed, matching
-- page_views_path_idx's own single-column precedent rather than
-- pre-optimizing.
create policy "page_views_insert_public" on page_views
  for insert
  with check (
    char_length(path) <= 200
    and char_length(coalesce(utm_source, '')) <= 100
    and char_length(coalesce(utm_medium, '')) <= 100
    and char_length(coalesce(utm_campaign, '')) <= 100
  );

create policy "page_views_select_admin" on page_views
  for select
  using (is_admin());

-- Least-privilege table grants. anon gets INSERT only (analytics.js fires
-- this unauthenticated on every page load) -- deliberately NO anon SELECT,
-- preserving the "never a public unauthenticated view counter" design
-- note above. authenticated gets SELECT only, used solely by the admin
-- dashboard (authenticated + is_admin()); no UPDATE/DELETE anywhere in
-- the site source, so none granted.
grant insert on page_views to anon;
grant select on page_views to authenticated;

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
