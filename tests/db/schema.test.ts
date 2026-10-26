// tests/db/schema.test.ts
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { beforeAll, describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../supabase");
const SUPER = "00000000-0000-0000-0000-000000000001";
const EDITOR = "00000000-0000-0000-0000-000000000002";
const AGENT = "00000000-0000-0000-0000-000000000003";
const CONTENT = "00000000-0000-0000-0000-000000000004";

let db: PGlite;

async function as<T>(uid: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(uid ? `set role authenticated; set request.jwt.claim.sub = '${uid}';` : `set role anon; set request.jwt.claim.sub = '';`);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; set request.jwt.claim.sub = '';`);
  }
}

async function ids() {
  const cat = await db.query<{ id: string }>(`select id from public.property_categories where slug = 'houses-duplexes'`);
  const loc = await db.query<{ id: string }>(`select id from public.locations where slug = 'abuja-jabi'`);
  return { categoryId: cat.rows[0].id, locationId: loc.rows[0].id };
}

beforeAll(async () => {
  db = new PGlite({ extensions: { citext, btree_gist, pg_trgm } });
  await db.exec(readFileSync(path.join(root, "tests/supabase-stubs.sql"), "utf8"));
  const migrations = readdirSync(path.join(root, "migrations")).sort();
  for (const file of migrations) {
    await db.exec(readFileSync(path.join(root, "migrations", file), "utf8"));
  }
  await db.exec(readFileSync(path.join(root, "seed.sql"), "utf8"));
  await db.exec(`
    insert into auth.users (id, email) values
      ('${SUPER}', 'super@example.com'),
      ('${EDITOR}', 'editor@example.com'),
      ('${AGENT}', 'agent@example.com'),
      ('${CONTENT}', 'content@example.com');
    insert into public.staff_profiles (id, email, full_name, role_key, is_agent) values
      ('${SUPER}', 'super@example.com', 'Super Admin', 'super_admin', false),
      ('${EDITOR}', 'editor@example.com', 'Listing Editor', 'listing_editor', false),
      ('${AGENT}', 'agent@example.com', 'Agent One', 'property_manager', true),
      ('${CONTENT}', 'content@example.com', 'Content Editor', 'content_editor', false);
  `);
}, 60_000);

describe("schema", () => {
  it("seeds roles, permissions, categories and Abuja districts", async () => {
    const r = await db.query<{ n: number }>(`select count(*)::int n from public.locations where type = 'district'`);
    expect(r.rows[0].n).toBeGreaterThan(20);
    const p = await db.query<{ n: number }>(`select count(*)::int n from public.role_permissions where role_key = 'super_admin'`);
    expect(p.rows[0].n).toBe(21);
  });

  it("generates references and denormalises location names", async () => {
    const { categoryId, locationId } = await ids();
    const res = await as(SUPER, () =>
      db.query<{ reference: string; district_name: string; city_name: string; state_name: string }>(
        `insert into public.properties (title, slug, transaction_type, category_id, location_id, price, status)
         values ('Four bedroom duplex in Jabi', 'four-bed-duplex-jabi', 'sale', $1, $2, 250000000, 'published')
         returning reference, district_name, city_name, state_name`,
        [categoryId, locationId],
      ),
    );
    expect(res.rows[0].reference).toMatch(/^MNH-S-\d{5}$/);
    expect(res.rows[0].district_name).toBe("Jabi");
    expect(res.rows[0].city_name).toBe("Abuja");
    expect(res.rows[0].state_name).toBe("Federal Capital Territory");
  });

  it("hides base tables from anonymous users but exposes the public view", async () => {
    const base = await as(null, () => db.query(`select id from public.properties`));
    expect(base.rows).toHaveLength(0);
    const view = await as(null, () => db.query<{ slug: string; address_line: string | null }>(`select slug, address_line from public.public_properties`));
    expect(view.rows.map((r) => r.slug)).toContain("four-bed-duplex-jabi");
    expect(view.rows[0].address_line).toBeNull();
  });

  it("does not expose drafts publicly", async () => {
    const { categoryId, locationId } = await ids();
    await as(EDITOR, () =>
      db.query(
        `insert into public.properties (title, slug, transaction_type, category_id, location_id, price, billing_frequency, status)
         values ('Two bedroom flat in Jabi', 'two-bed-flat-jabi', 'rent', $1, $2, 4500000, 'per_year', 'draft')`,
        [categoryId, locationId],
      ),
    );
    const view = await as(null, () => db.query(`select 1 from public.public_properties where slug = 'two-bed-flat-jabi'`));
    expect(view.rows).toHaveLength(0);
  });

  it("stops a listing editor from publishing", async () => {
    await expect(
      as(EDITOR, () => db.query(`update public.properties set status = 'published' where slug = 'two-bed-flat-jabi'`)),
    ).rejects.toThrow(/permission/);
  });

  it("lets a property manager publish and records an audit entry", async () => {
    await as(AGENT, () => db.query(`update public.properties set status = 'published' where slug = 'two-bed-flat-jabi'`));
    const audit = await db.query<{ n: number }>(
      `select count(*)::int n from public.audit_logs where entity_type = 'properties' and actor_id = $1`,
      [AGENT],
    );
    expect(audit.rows[0].n).toBeGreaterThan(0);
  });

  it("forces sale listings to a one-off price and rejects missing prices", async () => {
    const { categoryId, locationId } = await ids();
    await expect(
      as(SUPER, () =>
        db.query(
          `insert into public.properties (title, slug, transaction_type, category_id, location_id)
           values ('Plot with no price', 'plot-no-price', 'sale', $1, $2)`,
          [categoryId, locationId],
        ),
      ),
    ).rejects.toThrow(/price_present/);
  });

  it("records a redirect when a published slug changes", async () => {
    await as(SUPER, () => db.query(`update public.properties set slug = 'four-bedroom-duplex-jabi' where slug = 'four-bed-duplex-jabi'`));
    const r = await as(null, () => db.query(`select 1 from public.property_slug_redirects where old_slug = 'four-bed-duplex-jabi'`));
    expect(r.rows).toHaveLength(1);
  });

  it("prevents double-booking an agent", async () => {
    const prop = await db.query<{ id: string }>(`select id from public.properties where slug = 'four-bedroom-duplex-jabi'`);
    const propertyId = prop.rows[0].id;
    await db.query(
      `insert into public.inspections (property_id, full_name, phone, requested_at, scheduled_at, status, assigned_agent_id)
       values ($1, 'A', '0800', '2027-01-10 10:00+01', '2027-01-10 10:00+01', 'confirmed', $2)`,
      [propertyId, AGENT],
    );
    await expect(
      db.query(
        `insert into public.inspections (property_id, full_name, phone, requested_at, scheduled_at, status, assigned_agent_id)
         values ($1, 'B', '0801', '2027-01-10 10:30+01', '2027-01-10 10:30+01', 'confirmed', $2)`,
        [propertyId, AGENT],
      ),
    ).rejects.toThrow(/no_agent_double_booking/);
    await db.query(
      `insert into public.inspections (property_id, full_name, phone, requested_at, scheduled_at, status, assigned_agent_id)
       values ($1, 'C', '0802', '2027-01-10 11:00+01', '2027-01-10 11:00+01', 'confirmed', $2)`,
      [propertyId, AGENT],
    );
    const events = await db.query<{ n: number }>(`select count(*)::int n from public.inspection_events`);
    expect(events.rows[0].n).toBe(2);
  });

  it("refuses a confirmed inspection without a scheduled time", async () => {
    const prop = await db.query<{ id: string }>(`select id from public.properties limit 1`);
    await expect(
      db.query(
        `insert into public.inspections (property_id, full_name, phone, requested_at, status)
         values ($1, 'D', '0803', now(), 'confirmed')`,
        [prop.rows[0].id],
      ),
    ).rejects.toThrow(/confirmed_has_schedule/);
  });

  it("restricts enquiries to staff with enquiry permissions", async () => {
    await db.query(`insert into public.enquiries (full_name, email, message) values ('Ngozi', 'ngozi@example.com', 'Hello')`);
    const editor = await as(EDITOR, () => db.query(`select id from public.enquiries`));
    expect(editor.rows).toHaveLength(0);
    const agent = await as(AGENT, () => db.query(`select id from public.enquiries`));
    expect(agent.rows).toHaveLength(1);
    const anon = await as(null, () => db.query(`select id from public.enquiries`));
    expect(anon.rows).toHaveLength(0);
  });

  it("blocks anonymous inserts into enquiries", async () => {
    await expect(
      as(null, () => db.query(`insert into public.enquiries (full_name, email, message) values ('x', 'x@x.com', 'spam')`)),
    ).rejects.toThrow(/row-level security/);
  });

  it("stops content editors from reading listings and staff from self-promotion", async () => {
    const r = await as(CONTENT, () => db.query(`select id from public.properties`));
    expect(r.rows).toHaveLength(0);
    await expect(
      as(EDITOR, () => db.query(`update public.staff_profiles set role_key = 'admin' where id = '${EDITOR}'`)),
    ).rejects.toThrow(/own role/);
  });

  it("only exposes published blog posts whose date has passed", async () => {
    await as(CONTENT, () =>
      db.query(`
        insert into public.blog_posts (title, slug, status, published_at, body_html) values
          ('Buying land in Abuja', 'buying-land-abuja', 'published', now() - interval '1 day', '<p>x</p>'),
          ('Future market outlook', 'future-outlook', 'scheduled', now() + interval '3 days', '<p>y</p>'),
          ('Draft notes on rentals', 'draft-notes', 'draft', null, '<p>z</p>')`),
    );
    const r = await as(null, () => db.query<{ slug: string }>(`select slug from public.public_blog_posts`));
    expect(r.rows.map((x) => x.slug)).toEqual(["buying-land-abuja"]);
  });

  it("rate limits within a window", async () => {
    const results: boolean[] = [];
    for (let i = 0; i < 4; i++) {
      const r = await db.query<{ ok: boolean }>(`select public.check_rate_limit('test:key', 3, 600) as ok`);
      results.push(r.rows[0].ok);
    }
    expect(results).toEqual([true, true, true, false]);
  });

  it("filters by location including descendants", async () => {
    const r = await as(null, () =>
      db.query<{ n: number }>(
        `select count(*)::int n from public.public_properties where location_id in (select public.location_descendants('abuja'))`,
      ),
    );
    expect(r.rows[0].n).toBe(2);
  });
});
