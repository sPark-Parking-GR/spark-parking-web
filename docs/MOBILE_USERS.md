# Mobile users (super admin) and mobile password reset

Two features for riders who use the mobile app:

- **Admin pages** `/admin/mobile-users` and `/admin/mobile-users/:id`, visible only to
  `super_admin` (permissions `identity:mobile.read` / `identity:mobile.manage`).
- **Public page** `/mobile/reset-password/:token`, the target of the link in the mobile
  app's password-reset email. No session needed.

The browser only talks to this Next app. Server actions forward to the API with the admin
session, and every one re-checks the permission on the server, so a `platform_admin` is
refused even if they post to the action directly.

## API prerequisites

In `apps/spark-parking-api/.env`:

| Variable                    | Needed for                                                                      |
| --------------------------- | ------------------------------------------------------------------------------- |
| `MOBILE_AUTH_SECRET`        | Always. 32+ chars, must differ from `AUTH_SECRET` (`openssl rand -hex 32`)      |
| `WEB_APP_URL`               | Base of the reset link. Must be this app's origin, e.g. `http://localhost:3011` |
| `MOBILE_PASSWORD_RESET_URL` | Optional. Leave empty to get `${WEB_APP_URL}/mobile/reset-password`             |
| `EMAIL_PROVIDER=console`    | Dev default: the reset email, including the link, is printed in the API log     |

Run the migrations (`pnpm -C apps/spark-parking-api run db:migrate`) and start the API.
This app needs `NEXT_PUBLIC_API_URL` pointing at it and a `SESSION_SECRET` (see
`.env.example`).

## Get a super admin

The dev seed does not create a super admin. Use the bootstrap CLI, which refuses to run if
one exists already:

```bash
BOOTSTRAP_ADMIN_EMAIL=you@example.com pnpm -C apps/spark-parking-api run bootstrap:admin
```

It prints a random password once. Sign in at `/login`, then change the password.

Platform admins must **not** see the feature: sign in as one (for example a
seeded platform admin) and confirm there is no "Mobile users" entry in the sidebar and that visiting
`/admin/mobile-users` bounces to `/dashboard`.

## Create a mobile user

```bash
curl -s -X POST http://localhost:3001/api/v1/mobile-auth/sign-up \
  -H 'Content-Type: application/json' \
  -d '{"email":"rider@example.com","password":"correct horse battery","displayName":"Test Rider"}'
```

Repeat with other addresses for a longer list. Social sign-in methods (Google, Facebook,
Apple) can only be attached from the mobile app and need the provider client ids set in
the API `.env`.

## What to click

1. Sign in as the super admin and open **Mobile users** in the sidebar.
2. List: search by email or name (2+ characters), filter by status and sign-in method,
   page through results. Columns: email, name, status, sign-in methods, bookings, created,
   last active.
3. Open a row. The detail page shows sign-in methods with dates, the app profile (version,
   locale, last active), counts of bookings, vehicles, saved facilities and reviews, and the
   subscription if any.
4. Actions (each opens a dialog and requires a reason of 3+ characters):
   - **Suspend** (active accounts): the rider is signed out and cannot sign in.
   - **Reactivate** (suspended accounts).
   - **Revoke sessions**: signs the rider out of every device; they can sign in again.
   - **Erase**: irreversible. Type the account email to enable the button. The API refuses
     while the rider has unsettled bookings and the dialog shows that error.
5. Check the audit log (`/admin/audit`) for the actions you took, if the API records them.

Push tokens, password hashes and provider subjects are never requested or shown.

## Try the reset page

1. Ask for a reset for the test rider:

   ```bash
   curl -i -X POST http://localhost:3001/api/v1/mobile-auth/forgot-password \
     -H 'Content-Type: application/json' -d '{"email":"rider@example.com"}'
   ```

2. Copy the `.../mobile/reset-password/<token>` link from the API log (console email).
3. Open it in a private window (no admin session needed). Enter a new password twice. The
   strength meter and 8-128 character policy match the dashboard reset.
4. Success shows a confirmation. Reloading the same link and submitting again shows the
   expired-link state, since a token is single use. Too many attempts (the API allows
   5 per minute) shows a wait-and-retry message.
5. The response carries `Referrer-Policy: no-referrer` and `Cache-Control: no-store`; check
   in the browser network tab. Sign in again with the new password through the API
   `POST /mobile-auth/sign-in`.

## Notes

- Status and sign-in method names from the API are accepted in either letter case and
  normalised in `src/lib/mobile-user-schema.ts`; responses are validated with Zod and any
  field outside the contract is dropped.
- Run the unit tests with `pnpm run test`.
