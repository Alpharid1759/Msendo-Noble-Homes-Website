# Security and privacy controls

## Access control

- Row Level Security on every table. The anonymous key can read only five purpose-built views (`public_properties`, `public_property_media`, `public_property_charges`, `public_blog_posts`, `public_site_settings`), categories, locations and slug redirects. Drafts, private addresses, internal notes and customer data are never readable without a staff session and the right permission.
- Anonymous visitors cannot insert anything directly. Public forms go through server actions that validate with zod, check a honeypot and fill time, optionally verify Cloudflare Turnstile, rate-limit by hashed IP (Postgres-backed, works on serverless), and de-duplicate repeat submissions.
- Staff permissions are checked twice: in server code and by RLS policies and triggers in the database.
- `/admin` is protected in `proxy.ts` and again in every page and action. Sign-in is rate-limited per IP and per email. TOTP two-step verification is supported; once enrolled it is required at every sign-in.
- Deactivating a staff member bans their auth account immediately.

## Uploads

- Only signed-in staff with `media.upload` can upload, only into their own folder of the private `media-raw` bucket (enforced by storage RLS).
- Bucket rules restrict MIME types; the server then checks real content: images are decoded with sharp (non-images fail), videos must have a valid MP4 `ftyp` header. Size, duration and per-listing count limits come from settings.
- Public files get random UUID names under `public-media`, are re-encoded (images) and never executed. EXIF and GPS data are stripped.
- Raw uploads are deleted after processing; leftovers older than 24 hours are removed by the daily cron.
- Permanent deletion requires `media.delete` and confirmation, with an extra warning when the listing is live.

## Web security

- HTTPS everywhere with HSTS; Content Security Policy limiting scripts, frames and connections to the site, Supabase, Google Analytics and Turnstile; `X-Frame-Options: DENY`, `nosniff`, strict referrer policy, restrictive permissions policy.
- Article HTML is sanitised on save and again on display (no scripts, event handlers or `javascript:` links). External links get `rel="noopener noreferrer nofollow"`.
- Database queries use the Supabase query builder (parameterised); search terms are validated before use.
- CSV exports neutralise spreadsheet formulas.
- Server actions are protected against cross-site requests by Next.js origin checks.
- Secrets live only in environment variables; `.env*` files are git-ignored except the template.
- CI runs `npm audit`; Dependabot raises weekly update PRs.

## Privacy (Nigeria Data Protection Act 2023)

- Forms collect only what is needed to respond; consent is recorded with the policy version and timestamp (`consent_records`).
- IP addresses are stored only as salted hashes.
- Analytics loads only after consent, anonymises IPs and never receives names, phone numbers or emails.
- Retention: the period is set in Site settings; with `RETENTION_PURGE=true` the daily job deletes closed, converted and spam enquiries older than that period.
- Data subject requests arrive in the enquiry inbox under "Personal data request". Staff can export (copy) or delete an enquiry; the audit log records deletions.
- The privacy policy names Msendo Integrated Limited as controller, lists processors (hosting, database, email, analytics) and explains rights and how to complain to the Nigeria Data Protection Commission. Have it reviewed by a lawyer before launch.
- The site does not take card payments.
