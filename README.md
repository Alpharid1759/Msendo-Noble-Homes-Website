# Msendo Noble Homes

Property website and staff portal for Msendo Noble Homes, the real estate division of Msendo Integrated Limited.
**Property. Opportunity. Confidence.**

Next.js 16 · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage)

## Quick start (Windows PowerShell)

```powershell
npm install
Copy-Item .env.example .env.local
notepad .env.local
npm run dev
```

Before the site shows data you need a Supabase project with the migrations applied. Follow `docs/DEPLOYMENT.md`.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Development server on http://localhost:3000 |
| `npm run build` / `npm run start` | Production build and server |
| `npm run lint` / `npm run typecheck` | Code checks |
| `npm test` | Unit and database tests (no external services needed) |
| `npm run test:e2e` | Playwright browser tests against a running site |

## Documentation

| File | For |
| --- | --- |
| `docs/ARCHITECTURE.md` | Stack, folder structure, database model, roles, sitemap, user journeys, milestones |
| `docs/DEPLOYMENT.md` | Supabase, Vercel, domain, HTTPS, email, monitoring, releases and rollback |
| `docs/ADMIN_GUIDE.md` | Staff guide to listings, media, enquiries, inspections, blog and settings |
| `docs/SECURITY_AND_PRIVACY.md` | Security controls and NDPA 2023 privacy measures |
| `docs/BACKUP_AND_RECOVERY.md` | Backups, restores, incident steps |
| `docs/EXTERNAL_SERVICES.md` | Services and credentials to set up, and what is still needed from Msendo |
| `docs/LAUNCH_CHECKLIST.md` | Go-live checklist |
| `docs/TEST_REPORT.md` | What was tested, what passed, what still needs testing |
