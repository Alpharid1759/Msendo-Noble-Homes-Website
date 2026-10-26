-- supabase/migrations/20261026000004_rls_and_views.sql

create or replace function public.enforce_publish_permissions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if tg_table_name = 'properties' then
    if new.status not in ('draft', 'pending_review')
       and (tg_op = 'INSERT' or new.status is distinct from old.status)
       and not public.has_permission('properties.publish') then
      raise exception 'You do not have permission to change a listing to status %', new.status
        using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and old.status not in ('draft', 'pending_review')
       and not public.has_permission('properties.publish')
       and (new.price is distinct from old.price
         or new.transaction_type is distinct from old.transaction_type
         or new.is_featured is distinct from old.is_featured
         or new.title_verified is distinct from old.title_verified) then
      raise exception 'Only publishers can change price, type, featured or verification on a live listing'
        using errcode = '42501';
    end if;
    if new.title_verified and (tg_op = 'INSERT' or not old.title_verified)
       and not public.has_permission('properties.publish') then
      raise exception 'Only publishers can mark a title as verified' using errcode = '42501';
    end if;
  elsif tg_table_name = 'blog_posts' then
    if new.status in ('published', 'scheduled')
       and (tg_op = 'INSERT' or new.status is distinct from old.status)
       and not public.has_permission('blog.publish') then
      raise exception 'You do not have permission to publish articles' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger properties_enforce_publish before insert or update on public.properties
  for each row execute function public.enforce_publish_permissions();
create trigger blog_posts_enforce_publish before insert or update on public.blog_posts
  for each row execute function public.enforce_publish_permissions();

create or replace function public.protect_staff_profiles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return coalesce(new, old);
  end if;
  if tg_op in ('UPDATE', 'DELETE') and old.role_key = 'super_admin'
     and public.current_staff_role() is distinct from 'super_admin' then
    raise exception 'Only a super administrator can modify another super administrator' using errcode = '42501';
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.role_key = 'super_admin'
     and public.current_staff_role() is distinct from 'super_admin' then
    raise exception 'Only a super administrator can grant the super administrator role' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and old.id = auth.uid()
     and (new.role_key is distinct from old.role_key or new.is_active is distinct from old.is_active) then
    raise exception 'You cannot change your own role or deactivate yourself' using errcode = '42501';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger staff_profiles_protect before insert or update or delete on public.staff_profiles
  for each row execute function public.protect_staff_profiles();

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.property_categories enable row level security;
alter table public.locations enable row level security;
alter table public.properties enable row level security;
alter table public.property_slug_redirects enable row level security;
alter table public.property_charges enable row level security;
alter table public.media_assets enable row level security;
alter table public.property_media enable row level security;
alter table public.enquiries enable row level security;
alter table public.enquiry_notes enable row level security;
alter table public.inspections enable row level security;
alter table public.inspection_events enable row level security;
alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.consent_records enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.rate_limits enable row level security;

create policy roles_staff_read on public.roles for select to authenticated using (public.is_staff());
create policy permissions_staff_read on public.permissions for select to authenticated using (public.is_staff());
create policy role_permissions_staff_read on public.role_permissions for select to authenticated using (public.is_staff());
create policy role_permissions_manage on public.role_permissions for all to authenticated
  using (public.has_permission('users.manage')) with check (public.has_permission('users.manage'));

create policy staff_read on public.staff_profiles for select to authenticated using (public.is_staff());
create policy staff_insert on public.staff_profiles for insert to authenticated with check (public.has_permission('users.manage'));
create policy staff_update on public.staff_profiles for update to authenticated
  using (public.has_permission('users.manage') or id = auth.uid())
  with check (public.has_permission('users.manage') or id = auth.uid());
create policy staff_delete on public.staff_profiles for delete to authenticated using (public.has_permission('users.manage'));

create policy settings_staff_read on public.site_settings for select to authenticated using (public.is_staff());
create policy settings_manage on public.site_settings for all to authenticated
  using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));

create policy categories_public_read on public.property_categories for select to anon, authenticated
  using (is_active or public.is_staff());
create policy categories_manage on public.property_categories for all to authenticated
  using (public.has_permission('taxonomy.manage')) with check (public.has_permission('taxonomy.manage'));

create policy locations_public_read on public.locations for select to anon, authenticated
  using (is_active or public.is_staff());
