# Launch checklist

## Accounts and configuration

- [ ] Production Supabase project (London), migrations applied, `seed.sql` run, **no** demo seed
- [ ] Public sign-ups disabled; Site URL, redirect URLs and email templates updated
- [ ] Production SMTP configured in Supabase
- [ ] First super administrator created; two-step verification on
- [ ] Staff invited with the least access they need
- [ ] All production environment variables set in Vercel; `NEXT_PUBLIC_ALLOW_INDEXING=true` on production only
- [ ] `CRON_SECRET` set and the daily cron visible in Vercel
- [ ] Resend domain verified; test enquiry alert received
- [ ] Logo uploaded; company details, hours and social links checked in Site settings
- [ ] About page wording approved (`approved: true` in `src/content/about.ts`)
- [ ] Privacy policy, terms and listing disclaimer reviewed by a lawyer

## Content

- [ ] At least 10 real listings with 5+ photos each, alt text, charges and document status
- [ ] Featured listings chosen; featured districts set
- [ ] Two or three articles published
- [ ] No demo listings in production (`select count(*) from properties where is_demo;` returns 0)

## Domain and security

- [ ] Domain connected; `https://` works on apex and `www`, one redirects to the other
- [ ] SSL Labs grade A
- [ ] Security headers present (`curl.exe -I https://YOUR-DOMAIN`)
- [ ] Supabase Advisors: no security warnings
- [ ] Service role key not present in browser code (search the deployed JS for `service_role`)
- [ ] Admin pages redirect to sign-in when signed out

## Functional checks on production

- [ ] Search with filters; share the URL in a private window and get the same results
- [ ] Sale page shows no rentals; rent page shows no sales
- [ ] Property page: photos, lightbox, video, charges table, WhatsApp opens with the reference
- [ ] Contact, enquiry, inspection, list-your-property and newsletter forms save and send email
- [ ] Inspection confirmed in admin sends the customer email
- [ ] Upload photos and a video from a phone and from a laptop
- [ ] Mark a listing sold; it leaves search and its page shows the status message
- [ ] Unsubscribe link works

## Search engines and analytics

- [ ] Search Console verified; sitemap submitted
- [ ] Analytics ID set; banner appears; events arrive after accepting
- [ ] Google Business Profile linked, if eligible

## Operations

- [ ] Uptime monitor alerting the owner
- [ ] Backup routine scheduled and one restore tested on staging
- [ ] Staff trained using `ADMIN_GUIDE.md`
