-- supabase/seed.sql

insert into public.roles (key, name, description, rank) values
  ('super_admin', 'Super Administrator', 'Full access including staff accounts and security settings', 1),
  ('admin', 'Administrator', 'Full operational access except staff account management', 2),
  ('property_manager', 'Property Manager', 'Manages and publishes listings, enquiries and inspections', 3),
  ('listing_editor', 'Listing Editor', 'Creates and edits draft listings and uploads media', 4),
  ('content_editor', 'Marketing and Content Editor', 'Writes and publishes blog articles', 5),
  ('support_officer', 'Enquiry and Customer Support Officer', 'Handles enquiries and inspection requests', 6)
on conflict (key) do update set name = excluded.name, description = excluded.description, rank = excluded.rank;

insert into public.permissions (key, description) values
  ('dashboard.view', 'View the admin dashboard'),
  ('properties.view', 'View all listings including drafts'),
  ('properties.create', 'Create listings'),
  ('properties.edit', 'Edit listings'),
  ('properties.publish', 'Publish, unpublish, archive and change listing status'),
  ('properties.delete', 'Permanently delete listings'),
  ('properties.export', 'Export listing records'),
  ('media.upload', 'Upload and edit media'),
  ('media.delete', 'Delete media'),
  ('enquiries.view', 'View enquiries and customer contact details'),
  ('enquiries.manage', 'Update, assign and annotate enquiries'),
  ('inspections.view', 'View inspection requests'),
  ('inspections.manage', 'Confirm, reschedule and cancel inspections'),
  ('blog.view', 'View all articles including drafts'),
  ('blog.write', 'Create and edit articles'),
  ('blog.publish', 'Publish, schedule and archive articles'),
  ('newsletter.view', 'View newsletter subscribers'),
  ('taxonomy.manage', 'Manage property categories and locations'),
  ('settings.manage', 'Manage site settings'),
  ('users.manage', 'Manage staff accounts and roles'),
  ('audit.view', 'View audit logs and consent records')
on conflict (key) do update set description = excluded.description;

insert into public.role_permissions (role_key, permission_key)
select 'super_admin', key from public.permissions
on conflict do nothing;

insert into public.role_permissions (role_key, permission_key)
select 'admin', key from public.permissions where key <> 'users.manage'
on conflict do nothing;

insert into public.role_permissions (role_key, permission_key)
select 'property_manager', unnest(array[
  'dashboard.view', 'properties.view', 'properties.create', 'properties.edit', 'properties.publish',
  'properties.export', 'media.upload', 'media.delete', 'enquiries.view', 'enquiries.manage',
  'inspections.view', 'inspections.manage', 'taxonomy.manage'
])
on conflict do nothing;

insert into public.role_permissions (role_key, permission_key)
select 'listing_editor', unnest(array[
  'dashboard.view', 'properties.view', 'properties.create', 'properties.edit', 'media.upload'
])
on conflict do nothing;

insert into public.role_permissions (role_key, permission_key)
select 'content_editor', unnest(array[
  'dashboard.view', 'blog.view', 'blog.write', 'blog.publish', 'media.upload'
])
on conflict do nothing;

insert into public.role_permissions (role_key, permission_key)
select 'support_officer', unnest(array[
  'dashboard.view', 'properties.view', 'enquiries.view', 'enquiries.manage',
  'inspections.view', 'inspections.manage'
])
on conflict do nothing;

insert into public.property_categories (name, slug, description, icon, sort_order) values
  ('Houses & Duplexes', 'houses-duplexes', 'Detached, semi-detached and terraced houses and duplexes', 'home', 1),
  ('Apartments & Flats', 'apartments-flats', 'Apartments, flats and penthouses', 'building', 2),
  ('Land & Plots', 'land-plots', 'Residential, commercial and mixed-use land', 'map', 3),
  ('Commercial Properties', 'commercial', 'Retail outlets, plazas and mixed-use buildings', 'store', 4),
  ('Office Spaces', 'office-spaces', 'Offices and co-working spaces', 'briefcase', 5),
  ('Warehouses & Industrial', 'warehouses-industrial', 'Warehouses, factories and industrial facilities', 'warehouse', 6),
  ('Short-let & Serviced', 'short-let-serviced', 'Short-let apartments and serviced accommodation', 'key', 7),
  ('Luxury Properties', 'luxury', 'Premium homes in prime locations', 'gem', 8),
  ('Estates & Developments', 'estates-developments', 'Estates, off-plan projects and development opportunities', 'landmark', 9)
on conflict (slug) do nothing;

insert into public.locations (type, name, slug, sort_order) values
  ('state', 'Federal Capital Territory', 'fct', 1)
on conflict (slug) do nothing;

insert into public.locations (parent_id, type, name, slug, sort_order)
select id, 'city', 'Abuja', 'abuja', 1 from public.locations where slug = 'fct'
on conflict (slug) do nothing;

