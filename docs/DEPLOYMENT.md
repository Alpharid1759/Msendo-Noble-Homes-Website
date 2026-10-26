# Deployment guide

Use three environments: **development** (your computer), **staging** (a separate Supabase project and a Vercel preview or staging domain), and **production**. Never point staging at the production database.

## 1. Local development (Windows PowerShell)

```powershell
cd msendo-noble-homes
npm install
Copy-Item .env.example .env.local
notepad .env.local          # fill in the Supabase values from step 2
npm run dev                 # http://localhost:3000
```

Useful commands:

```powershell
npm run lint
npm run typecheck
npm test                    # unit + database tests (no Supabase needed)
npm run build; npm run start
npx playwright install      # once, then:
npm run test:e2e
```

## 2. Supabase project

1. Create a project at supabase.com. Choose the **London (eu-west-2)** region, the closest available to Abuja. Use a strong database password and store it in a password manager.
2. Install the CLI and link the project:

   ```powershell
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push            # applies supabase/migrations in order
   ```

3. Load the base data. In the dashboard open **SQL Editor**, paste the contents of `supabase/seed.sql` and run it. For staging only, also run `supabase/seed-demo.sql` (six listings clearly labelled "Demo").
4. **Authentication > Sign In / Providers**: keep Email enabled and turn **off** "Allow new users to sign up". Staff are invited from the admin.
5. **Authentication > URL Configuration**: Site URL = your domain (e.g. `https://www.msendonoblehomes.com`). Add `https://YOUR-DOMAIN/auth/confirm` and your staging equivalent to Redirect URLs.
6. **Authentication > Email Templates**: change the links so they work with server-side sign-in:
   - Invite user: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/admin/reset-password`
   - Reset password: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/admin/reset-password`
7. **Authentication > SMTP Settings**: connect a real email sender (Resend's SMTP works). Supabase's built-in sender is heavily rate-limited and not meant for production.
8. **Storage**: the migration creates `media-raw` (private) and `public-media` (public). Under **Storage > Settings** check the global file size limit for your plan and set the admin upload limits (Site settings > Upload limits) at or below it.
9. **Project Settings > API**: copy the Project URL, the `anon` key and the `service_role` key into your environment variables.

### Create the first super administrator

1. **Authentication > Users > Add user > Send invitation** to the owner's email.
2. Copy the new user's UUID, then in **SQL Editor** run:

   ```sql
   insert into public.staff_profiles (id, email, full_name, role_key)
   values ('PASTE-USER-UUID', 'owner@example.com', 'Full Name', 'super_admin');
   ```

3. The owner opens the invite email, sets a password, signs in at `/admin/login`, and turns on two-step verification under **My account**. All other staff are invited from **Staff and roles**.

## 3. Hosting on Vercel

1. Push the repository to a **private** GitHub repository.
2. Import it in Vercel. Framework: Next.js. Node 20 or 22.
3. Add environment variables (Production and Preview separately) from `.env.example`:
   - `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `IP_HASH_SALT`, `CRON_SECRET`
   - Optional: `RESEND_API_KEY`, `EMAIL_FROM`, Turnstile keys, `RETENTION_PURGE`
   - Production only: `NEXT_PUBLIC_ALLOW_INDEXING=true`
4. Deploy. `vercel.json` pins the London region and schedules `/api/cron/daily` at 06:00 UTC (07:00 in Abuja).

Any other Node host works: `npm ci && npm run build && npm run start`, behind HTTPS, with a daily scheduler calling `GET /api/cron/daily` with header `Authorization: Bearer $CRON_SECRET`.

## 4. Domain and HTTPS

1. In Vercel **Settings > Domains** add the apex and `www` domain. Choose which one redirects to the other.
2. At your registrar, set the DNS records Vercel shows (usually an `A` record for the apex and a `CNAME` for `www`).
3. Vercel issues TLS certificates automatically once DNS resolves.
4. Verify:

   ```powershell
   curl.exe -I https://www.YOUR-DOMAIN
   ```

   Expect `HTTP/2 200` and a `strict-transport-security` header. Also check `http://` redirects to `https://`, and run the domain through https://www.ssllabs.com/ssltest/ (aim for grade A).
5. Update `NEXT_PUBLIC_SITE_URL` and Supabase Site URL to the final domain, then redeploy.

## 5. Email (Resend)

1. Create a Resend account and add your domain. Add the DNS records it gives you (SPF, DKIM) and wait for "Verified".
2. Create an API key with sending access only. Set `RESEND_API_KEY` and `EMAIL_FROM` (an address on the verified domain).
3. Submit the contact form on staging and confirm the alert arrives at the addresses in **Site settings > Notifications**. Check `/admin/enquiries/[id]` shows the notification as `sent`.

## 6. Search engines

1. Google Search Console: add the domain property, paste the verification code into **Site settings > Search engines**, and submit `https://YOUR-DOMAIN/sitemap.xml`.
2. Google Business Profile: link it to the website only if the business has an eligible verified profile at the Jabi office.

## 7. Monitoring

- **Uptime**: a free monitor (e.g. UptimeRobot or Better Stack) on `/` and `/properties` every 5 minutes, alerting the owner by email and WhatsApp/SMS.
- **Errors and performance**: Vercel's Observability and Speed Insights, or Sentry (add the Sentry Next.js SDK and set its DSN; do not send form contents).
- **Database**: Supabase **Reports** and **Advisors** (security and performance). Review the Advisors tab after every migration.
- **Cron**: check the daily job's JSON response in Vercel's Cron logs.

## 8. Releasing changes and rolling back

1. Work on a branch; the CI workflow runs lint, typecheck, tests, audit and build.
2. Merge to `main` to deploy to production. Database changes go in a **new** migration file (never edit an applied one); apply to staging first with `npx supabase db push`, then production.
3. **Rollback the app**: in Vercel **Deployments**, open the previous good deployment and choose **Promote to Production** (instant).
4. **Rollback the database**: write a new migration that reverses the change, or restore from backup (see `BACKUP_AND_RECOVERY.md`). Prefer additive migrations so app rollbacks do not need database rollbacks.

## 9. Changing company details or adding staff

- Company name, phone, WhatsApp, email, address, social links, logo, SEO defaults, inspection hours and notification recipients: **Admin > Site settings**. Changes go live within seconds.
- Mission, vision, values, leadership and milestones on the About page: edit `src/content/about.ts` and set `approved: true` once management signs off the wording.
- Staff: **Admin > Staff and roles > Invite a staff member**. Deactivating someone blocks their sign-in immediately.
