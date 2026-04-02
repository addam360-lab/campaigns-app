do $$
begin
  if not exists (select 1 from pg_type where typname = 'campaign_stage') then
    create type public.campaign_stage as enum (
      'Planning',
      'Ready',
      'Active',
      'Completed',
      'Cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'post_platform') then
    create type public.post_platform as enum (
      'YouTube',
      'Instagram',
      'TikTok'
    );
  end if;
end $$;

create table if not exists public.creators (
  creator_id uuid default extensions.uuid_generate_v4() primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  name text not null,
  industry text,
  address text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.campaigns (
  campaign_id uuid default extensions.uuid_generate_v4() primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  name text not null,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  stage public.campaign_stage not null default 'Planning',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.posts (
  post_id uuid default extensions.uuid_generate_v4() primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  campaign_id uuid not null references public.campaigns(campaign_id) on delete cascade,
  creator_id uuid not null references public.creators(creator_id) on delete restrict,
  platform public.post_platform not null,
  link text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.campaign_creators (
  id uuid default extensions.uuid_generate_v4() primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  campaign_id uuid not null references public.campaigns(campaign_id) on delete cascade,
  creator_id uuid not null references public.creators(creator_id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique (campaign_id, creator_id)
);

alter table public.creators enable row level security;
alter table public.campaigns enable row level security;
alter table public.posts enable row level security;
alter table public.campaign_creators enable row level security;

drop policy if exists "Users can CRUD own creators" on public.creators;
create policy "Users can CRUD own creators"
on public.creators for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can CRUD own campaigns" on public.campaigns;
create policy "Users can CRUD own campaigns"
on public.campaigns for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can CRUD own posts" on public.posts;
create policy "Users can CRUD own posts"
on public.posts for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can CRUD own campaign creators" on public.campaign_creators;
create policy "Users can CRUD own campaign creators"
on public.campaign_creators for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists idx_creators_user_created
on public.creators(user_id, created_at desc);

create index if not exists idx_campaigns_user_created
on public.campaigns(user_id, created_at desc);

create index if not exists idx_campaigns_user_stage
on public.campaigns(user_id, stage);

create index if not exists idx_posts_user_created
on public.posts(user_id, created_at desc);

create index if not exists idx_posts_campaign
on public.posts(campaign_id);

create index if not exists idx_posts_creator
on public.posts(creator_id);

create index if not exists idx_campaign_creators_campaign
on public.campaign_creators(campaign_id);

create index if not exists idx_campaign_creators_creator
on public.campaign_creators(creator_id);