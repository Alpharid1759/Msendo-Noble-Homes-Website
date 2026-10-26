-- supabase/migrations/20261026000002_core_tables.sql

create table public.roles (
  key text primary key,
  name text not null,
  description text,
  rank int not null default 100
);

create table public.permissions (
  key text primary key,
  description text not null
);

create table public.role_permissions (
  role_key text not null references public.roles (key) on delete cascade,
  permission_key text not null references public.permissions (key) on delete cascade,
  primary key (role_key, permission_key)
);

create table public.staff_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email citext not null unique,
  full_name text not null,
  phone text,
  job_title text,
  role_key text not null references public.roles (key),
  is_active boolean not null default true,
  is_agent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default false,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.property_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.locations (id) on delete restrict,
  type public.location_type not null,
  name text not null,
  slug text not null unique,
  description text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index locations_parent_idx on public.locations (parent_id);

create sequence public.property_reference_seq start 1001;

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  title text not null check (char_length(title) between 5 and 160),
  slug text not null unique,
  description text not null default '',
  transaction_type public.transaction_type not null,
  category_id uuid not null references public.property_categories (id) on delete restrict,
  status public.property_status not null default 'draft',

  price numeric(15, 2) check (price is null or price >= 0),
  price_on_request boolean not null default false,
  currency char(3) not null default 'NGN',
  billing_frequency public.billing_frequency not null default 'one_off',
  is_negotiable boolean not null default false,

  location_id uuid not null references public.locations (id) on delete restrict,
  country text not null default 'Nigeria',
  state_name text,
  city_name text,
  district_name text,
  address_line text,
  latitude numeric(9, 6) check (latitude is null or latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude is null or longitude between -180 and 180),
  show_exact_address boolean not null default false,
  show_map_pin boolean not null default false,

  bedrooms smallint check (bedrooms is null or bedrooms >= 0),
  bathrooms smallint check (bathrooms is null or bathrooms >= 0),
  toilets smallint check (toilets is null or toilets >= 0),
  parking_spaces smallint check (parking_spaces is null or parking_spaces >= 0),
  land_area numeric(12, 2) check (land_area is null or land_area >= 0),
  floor_area numeric(12, 2) check (floor_area is null or floor_area >= 0),
  area_unit public.area_unit not null default 'sqm',
  furnishing public.furnishing_status,
  amenities text[] not null default '{}',
  attributes jsonb not null default '{}'::jsonb,

  available_from date,
  lease_min_months smallint,
  title_document text,
  title_verified boolean not null default false,
  title_verified_at timestamptz,
  title_notes text,
  virtual_tour_url text,

  is_featured boolean not null default false,
  is_demo boolean not null default false,
  keep_public_page boolean not null default true,

  seo_title text,
  seo_description text,

  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(reference, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(district_name, '') || ' ' || coalesce(city_name, '') || ' ' || coalesce(state_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) stored,

  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,

  constraint price_present check (price_on_request or price is not null)
);

create index properties_status_tx_idx on public.properties (status, transaction_type);
create index properties_category_idx on public.properties (category_id);
create index properties_location_idx on public.properties (location_id);
create index properties_price_idx on public.properties (price);
create index properties_featured_idx on public.properties (is_featured) where is_featured;
create index properties_published_at_idx on public.properties (published_at desc);
create index properties_search_idx on public.properties using gin (search_vector);
create index properties_title_trgm_idx on public.properties using gin (title gin_trgm_ops);

create table public.property_slug_redirects (
  old_slug text primary key,
  property_id uuid not null references public.properties (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.property_charges (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  charge_type public.charge_type not null,
  label text not null,
  amount numeric(15, 2) check (amount is null or amount >= 0),
  is_percentage boolean not null default false,
  billing_frequency public.billing_frequency not null default 'one_off',
  notes text,
  sort_order int not null default 0
);

create index property_charges_property_idx on public.property_charges (property_id);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  media_type public.media_type not null,
  status public.media_status not null default 'processing',
  bucket text not null,
  storage_path text not null,
  variants jsonb not null default '{}'::jsonb,
  poster_path text,
  mime_type text,
  file_size bigint,
  width int,
  height int,
  duration_seconds numeric(10, 2),
  title text,
  caption text,
  alt_text text,
  description text,
  is_published boolean not null default true,
  error_message text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket, storage_path)
);

create index media_assets_type_idx on public.media_assets (media_type, status);

create table public.property_media (
  property_id uuid not null references public.properties (id) on delete cascade,
  media_id uuid not null references public.media_assets (id) on delete restrict,
  sort_order int not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (property_id, media_id)
);

