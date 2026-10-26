-- supabase/seed-demo.sql

insert into public.properties (
  reference, title, slug, description, transaction_type, category_id, status, price, currency, billing_frequency,
  location_id, bedrooms, bathrooms, toilets, parking_spaces, floor_area, land_area, area_unit, furnishing,
  amenities, title_document, is_featured, is_demo, keep_public_page
)
select '', d.title, d.slug, d.description, d.tx::public.transaction_type, c.id, 'published', d.price, 'NGN',
  d.billing::public.billing_frequency, l.id, d.beds, d.baths, d.toilets, d.parking, d.floor, d.land,
  d.unit::public.area_unit, d.furnishing::public.furnishing_status, d.amenities, d.title_doc, d.featured, true, true
from (values
  ('Demo: 4-bedroom terrace duplex with BQ', 'demo-4-bedroom-terrace-duplex-jabi',
   'Demonstration listing for testing the website. Not a real property.' || chr(10) || chr(10) || 'Shows how a sale listing with charges, specifications and amenities appears.',
   'sale', 'houses-duplexes', 185000000::numeric, 'one_off', 'abuja-jabi', 4, 5, 6, 3, 320::numeric, 450::numeric, 'sqm', null,
   array['24-hour power', 'Borehole water', 'Boys'' quarters', 'Fitted kitchen'], 'Certificate of Occupancy', true),
  ('Demo: 3-bedroom serviced apartment', 'demo-3-bedroom-serviced-apartment-wuse-2',
   'Demonstration listing for testing the website. Not a real property.',
   'rent', 'apartments-flats', 9500000::numeric, 'per_year', 'abuja-wuse-2', 3, 3, 4, 2, 180::numeric, null, 'sqm', 'serviced',
   array['Swimming pool', 'Gym', 'Elevator', 'Security'], null, true),
  ('Demo: 1,000 m² residential plot', 'demo-1000-sqm-residential-plot-guzape',
   'Demonstration listing for testing the website. Not a real property.',
   'sale', 'land-plots', 220000000::numeric, 'one_off', 'abuja-guzape', null, null, null, null, null, 1000::numeric, 'sqm', null,
   array[]::text[], 'Right of Occupancy', false),
  ('Demo: Furnished 2-bedroom short-let', 'demo-furnished-2-bedroom-short-let-maitama',
   'Demonstration listing for testing the website. Not a real property.',
   'short_let', 'short-let-serviced', 85000::numeric, 'per_night', 'abuja-maitama', 2, 2, 3, 1, 120::numeric, null, 'sqm', 'furnished',
   array['Internet', 'Air conditioning', '24-hour power'], null, false),
  ('Demo: Open-plan office floor', 'demo-open-plan-office-floor-cbd',
   'Demonstration listing for testing the website. Not a real property.',
   'rent', 'office-spaces', 42000000::numeric, 'per_year', 'abuja-cbd', null, 2, 4, 10, 650::numeric, null, 'sqm', 'unfurnished',
   array['Elevator', 'Parking', 'Security'], null, false),
  ('Demo: Warehouse with loading bay', 'demo-warehouse-with-loading-bay-idu',
   'Demonstration listing for testing the website. Not a real property.',
   'sale', 'warehouses-industrial', 480000000::numeric, 'one_off', 'abuja-idu', null, 2, 2, 6, 2400::numeric, 4000::numeric, 'sqm', null,
   array['Loading bay', '3-phase power'], 'Certificate of Occupancy', false)
) as d(title, slug, description, tx, category, price, billing, location, beds, baths, toilets, parking, floor, land, unit, furnishing, amenities, title_doc, featured)
join public.property_categories c on c.slug = d.category
join public.locations l on l.slug = d.location
on conflict (slug) do nothing;

insert into public.property_charges (property_id, charge_type, label, amount, billing_frequency, notes, sort_order)
select p.id, x.charge_type::public.charge_type, x.label, x.amount, x.billing::public.billing_frequency, x.notes, x.ord
from public.properties p
join (values
  ('demo-3-bedroom-serviced-apartment-wuse-2', 'caution_deposit', 'Caution deposit', 1000000::numeric, 'one_off', 'Refundable at the end of the tenancy, subject to condition', 1),
  ('demo-3-bedroom-serviced-apartment-wuse-2', 'service_charge', 'Service charge', 2500000::numeric, 'per_year', 'Covers power, water, cleaning and security', 2),
  ('demo-3-bedroom-serviced-apartment-wuse-2', 'agency_fee', 'Agency fee', 10::numeric, 'one_off', '10% of one year''s rent', 3),
  ('demo-3-bedroom-serviced-apartment-wuse-2', 'legal_fee', 'Legal fee', 10::numeric, 'one_off', '10% of one year''s rent', 4),
  ('demo-furnished-2-bedroom-short-let-maitama', 'caution_deposit', 'Refundable caution deposit', 100000::numeric, 'one_off', null, 1),
  ('demo-4-bedroom-terrace-duplex-jabi', 'agency_fee', 'Agency fee', 5::numeric, 'one_off', '5% of the purchase price', 1)
) as x(slug, charge_type, label, amount, billing, notes, ord) on x.slug = p.slug
where not exists (select 1 from public.property_charges pc where pc.property_id = p.id);

update public.property_charges set is_percentage = true
where charge_type in ('agency_fee', 'legal_fee')
  and property_id in (select id from public.properties where is_demo);
