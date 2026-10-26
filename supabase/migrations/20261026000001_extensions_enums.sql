-- supabase/migrations/20261026000001_extensions_enums.sql

create extension if not exists citext;
create extension if not exists btree_gist;
create extension if not exists pg_trgm;

create type public.transaction_type as enum ('sale', 'rent', 'short_let');

create type public.property_status as enum (
  'draft',
  'pending_review',
  'published',
  'reserved',
  'sold',
  'rented',
  'unavailable',
  'archived'
);

create type public.billing_frequency as enum (
  'one_off',
  'per_night',
  'per_week',
  'per_month',
  'per_year'
);

create type public.furnishing_status as enum (
  'unfurnished',
  'semi_furnished',
  'furnished',
  'serviced'
);

create type public.area_unit as enum ('sqm', 'sqft', 'hectare', 'acre', 'plot');

create type public.location_type as enum ('country', 'state', 'city', 'district');

create type public.charge_type as enum (
  'caution_deposit',
  'agency_fee',
  'legal_fee',
  'service_charge',
  'agreement_fee',
  'other'
);

create type public.media_type as enum ('image', 'video');

create type public.media_status as enum ('uploading', 'processing', 'ready', 'failed');

create type public.enquiry_category as enum (
  'general',
  'buying',
  'renting',
  'short_let',
  'property_enquiry',
  'listing_submission',
  'property_management',
  'investment',
  'verification_request',
  'report_listing',
  'data_request',
  'other'
);

create type public.enquiry_status as enum (
  'new',
  'contacted',
  'inspection_scheduled',
  'in_progress',
  'converted',
  'closed',
  'spam'
);

create type public.inspection_status as enum (
  'requested',
  'confirmed',
  'rescheduled',
  'cancelled',
  'completed',
  'no_show'
);

create type public.post_status as enum ('draft', 'scheduled', 'published', 'archived');

create type public.subscriber_status as enum ('subscribed', 'unsubscribed');

create type public.notification_status as enum ('queued', 'sent', 'failed', 'skipped');

create type public.notification_channel as enum ('email', 'sms', 'whatsapp');
