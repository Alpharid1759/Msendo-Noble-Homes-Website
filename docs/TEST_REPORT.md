# Test report

Date: 26 October 2026. Build: Next.js 16.4.3, React 19.3, Node 22.

## Automated (run with `npm test`)

| Suite | Tests | Result |
| --- | --- | --- |
| Database: migrations, seed, triggers, RLS (in-process Postgres) | 16 | Passed |
| Search filters, URL building | 7 | Passed |
| Price/area formatting, slugs, WhatsApp/tel/mailto links, CSV safety | 10 | Passed |
| Inspection rules, form validation, admin validation, HTML sanitising, image processing, MP4 detection | 14 | Passed |
| **Total** | **47** | **All passed** |

`npm run lint`, `npm run typecheck` and `npm run build` complete with no errors or warnings.

## Integration run (real PostgreSQL 16 + PostgREST + test gateway)

The production build ran against a real Postgres database with the migrations, seed and demo seed applied, PostgREST for the API, and a small stand-in for Supabase Auth and Storage.

**Passed**

- All public routes return 200; unknown pages and slugs return 404; withdrawn slugs redirect.
- Search: 19 filter combinations returned the expected counts (transaction, rental type, keyword, reference, district and city, price range, bedrooms, category, area, furnishing, featured, verified, no-match).
- Sale pages never show rentals and rental pages never show sales.
- Property page: charges listed separately (fixed and percentage), demo label, JSON-LD, prefilled WhatsApp link with reference and price.
- Forms submitted without JavaScript: contact enquiry saved and consent recorded; duplicate detected; validation errors shown; missing consent rejected; honeypot blocked; inspection saved; short-notice, out-of-hours and unknown-reference inspections rejected; property submission saved; newsletter subscription saved. Email notifications logged as `skipped` (no provider configured).
- Admin: all 13 sections render for a super administrator; dashboard figures correct; a listing editor is redirected away from enquiries, staff and settings.
- Admin writes: listing created and published by an administrator with reference and audit entry; editor blocked from publishing and from verifying titles by database triggers; validation errors shown.
- Media: JPEG processed into three WebP sizes with EXIF removed, set as main photo, visible on the public page immediately; MP4 accepted and moved to public storage; fake MP4 rejected and deleted; uploads into another user's folder and unauthenticated requests refused.
- Inspections: confirmation with agent saved and history recorded; overlapping booking for the same agent refused with a clear message.
- Enquiry status, follow-up date and notes saved.
- Blog: article published; scripts and `javascript:` links stripped; external links marked `nofollow`; table of contents generated.
- Settings change appears on the public site on the next request.
- CSV export works for staff and is refused for anonymous requests. Daily cron refuses requests without the secret and runs with it.

## Not yet tested (needs the business's accounts)

- Real Supabase Auth flows: password sign-in, invitations, password reset emails, two-step verification enrolment and challenge, account banning on deactivation.
- Real Supabase Storage resumable uploads from the browser (progress, cancel, resume), CDN delivery, bucket size limits.
- Email delivery through Resend and Supabase SMTP.
- Google Analytics events after consent; Turnstile.
- Browser and device testing (Chrome, Firefox, Safari, Edge, Android, iOS) and Core Web Vitals on a deployed URL. The Playwright suite in `tests/e2e` covers these on staging: `E2E_BASE_URL=https://staging… npm run test:e2e`.
- Production HTTPS, DNS and SSL grade.

## Known limitations

- Video duration is read in the browser and checked against the limit; the server checks size and MP4 format but does not re-measure duration. Videos are served as uploaded (no adaptive streaming); if large tours become common, add Mux or Cloudflare Stream.
- Search uses PostgreSQL full-text search, suitable for thousands of listings; a dedicated search service can be added later behind `src/lib/properties.ts`.
- Mission, vision and values are draft wording and display an "awaiting approval" note until approved.
- Legal pages are templates and need review by a Nigerian lawyer.
- Optional features from the brief (customer accounts, landlord portal, comparison, calculators, PDF brochures beyond print-to-PDF, multilingual) are not built; the architecture leaves room for them.
