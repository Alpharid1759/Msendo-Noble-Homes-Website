-- supabase/migrations/20261026000003_functions_triggers.sql

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger staff_profiles_updated_at before update on public.staff_profiles
  for each row execute function public.set_updated_at();
create trigger properties_updated_at before update on public.properties
  for each row execute function public.set_updated_at();
create trigger media_assets_updated_at before update on public.media_assets
  for each row execute function public.set_updated_at();
create trigger enquiries_updated_at before update on public.enquiries
  for each row execute function public.set_updated_at();
create trigger inspections_updated_at before update on public.inspections
  for each row execute function public.set_updated_at();
create trigger blog_posts_updated_at before update on public.blog_posts
  for each row execute function public.set_updated_at();

create or replace function public.current_staff_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select sp.role_key
  from public.staff_profiles sp
  where sp.id = auth.uid() and sp.is_active
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff_profiles sp
    where sp.id = auth.uid() and sp.is_active
  )
$$;

create or replace function public.has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    join public.role_permissions rp on rp.role_key = sp.role_key
    where sp.id = auth.uid()
      and sp.is_active
      and rp.permission_key = p_permission
  )
$$;

create or replace function public.my_permissions()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select rp.permission_key
  from public.staff_profiles sp
  join public.role_permissions rp on rp.role_key = sp.role_key
  where sp.id = auth.uid() and sp.is_active
$$;

create or replace function public.properties_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text;
  v_loc record;
  v_parent record;
  v_grand record;
begin
  if tg_op = 'INSERT' and (new.reference is null or new.reference = '') then
    v_prefix := case new.transaction_type
      when 'sale' then 'S'
      when 'rent' then 'R'
      else 'SL'
    end;
    new.reference := 'MNH-' || v_prefix || '-' || lpad(nextval('public.property_reference_seq')::text, 5, '0');
  end if;

  if tg_op = 'INSERT' or new.location_id is distinct from old.location_id then
    select id, parent_id, type, name into v_loc from public.locations where id = new.location_id;
    new.district_name := null;
    new.city_name := null;
    new.state_name := null;
    if v_loc.type = 'district' then
      new.district_name := v_loc.name;
      select id, parent_id, type, name into v_parent from public.locations where id = v_loc.parent_id;
      if v_parent.type = 'city' then
        new.city_name := v_parent.name;
        select id, parent_id, type, name into v_grand from public.locations where id = v_parent.parent_id;
        if v_grand.type = 'state' then new.state_name := v_grand.name; end if;
      elsif v_parent.type = 'state' then
        new.state_name := v_parent.name;
      end if;
    elsif v_loc.type = 'city' then
      new.city_name := v_loc.name;
      select id, parent_id, type, name into v_parent from public.locations where id = v_loc.parent_id;
      if v_parent.type = 'state' then new.state_name := v_parent.name; end if;
    elsif v_loc.type = 'state' then
      new.state_name := v_loc.name;
    end if;
  end if;

  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  if new.title_verified and new.title_verified_at is null then
    new.title_verified_at := now();
  elsif not new.title_verified then
    new.title_verified_at := null;
  end if;

  if new.transaction_type = 'sale' and new.billing_frequency <> 'one_off' then
    new.billing_frequency := 'one_off';
  end if;

  if tg_op = 'UPDATE' and new.slug is distinct from old.slug and old.published_at is not null then
    insert into public.property_slug_redirects (old_slug, property_id)
    values (old.slug, new.id)
    on conflict (old_slug) do update set property_id = excluded.property_id;
    delete from public.property_slug_redirects where old_slug = new.slug;
  end if;

  return new;
end;
$$;

create trigger properties_before_write
  before insert or update on public.properties
  for each row execute function public.properties_before_write();

create or replace function public.inspections_before_write()
returns trigger
language plpgsql
as $$
begin
  if new.scheduled_at is not null then
    new.slot := tstzrange(
      new.scheduled_at,
      new.scheduled_at + make_interval(mins => new.duration_minutes),
      '[)'
    );
  else
    new.slot := null;
  end if;

  if new.status = 'confirmed' and (tg_op = 'INSERT' or old.status is distinct from 'confirmed') then
    new.confirmed_at := now();
  end if;

  return new;
