# MaarifaBooks Admin Dashboard

## Dashboard
Open `/admin` after signing in with an account whose `profiles.role` is `admin`.

The page shows:
- Member count
- Pending seller applications
- Pending book submissions
- Seller approval/rejection
- Book approval/rejection, with an optional rejection note

All server actions re-check the authenticated user and the database role. Supabase RLS remains the final database access control.

## Promote the first administrator
There is intentionally no public admin registration form. Create your own account using the normal sign-up page, verify its email, then open Supabase Dashboard > SQL Editor and run `docs/admin-bootstrap.sql` after replacing the placeholder email with your exact login email.

Do not promote an account you do not control. Keep admin access restricted to trusted people.

## Notes
- Approval of a seller sets the profile role to `seller` and seller status to `approved`.
- Approval of a book publishes its listing in the public catalogue.
- The current book submission form stores metadata only; secure file uploads and file review are still pending.