create index property_media_media_idx on public.property_media (media_id);
create unique index property_media_one_featured_idx on public.property_media (property_id) where is_featured;

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties (id) on delete set null,
  property_reference text,
  category public.enquiry_category not null default 'general',
  status public.enquiry_status not null default 'new',
  full_name text not null,
  email citext,
  phone text,
  preferred_contact text,
  subject text,
  message text not null,
  details jsonb not null default '{}'::jsonb,
  source text not null default 'website',
  source_path text,
  consent_given boolean not null default false,
  consent_version text,
  consent_at timestamptz,
  assigned_to uuid references public.staff_profiles (id) on delete set null,
  follow_up_at timestamptz,
  ip_hash text,
  user_agent text,
  dedupe_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enquiries_contact_present check (email is not null or phone is not null)
);

create index enquiries_status_idx on public.enquiries (status, created_at desc);
create index enquiries_property_idx on public.enquiries (property_id);
create index enquiries_assigned_idx on public.enquiries (assigned_to);
create unique index enquiries_dedupe_idx on public.enquiries (dedupe_key) where dedupe_key is not null;

create table public.enquiry_notes (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries (id) on delete cascade,
  author_id uuid references public.staff_profiles (id) on delete set null,
  note text not null,
  created_at timestamptz not null default now()
);

create index enquiry_notes_enquiry_idx on public.enquiry_notes (enquiry_id);

create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete restrict,
  enquiry_id uuid references public.enquiries (id) on delete set null,
  full_name text not null,
  email citext,
  phone text not null,
  requested_at timestamptz not null,
  alternative_at timestamptz,
  scheduled_at timestamptz,
  duration_minutes int not null default 60 check (duration_minutes between 15 and 480),
  time_zone text not null default 'Africa/Lagos',
  slot tstzrange,
  status public.inspection_status not null default 'requested',
  assigned_agent_id uuid references public.staff_profiles (id) on delete set null,
  confirmed_at timestamptz,
  confirmed_by uuid references public.staff_profiles (id) on delete set null,
  attendees smallint not null default 1 check (attendees between 1 and 20),
  customer_notes text,
  internal_notes text,
  consent_given boolean not null default false,
  consent_version text,
  ip_hash text,
  dedupe_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inspections_confirmed_has_schedule check (
    status not in ('confirmed', 'rescheduled', 'completed') or scheduled_at is not null
  ),
  constraint inspections_no_agent_double_booking exclude using gist (
    assigned_agent_id with =,
    slot with &&
  ) where (status in ('confirmed', 'rescheduled') and assigned_agent_id is not null)
);

create index inspections_status_idx on public.inspections (status, requested_at);
create index inspections_property_idx on public.inspections (property_id);
create index inspections_agent_idx on public.inspections (assigned_agent_id);
create unique index inspections_dedupe_idx on public.inspections (dedupe_key) where dedupe_key is not null;

create table public.inspection_events (
  id bigint generated always as identity primary key,
  inspection_id uuid not null references public.inspections (id) on delete cascade,
  from_status public.inspection_status,
  to_status public.inspection_status not null,
  scheduled_at timestamptz,
  actor_id uuid references auth.users (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index inspection_events_inspection_idx on public.inspection_events (inspection_id);

create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order int not null default 0
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 5 and 200),
  slug text not null unique,
  excerpt text,
  body_html text not null default '',
  featured_image_url text,
  featured_image_alt text,
  og_image_url text,
  author_id uuid references public.staff_profiles (id) on delete set null,
  author_name text,
  category_id uuid references public.blog_categories (id) on delete set null,
  tags text[] not null default '{}',
  status public.post_status not null default 'draft',
  published_at timestamptz,
  reading_minutes int not null default 1,
  seo_title text,
  seo_description text,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_scheduled_has_date check (status not in ('scheduled', 'published') or published_at is not null)
);

create index blog_posts_status_idx on public.blog_posts (status, published_at desc);
create index blog_posts_category_idx on public.blog_posts (category_id);
create index blog_posts_tags_idx on public.blog_posts using gin (tags);

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  status public.subscriber_status not null default 'subscribed',
  consent_version text not null,
  consent_at timestamptz not null default now(),
  unsubscribe_token uuid not null unique default gen_random_uuid(),
  source text,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  subject_email citext,
  purpose text not null,
  granted boolean not null,
  policy_version text not null,
  source text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index consent_records_email_idx on public.consent_records (subject_email);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  channel public.notification_channel not null default 'email',
  template text not null,
  recipient text not null,
  subject text,
  status public.notification_status not null default 'queued',
  provider text,
  provider_message_id text,
  error text,
  related_type text,
  related_id uuid,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index notifications_related_idx on public.notifications (related_type, related_id);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  changes jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

create table public.rate_limits (
  bucket_key text not null,
  window_start timestamptz not null,
  hits int not null default 0,
  primary key (bucket_key, window_start)
);