insert into public.locations (parent_id, type, name, slug, is_featured, sort_order)
select l.id, 'district', d.name, d.slug, d.featured, d.ord
from public.locations l
cross join (values
  ('Maitama', 'abuja-maitama', true, 1),
  ('Asokoro', 'abuja-asokoro', true, 2),
  ('Wuse', 'abuja-wuse', false, 3),
  ('Wuse II', 'abuja-wuse-2', true, 4),
  ('Jabi', 'abuja-jabi', true, 5),
  ('Utako', 'abuja-utako', false, 6),
  ('Central Business District', 'abuja-cbd', true, 7),
  ('Garki', 'abuja-garki', false, 8),
  ('Gwarinpa', 'abuja-gwarinpa', true, 9),
  ('Katampe', 'abuja-katampe', false, 10),
  ('Guzape', 'abuja-guzape', true, 11),
  ('Life Camp', 'abuja-life-camp', true, 12),
  ('Jahi', 'abuja-jahi', false, 13),
  ('Mabushi', 'abuja-mabushi', false, 14),
  ('Wuye', 'abuja-wuye', false, 15),
  ('Gudu', 'abuja-gudu', false, 16),
  ('Apo', 'abuja-apo', false, 17),
  ('Lokogoma', 'abuja-lokogoma', true, 18),
  ('Galadimawa', 'abuja-galadimawa', false, 19),
  ('Lugbe', 'abuja-lugbe', false, 20),
  ('Kubwa', 'abuja-kubwa', false, 21),
  ('Dawaki', 'abuja-dawaki', false, 22),
  ('Kado', 'abuja-kado', false, 23),
  ('Idu Industrial Area', 'abuja-idu', false, 24)
) as d(name, slug, featured, ord)
where l.slug = 'abuja'
on conflict (slug) do nothing;

insert into public.blog_categories (name, slug, sort_order) values
  ('Market Updates', 'market-updates', 1),
  ('Investment', 'investment', 2),
  ('Neighbourhood Guides', 'neighbourhood-guides', 3),
  ('Buying Guides', 'buying-guides', 4),
  ('Renting Guides', 'renting-guides', 5),
  ('Land & Documentation', 'land-documentation', 6),
  ('Property Management', 'property-management', 7),
  ('Commercial Property', 'commercial-property', 8),
  ('Development Updates', 'development-updates', 9)
on conflict (slug) do nothing;

insert into public.site_settings (key, value, is_public, description) values
  ('company', jsonb_build_object(
      'brand_name', 'Msendo Noble Homes',
      'legal_name', 'Msendo Integrated Limited',
      'tagline', 'Property. Opportunity. Confidence.',
      'short_description', 'The real estate division of Msendo Integrated Limited, helping buyers, tenants, investors, landlords and developers across Abuja.',
      'rc_number', null
    ), true, 'Company identity'),
  ('contact', jsonb_build_object(
      'phone', '+2349028748800',
      'phone_display', '0902 874 8800',
      'email', 'MsendoIntegratedltd@gmail.com',
      'whatsapp_number', '2349028748800',
      'whatsapp_link', 'https://wa.link/4w83p2',
      'address_line', 'Plot 833 Emmanuel Aguna, Jabi District',
      'city', 'Abuja',
      'state', 'Federal Capital Territory',
      'country', 'Nigeria',
      'maps_url', 'https://www.google.com/maps/search/?api=1&query=Plot+833+Emmanuel+Aguna+Jabi+Abuja',
      'business_hours', null
    ), true, 'Public contact details'),
  ('social', jsonb_build_object(
      'facebook', null, 'instagram', null, 'x', null, 'linkedin', null, 'youtube', null, 'tiktok', null
    ), true, 'Social profile URLs'),
  ('brand', jsonb_build_object('logo_url', null, 'logo_white_url', null), true, 'Logo files'),
  ('seo', jsonb_build_object(
      'default_title', 'Msendo Noble Homes | Property for Sale and Rent in Abuja',
      'default_description', 'Find houses, apartments, land, offices and commercial property for sale and rent in Abuja with Msendo Noble Homes, the real estate division of Msendo Integrated Limited.',
      'og_image_url', null,
      'google_site_verification', null
    ), true, 'Search engine defaults'),
  ('analytics', jsonb_build_object('ga_measurement_id', null, 'require_consent', true), true, 'Analytics'),
  ('privacy', jsonb_build_object(
      'consent_version', '2026-10-26',
      'data_protection_email', 'MsendoIntegratedltd@gmail.com',
      'enquiry_retention_months', 24
    ), true, 'Privacy and consent'),
  ('inspections', jsonb_build_object(
      'slot_minutes', 60, 'earliest_hour', 9, 'latest_hour', 17,
      'min_notice_hours', 24, 'max_days_ahead', 60, 'allow_sundays', false
    ), true, 'Inspection booking rules'),
  ('testimonials', jsonb_build_object('items', jsonb_build_array()), true, 'Customer testimonials published with permission'),
  ('uploads', jsonb_build_object(
      'image_max_mb', 15, 'video_max_mb', 500, 'video_max_seconds', 900, 'max_media_per_property', 60
    ), false, 'Upload limits'),
  ('notifications', jsonb_build_object(
      'admin_emails', jsonb_build_array('MsendoIntegratedltd@gmail.com'),
      'send_customer_confirmations', true
    ), false, 'Notification recipients')
on conflict (key) do nothing;