create policy locations_manage on public.locations for all to authenticated
  using (public.has_permission('taxonomy.manage')) with check (public.has_permission('taxonomy.manage'));

create policy properties_staff_read on public.properties for select to authenticated using (public.has_permission('properties.view'));
create policy properties_insert on public.properties for insert to authenticated with check (public.has_permission('properties.create'));
create policy properties_update on public.properties for update to authenticated
  using (public.has_permission('properties.edit')) with check (public.has_permission('properties.edit'));
create policy properties_delete on public.properties for delete to authenticated using (public.has_permission('properties.delete'));

create policy slug_redirects_read on public.property_slug_redirects for select to anon, authenticated using (true);

create policy charges_staff_read on public.property_charges for select to authenticated using (public.has_permission('properties.view'));
create policy charges_write on public.property_charges for all to authenticated
  using (public.has_permission('properties.edit')) with check (public.has_permission('properties.edit'));

create policy media_staff_read on public.media_assets for select to authenticated
  using (public.has_permission('properties.view') or public.has_permission('blog.view'));
create policy media_insert on public.media_assets for insert to authenticated with check (public.has_permission('media.upload'));
create policy media_update on public.media_assets for update to authenticated
  using (public.has_permission('media.upload')) with check (public.has_permission('media.upload'));
create policy media_delete on public.media_assets for delete to authenticated using (public.has_permission('media.delete'));

create policy property_media_read on public.property_media for select to authenticated using (public.has_permission('properties.view'));
create policy property_media_write on public.property_media for all to authenticated
  using (public.has_permission('properties.edit')) with check (public.has_permission('properties.edit'));

create policy enquiries_read on public.enquiries for select to authenticated using (public.has_permission('enquiries.view'));
create policy enquiries_update on public.enquiries for update to authenticated
  using (public.has_permission('enquiries.manage')) with check (public.has_permission('enquiries.manage'));
create policy enquiries_delete on public.enquiries for delete to authenticated using (public.has_permission('enquiries.manage'));

create policy enquiry_notes_read on public.enquiry_notes for select to authenticated using (public.has_permission('enquiries.view'));
create policy enquiry_notes_insert on public.enquiry_notes for insert to authenticated
  with check (public.has_permission('enquiries.manage') and author_id = auth.uid());

create policy inspections_read on public.inspections for select to authenticated using (public.has_permission('inspections.view'));
create policy inspections_update on public.inspections for update to authenticated
  using (public.has_permission('inspections.manage')) with check (public.has_permission('inspections.manage'));

create policy inspection_events_read on public.inspection_events for select to authenticated using (public.has_permission('inspections.view'));

create policy blog_categories_public_read on public.blog_categories for select to anon, authenticated using (true);
create policy blog_categories_manage on public.blog_categories for all to authenticated
  using (public.has_permission('blog.publish')) with check (public.has_permission('blog.publish'));

create policy blog_posts_staff_read on public.blog_posts for select to authenticated using (public.has_permission('blog.view'));
create policy blog_posts_insert on public.blog_posts for insert to authenticated with check (public.has_permission('blog.write'));
create policy blog_posts_update on public.blog_posts for update to authenticated
  using (public.has_permission('blog.write')) with check (public.has_permission('blog.write'));
create policy blog_posts_delete on public.blog_posts for delete to authenticated using (public.has_permission('blog.publish'));

create policy newsletter_read on public.newsletter_subscribers for select to authenticated using (public.has_permission('newsletter.view'));
create policy consent_read on public.consent_records for select to authenticated using (public.has_permission('audit.view'));
create policy notifications_read on public.notifications for select to authenticated using (public.has_permission('enquiries.view'));
create policy audit_read on public.audit_logs for select to authenticated using (public.has_permission('audit.view'));

revoke all on function public.check_rate_limit(text, int, int) from public, anon, authenticated;

