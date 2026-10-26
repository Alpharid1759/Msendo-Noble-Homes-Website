# Backup and recovery

## What needs protecting

| Data | Where | How it is backed up |
| --- | --- | --- |
| Listings, enquiries, inspections, articles, staff, settings, audit log | Supabase Postgres | Supabase backups + your own weekly dump |
| Photos, videos, posters, blog images | Supabase Storage `public-media` | Weekly copy to separate storage |
| Code and migrations | Private GitHub repository | Git history |
| Secrets | Vercel environment variables + password manager | Kept in the password manager |

## Supabase backups

- Paid Supabase plans take daily database backups; Point-in-Time Recovery is an add-on that allows restoring to any second. For a business holding customer enquiries, use at least the Pro plan with daily backups, and consider PITR. Check current plan details on supabase.com before relying on a specific retention period.
- Storage files are **not** included in database backups. Copy them separately (below).

## Your own weekly backups

Run from a trusted computer with the Supabase CLI. Store the output encrypted (e.g. in a password-protected archive) somewhere other than Supabase.

```powershell
$date = Get-Date -Format "yyyy-MM-dd"
npx supabase db dump --linked -f "backup-schema-$date.sql"
npx supabase db dump --linked --data-only -f "backup-data-$date.sql"
```

Storage files can be copied with any S3-compatible tool using Supabase's S3 access keys (**Storage > Settings > S3 Connection**), for example with rclone:

```powershell
rclone sync supabase:public-media D:\msendo-backups\public-media
```

Keep at least 4 weekly and 3 monthly copies. Delete older copies so personal data is not kept longer than the privacy policy says.

## Restoring

**Accidental change to a single record**: check the **Audit log** for the previous values and correct the record in the admin.

**Database restore from Supabase backup**: Dashboard > **Database > Backups**, choose the backup or point in time, restore. This replaces the whole database, so any changes after the restore point are lost; tell staff before you start.

**Restore from your own dump into a new project**:

```powershell
npx supabase link --project-ref NEW_PROJECT_REF
npx supabase db push                       # schema from migrations
psql "$env:NEW_DATABASE_URL" -f backup-data-YYYY-MM-DD.sql
```

Then copy storage files back with rclone, update the environment variables in Vercel to the new project, and redeploy.

**Restore the app**: Vercel > Deployments > previous good deployment > **Promote to Production**.

## Test the restore

Every three months, restore the latest dump into the staging project and check that listings, images and the admin work. A backup that has never been restored is not proven.

## If there is a security incident

1. Rotate the `service_role` key and JWT secret in Supabase, update Vercel, redeploy.
2. Deactivate affected staff accounts in **Staff and roles** and reset passwords.
3. Review the audit log and Supabase logs for what was accessed.
4. Under the Nigeria Data Protection Act 2023, a personal data breach likely to cause risk must be reported to the Nigeria Data Protection Commission within 72 hours, and affected people informed where the risk is high. Take legal advice promptly.
