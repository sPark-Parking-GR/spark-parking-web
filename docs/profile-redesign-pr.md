## Profile page redesign (admin and operator)

UI only. `updateProfileAction`, `changePasswordAction`, `requestOwnPasswordResetAction`, `resetPasswordAction`, the validation rules and token handling are untouched (`git diff` shows no change to `src/lib/profile-actions.ts` or `src/lib/password-reset-actions.ts`). Stacked on `feat/dashboard-redesign` (shell) and `feat/login-redesign`.

### 0. Audit (state of the old page, before this PR)

| Piece                         | File (at the parent commit)                                                                              | How its state is known                                                                                                                                                                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route                         | `src/app/(dashboard)/dashboard/profile/page.tsx:23-50`                                                   | Server: `requireSession()` supplies email, name and role. No URL param.                                                                                                                                                                                           |
| Details form                  | `src/components/ProfileForm.tsx:24-28`                                                                   | Client: `useState` for `hasSubmitted` and the controlled name; `useActionState(updateProfileAction)` for the result.                                                                                                                                              |
| Step 1, confirm password      | `src/components/ChangePasswordForm.tsx:30-35`                                                            | Client: `useActionState(changePasswordAction)`; `sent`/`failed` derived from `hasSubmitted && !isPending`.                                                                                                                                                        |
| Step 2, "open the email link" | `src/components/ChangePasswordForm.tsx:34,37-49`                                                         | Client: the `sent` branch of the same component. Not a route, nothing persisted: a reload returns to step 1.                                                                                                                                                      |
| Step 3, choose a new password | `src/app/(auth)/reset-password/[token]/page.tsx:7-11` and `src/components/ResetPasswordForm.tsx:47-79`   | **Separate route opened from the email.** State is the token in the URL path; the form is `useActionState` plus `resetPasswordAction(token, ...)`; success does `router.push('/login?reset=success')` (line 75). Shared with the logged-out forgot-password flow. |
| Reset-link action             | `src/components/ProfileForgotPasswordSection.tsx:33-39`                                                  | Client: `useActionState(requestOwnPasswordResetAction)`.                                                                                                                                                                                                          |
| Server actions                | `src/lib/profile-actions.ts:20` (update), `:64` (change-password), `:101` (own reset link), schema `:10` | Server.                                                                                                                                                                                                                                                           |

Because step 3 is a separate route, the stepper in the profile card drives steps 1 and 2 and the step-3 design is applied on `/reset-password/[token]` with steps 1 and 2 shown as done.

### What changed

- **Header link**: `ProfileLink` (client) wraps the user block; `aria-current="page"` on `/dashboard/profile` and a 2px brand ring on the avatar. Header title on the phone now reads "Profile" there.
- **Layout**: `profile.css`. Two columns at 980px content width and above (300px sticky identity card), single column with a compact strip below. Container queries on the shell's `content` container.
- **Identity card**: cover glows, 88/72/60px avatar, live name and initials, avatar bump, "Add your name" hint, scroll-spy nav with `aria-current="location"`.
- **Details**: `FloatingInput` (login component) restyled for the dashboard; read-only email with lock and tooltip; dirty/discard/save, 1.6s "Saved", toast, inline error with Try again, 120-character limit with live counter (the real rule, not the mockup's 80), sticky floating bar under 640px.
- **Password**: `Stepper` (shared with the reset page), steps 1 and 2 with directional slide and heading focus, Caps Lock warning (existing `PasswordField`), wrong password clears and refocuses, 30s resend countdown, "Start over".
- **Reset-link panel**: idle / sent (with cooldown) / failed.
- **Reset page**: stepper (steps 1-2 done), four-segment length meter (`PasswordLengthMeter segmented`), live "At least 8 characters" rule, field error retired on typing.
- **States**: `loading.tsx` skeleton mirroring the layout, with `aria-busy` and the header progress line; `error.tsx` card with Try again.
- **Toast**: new small `useToast` (the app had none).
- **i18n**: en/el parity (2050 keys); superseded copy keys removed.
- Removed `ProfileForm`, `ChangePasswordForm`, `ProfileForgotPasswordSection` (replaced). `DashboardShell` role labels moved to `lib/shell-account-server.ts` so the page reuses them.

### Decisions worth a look

1. **Resend uses the own-reset-link action.** The confirmation email needs the current password, which the form clears after sending. "Resend email" on step 2 therefore calls `requestOwnPasswordResetAction`, which mails the same kind of link to the same address and opens the same `/reset-password/[token]` page. Say so if you want resend to ask for the password again.
2. **30s cooldown.** The API throttles `forgot-password` and `change-password` at 3 per minute (`auth.controller.ts`), so 30s stays inside it.
3. **No confirm-password field on step 3.** The mockup has one, but the brief says not to add fields and the existing test asserts a single field. The "Passwords match" rule and mismatch error are therefore not present.
4. **Meter is length-based, not zxcvbn.** It reuses `PasswordLengthMeter` (the app's real policy is a length floor, `PASSWORD_MIN = 8`).
5. **No "Password updated" done state in the card.** The password changes on the reset page, which already redirects to `/login?reset=success`. That flow is unchanged, so the in-card Done step, its toast and the "Done" button do not exist.
6. **Error state** is a route `error.tsx`. The profile data comes from the session cookie, so it appears if rendering throws; "Try again" calls `router.refresh()` then `reset()`.

### Tests

`src/components/profile/Profile.test.tsx` (16): details dirty/discard/save success/save error/validation, live identity, read-only email, no-name state, step 1 errors, advance to step 2, countdown, start over, reset panel idle/sent/failed. `AuthPages.test.tsx` gained two reset-page cases. Full suite 246/246, `tsc` clean, lint 0 errors (2 pre-existing warnings), `check:i18n` OK.

### Not done / not verified

- **Screenshots are incomplete.** The in-app browser captures at most 800px wide. Captured and checked by eye: operator at 1440 (dark), 820 (dark and light), 390 (dark, with the floating save bar); reset page step 3. Not captured: admin role, 1440 light, loading and error states, the no-name state, the sent/failed reset panels and steps 2 as images. Their behaviour is covered by the tests and by driving the live page (wrong password, step 2 countdown, save, long name).
- **Loading and error states were not seen rendered.** Both are built from the same classes as the loaded layout and the dashboard state card.
- **Admin role not exercised in the browser** (platform sign-in failed in the earlier session; the page is role-agnostic and uses the same route).
- `pnpm run build` was not run in this session; the dev server compiled and served every changed route.
- `prefers-reduced-motion` and `:focus-visible` are in CSS but were not checked in a browser.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