create view public.public_properties
with (security_barrier = true)
as
select
  p.id,
  p.reference,
  p.title,
  p.slug,
  p.description,
  p.transaction_type,
  p.status,
  (p.status in ('published', 'reserved')) as is_listed,
  case when p.price_on_request then null else p.price end as price,
  p.price_on_request,
  p.currency,
  p.billing_frequency,
  p.is_negotiable,
  c.id as category_id,
  c.name as category_name,
  c.slug as category_slug,
  p.location_id,
  p.country,
  p.state_name,
  p.city_name,
  p.district_name,
  case when p.show_exact_address then p.address_line else null end as address_line,
  case when p.show_map_pin then p.latitude else null end as latitude,
  case when p.show_map_pin then p.longitude else null end as longitude,
  p.bedrooms,
  p.bathrooms,
  p.toilets,
  p.parking_spaces,
  p.land_area,
  p.floor_area,
  p.area_unit,
  p.furnishing,
  p.amenities,
  p.attributes,
  p.available_from,
  p.lease_min_months,
  p.title_document,
  p.title_verified,
  p.title_verified_at,
  p.virtual_tour_url,
  p.is_featured,
  p.is_demo,
  p.seo_title,
  p.seo_description,
  p.search_vector,
  p.published_at,
  p.updated_at,
  cover.variants as cover_variants,
  cover.alt_text as cover_alt,
  coalesce(counts.image_count, 0) as image_count,
  coalesce(counts.video_count, 0) as video_count
from public.properties p
join public.property_categories c on c.id = p.category_id
left join lateral (
  select ma.variants, ma.alt_text
  from public.property_media pm
  join public.media_assets ma on ma.id = pm.media_id
  where pm.property_id = p.id
    and ma.media_type = 'image'
    and ma.status = 'ready'
    and ma.is_published
  order by pm.is_featured desc, pm.sort_order asc, pm.created_at asc
  limit 1
) cover on true
left join lateral (
  select
    count(*) filter (where ma.media_type = 'image')::int as image_count,
    count(*) filter (where ma.media_type = 'video')::int as video_count
  from public.property_media pm
  join public.media_assets ma on ma.id = pm.media_id
  where pm.property_id = p.id and ma.status = 'ready' and ma.is_published
) counts on true
where p.status in ('published', 'reserved')
   or (p.status in ('sold', 'rented', 'unavailable') and p.keep_public_page);

create view public.public_property_media
with (security_barrier = true)
as
select
  ma.id,
  pm.property_id,
  ma.media_type,
  ma.bucket,
  ma.storage_path,
  ma.variants,
  ma.poster_path,
  ma.width,
  ma.height,
  ma.duration_seconds,
  ma.title,
  ma.caption,
  ma.alt_text,
  ma.description,
  pm.sort_order,
  pm.is_featured,
  pm.created_at
from public.property_media pm
join public.media_assets ma on ma.id = pm.media_id
join public.properties p on p.id = pm.property_id
where ma.status = 'ready'
  and ma.is_published
  and (p.status in ('published', 'reserved')
    or (p.status in ('sold', 'rented', 'unavailable') and p.keep_public_page));

create view public.public_property_charges
with (security_barrier = true)
as
select ch.id, ch.property_id, ch.charge_type, ch.label, ch.amount, ch.is_percentage,
       ch.billing_frequency, ch.notes, ch.sort_order
from public.property_charges ch
join public.properties p on p.id = ch.property_id
where p.status in ('published', 'reserved')
   or (p.status in ('sold', 'rented', 'unavailable') and p.keep_public_page);

create view public.public_blog_posts
with (security_barrier = true)
as
select
  b.id,
  b.title,
  b.slug,
  b.excerpt,
  b.body_html,
  b.featured_image_url,
  b.featured_image_alt,
  b.og_image_url,
  coalesce(b.author_name, sp.full_name, 'Msendo Noble Homes') as author_name,
  bc.id as category_id,
  bc.name as category_name,
  bc.slug as category_slug,
  b.tags,
  b.published_at,
  b.updated_at,
  b.reading_minutes,
  b.seo_title,
  b.seo_description,
  b.search_vector
from public.blog_posts b
left join public.blog_categories bc on bc.id = b.category_id
left join public.staff_profiles sp on sp.id = b.author_id
where b.status in ('published', 'scheduled')
  and b.published_at <= now();

create view public.public_site_settings
with (security_barrier = true)
as
select key, value from public.site_settings where is_public;

revoke all on public.public_properties, public.public_property_media, public.public_property_charges,
  public.public_blog_posts, public.public_site_settings from public;
grant select on public.public_properties, public.public_property_media, public.public_property_charges,
  public.public_blog_posts, public.public_site_settings to anon, authenticated;
