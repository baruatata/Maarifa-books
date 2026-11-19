# MaarifaBooks — Backup & Recovery Record

Last reviewed: 2026-11-19

## Production source snapshot

- GitHub repository: https://github.com/baruatata/Maarifa-books
- Production source branch: `feature/guest-coupon-redemption`
- Production commit: `417fae6ad9c84cc05b7098127eb757756f87c15c`
- Snapshot branch: `backup/production-snapshot-2026-11-19`
- Snapshot branch points to the exact production commit above.

## Hosting references

- Production site: https://maarifabooks.vercel.app/
- Vercel project: `maarifabooks`
- Vercel project ID: `prj_3WtkODGAyGom9eVUJQGQ4UFYrC6x`
- Supabase project ref: `qsbyvztxrlnpujjakrfh`

## Important recovery notes

1. Restore application source from the snapshot branch or exact commit above.
2. Recreate/configure the Vercel project and domain only after confirming account access and DNS ownership.
3. Configure required environment variables from a separately secured password manager or secret vault. Never commit secret values to Git.
4. Restore PostgreSQL from a verified external database dump; this record is NOT a database backup.
5. Restore Supabase Storage objects from a separately downloaded and verified copy; PostgreSQL dumps do NOT include the binary files in Storage.
6. Before switching production traffic, deploy a preview and test authentication, book access, coupon requests/redemption, seller/admin dashboards, OTP/SMS, and storage access.

## Backup status at this review

- [x] Exact Git production commit preserved as a separate branch in the same GitHub repository.
- [ ] Independent copy of the repository outside the current GitHub account.
- [ ] PostgreSQL dump exported, stored outside Supabase, and restore-tested.
- [ ] Supabase Storage objects copied outside Supabase and verified.
- [ ] Vercel environment variable names and secret values escrowed securely outside Vercel.
- [ ] Full recovery drill completed.

This file contains infrastructure identifiers only. It must never contain passwords, API keys, service-role keys, OTP secrets, or customer personal data.