end;
$$;

create trigger inspections_before_write
  before insert or update on public.inspections
  for each row execute function public.inspections_before_write();

create or replace function public.inspections_log_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.inspection_events (inspection_id, from_status, to_status, scheduled_at, actor_id)
    values (new.id, null, new.status, new.scheduled_at, auth.uid());
  elsif new.status is distinct from old.status or new.scheduled_at is distinct from old.scheduled_at then
    insert into public.inspection_events (inspection_id, from_status, to_status, scheduled_at, actor_id)
    values (new.id, old.status, new.status, new.scheduled_at, auth.uid());
  end if;
  return new;
end;
$$;

create trigger inspections_log_event
  after insert or update on public.inspections
  for each row execute function public.inspections_log_event();

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_diff jsonb := '{}'::jsonb;
  v_key text;
  v_email text;
begin
  if auth.uid() is null then
    return coalesce(new, old);
  end if;

  select email::text into v_email from public.staff_profiles where id = auth.uid();

  if tg_op = 'UPDATE' then
    v_old := to_jsonb(old) - 'search_vector' - 'updated_at';
    v_new := to_jsonb(new) - 'search_vector' - 'updated_at';
    for v_key in select jsonb_object_keys(v_new) loop
      if v_new -> v_key is distinct from v_old -> v_key then
        v_diff := v_diff || jsonb_build_object(v_key, jsonb_build_array(v_old -> v_key, v_new -> v_key));
      end if;
    end loop;
    if v_diff = '{}'::jsonb then
      return new;
    end if;
  elsif tg_op = 'INSERT' then
    v_diff := to_jsonb(new) - 'search_vector';
  else
    v_diff := to_jsonb(old) - 'search_vector';
  end if;

  insert into public.audit_logs (actor_id, actor_email, action, entity_type, entity_id, changes)
  values (
    auth.uid(),
    v_email,
    lower(tg_op),
    tg_table_name,
    coalesce((to_jsonb(coalesce(new, old)) ->> 'id'), (to_jsonb(coalesce(new, old)) ->> 'key')),
    v_diff
  );

  return coalesce(new, old);
end;
$$;

create trigger audit_properties after insert or update or delete on public.properties
  for each row execute function public.audit_row_change();
create trigger audit_media_assets after insert or update or delete on public.media_assets
  for each row execute function public.audit_row_change();
create trigger audit_enquiries after update or delete on public.enquiries
  for each row execute function public.audit_row_change();
create trigger audit_inspections after update or delete on public.inspections
  for each row execute function public.audit_row_change();
create trigger audit_blog_posts after insert or update or delete on public.blog_posts
  for each row execute function public.audit_row_change();
create trigger audit_staff_profiles after insert or update or delete on public.staff_profiles
  for each row execute function public.audit_row_change();
create trigger audit_site_settings after insert or update or delete on public.site_settings
  for each row execute function public.audit_row_change();
create trigger audit_role_permissions after insert or delete on public.role_permissions
  for each row execute function public.audit_row_change();

create or replace function public.check_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz;
  v_hits int;
begin
  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.rate_limits (bucket_key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (bucket_key, window_start)
  do update set hits = public.rate_limits.hits + 1
  returning hits into v_hits;

  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_limit;
end;
$$;

create or replace function public.location_descendants(p_slug text)
returns setof uuid
language sql
stable
as $$
  with recursive tree as (
    select id from public.locations where slug = p_slug
    union all
    select l.id from public.locations l join tree t on l.parent_id = t.id
  )
  select id from tree
$$;

create or replace function public.ensure_single_featured_media()
returns trigger
language plpgsql
as $$
begin
  if new.is_featured then
    update public.property_media
      set is_featured = false
      where property_id = new.property_id
        and media_id <> new.media_id
        and is_featured;
  end if;
  return new;
end;
$$;

create trigger property_media_single_featured
  before insert or update of is_featured on public.property_media
  for each row when (new.is_featured)
  execute function public.ensure_single_featured_media();
