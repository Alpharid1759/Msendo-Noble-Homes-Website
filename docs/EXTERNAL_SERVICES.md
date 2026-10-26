# External services and credentials

| Service | Purpose | Required? | Credentials to set | Without it |
| --- | --- | --- | --- | --- |
| Supabase | Database, staff sign-in, file storage | **Yes** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Site shows empty states; forms ask visitors to call or WhatsApp |
| Vercel (or another Node host) | Hosting, HTTPS, CDN, daily cron | **Yes** | `CRON_SECRET`, all env vars | Site not online |
| Domain registrar + DNS | Your web address | **Yes** | DNS records from Vercel and Resend | Only the vercel.app address |
| Resend (or SMTP provider) | Enquiry alerts, customer confirmations, inspection emails, reminders; Supabase auth emails via SMTP | Strongly recommended | `RESEND_API_KEY`, `EMAIL_FROM`; Supabase SMTP settings | Enquiries still saved and visible in admin; emails recorded as "skipped" |
| Google Analytics 4 | Visitor and CTA analytics | Optional | Measurement ID in Site settings | No analytics |
| Google Search Console | Indexing, sitemap | Recommended | Verification code in Site settings | Slower indexing |
| Cloudflare Turnstile | Extra spam protection on forms | Optional | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Honeypot, timing check and rate limits still apply |
| Uptime monitor | Downtime alerts | Recommended | Account only | No alerts |
| WhatsApp | Customer chat | Already set | Number and wa.link in Site settings | — |
| Google Business Profile | Local search | If eligible | Profile ownership | — |

Also generate `IP_HASH_SALT` (any long random string).

## Supplied by Msendo and already configured

- Phone: 0902 874 8800 (`+2349028748800`)
- WhatsApp: https://wa.link/4w83p2, and `2349028748800` for messages that include a property reference
- Email: MsendoIntegratedltd@gmail.com
- Office: Plot 833 Emmanuel Aguna, Jabi District, Abuja

## Still needed from Msendo

- Confirmation that the WhatsApp Business number is the same as the phone number above (prefilled property messages use it)
- Official logo files (full colour, white, square icon), ideally SVG and PNG
- CAC RC number, if it should appear in the footer
- Business hours
- Social media profile links
- Mission, vision and values wording approval (drafts are on the About page, marked as awaiting approval)
- Leadership profiles and verified milestones, if wanted
- A domain name and a sending email address on it (e.g. `notifications@yourdomain`)
- Real listings, photographs and videos
- Legal review of the privacy policy, terms and listing disclaimer
