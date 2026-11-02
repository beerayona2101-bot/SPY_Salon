# Auth Audit Plan

---

## Root Cause: Age Error

**Source:** The error string "Age is required, Required, Required, Required, Required" does **not exist in any current source file** across all three codebases. Exhaustive `grep` across all `.dart`, `.ts`, `.tsx`, `.js` files in `frontend/`, `backend/src/`, and `mobile_app/lib/` returned zero matches for the word "age" in any validation context.

**Conclusion:** This error was produced by a **previous version** of the backend (likely an old Joi validation schema that required `age`, `gender`, `dob`, etc.) that has since been replaced by the current `validateRequest` middleware. The comma-joined format ("Age is required, Required, Required, Required, Required") is consistent with Joi's `error.details.map(e => e.message).join(', ')` pattern — the current backend's `validateRequest` only ever returns the **first** error (via `ApiError.badRequest(firstErrorMessage)`), so that format is impossible with the current code.

**The current registration payload sent by both Flutter and Web is correct:**  
`{ name, email, phone, password, termsAccepted, privacyPolicyAccepted, termsVersion, privacyPolicyVersion }`  
The backend's `/api/v1/auth/register` route only validates `name` (required), `password` (required + min-length), `email` (format), `phone` (format). No `age` field is required anywhere.

**Runtime verification needed:** Confirm the running backend is the current source version — the age error may persist if an older bundled or deployed backend instance is still running. Running `node src/server.js` from the `backend/` directory will confirm.

---

## Confirmed Issues

### Web Frontend (`frontend/`)

1. **`AuthContext.register` TypeScript type strips optional consent fields from JSON body**
   - File: `frontend/context/AuthContext.tsx` line ~215
   - The implementation function signature is `async (formData: { name: string; email: string; phone: string; password: string })` — but the `AuthContextType` interface declares the parameter as including optional `termsAccepted`, `privacyPolicyAccepted`, `termsVersion`, `privacyPolicyVersion`. The implementation ignores these.
   - The page (`app/register/page.tsx`) passes all five fields including the consent flags; they are silently dropped by the register function before being serialized to JSON.
   - **Impact:** Minor — `authService.register` defaults all consent flags to `true` when absent, so registration succeeds. But this is misleading code: the TypeScript interface promises to accept consent fields, the page passes them, and the implementation discards them.
   - **Fix:** Widen the implementation parameter type to `{ name: string; email: string; phone: string; password: string; termsAccepted?: boolean; privacyPolicyAccepted?: boolean; termsVersion?: string; privacyPolicyVersion?: string }` and pass all fields to `apiFetch`.

2. **`reset-password/page.tsx` reads `token` from URL query but backend expects `email + otp + password`**
   - File: `frontend/app/reset-password/page.tsx` line ~12
   - The page reads `searchParams.get('token')` and passes it as the first argument to `resetPassword(token, password)`. The `AuthContext.resetPassword` interprets that as `otp = token, password = password`.
   - The backend's `POST /auth/reset-password` expects `{ email, otp, password }`, but the page never collects `email` and sends only the token-as-otp.
   - The `forgot-password/page.tsx` handles the full OTP flow (email → OTP → new password) correctly. The `reset-password/page.tsx` appears to be a legacy page expecting a link-token flow that does not exist in the backend.
   - **Impact:** The `/reset-password` page is broken — any user arriving via a deep link `?token=...` will get an error or wrong password reset attempt.
   - **Fix option A (recommended):** Remove or redirect `/reset-password` to `/forgot-password` since the full OTP flow lives there already. The `forgot-password` page is complete and working.
   - **Fix option B:** Add `email` collection to the reset-password page and restructure the two-step flow (but this duplicates `forgot-password`).

3. **`reset-password/page.tsx` success redirect sends user to `/book` instead of `/login`**
   - File: `frontend/app/reset-password/page.tsx` line ~54
   - After a successful password reset, `router.push('/book')` fires. This is wrong — the user is no longer authenticated after a reset and should be redirected to `/login`.
   - **Fix:** Change `router.push('/book')` to `router.push('/login')`.

4. **`forgot-password/page.tsx` minimum password length validation is 4 characters but backend requires 6**
   - File: `frontend/app/forgot-password/page.tsx` line ~82
   - `if (!password || password.length < 4)` — the backend's `validateRequest` for `/reset-password` enforces `isValidPassword` which requires ≥ 6 characters.
   - **Impact:** User can pass client-side validation with a 4-5 character password and receive a backend error "Password must be at least 6 characters long."
   - **Fix:** Change `password.length < 4` to `password.length < 6`.

5. **`login/page.tsx` post-login redirect for `customer` role ignores stored redirect target in some flows**
   - File: `frontend/app/login/page.tsx` lines ~53–66
   - `dispatchRoleBasedRedirect` sends customers to `redirectTarget` (from `?redirect=` query param). However, when `redirectTarget` is `/` (the default), customers are sent to the homepage rather than their dashboard. This is a UX issue not a security issue.
   - **Fix:** If `redirectTarget === '/'` and role is `customer`, redirect to `/profile` or the home page is acceptable — this is a product decision, not a bug.

6. **`login/page.tsx` uses `type="text"` for email input instead of `type="email"`**
   - File: `frontend/app/login/page.tsx` line ~166 (email input)
   - The input uses `type="text"` (to allow employee codes like `EMP-1001`). This is intentional per the logic that checks `isEmpCode`. However, the label says "Email Address" with no hint about employee codes.
   - **Fix:** Add a helper hint text: "Customers: use email. Employees: use your staff code (e.g. EMP-1001)." No type change needed.

### Backend (`backend/src/`)

7. **`authMiddleware.js` hardcodes a fallback JWT secret**
   - File: `backend/src/middlewares/authMiddleware.js` line ~12
   - `const secret = process.env.JWT_SECRET || 'spysalon_super_secret_jwt_key_2026';`
   - If `JWT_SECRET` is not set in `.env`, the application silently uses a well-known hardcoded secret. Any token signed with `'spysalon_super_secret_jwt_key_2026'` would be accepted.
   - **Impact:** High security risk in production. If `.env` is missing or `JWT_SECRET` is blank, all production JWTs are signed with a public constant.
   - **Fix:** Remove the hardcoded fallback. Throw a fatal startup error if `JWT_SECRET` is not set.

8. **`authService.js` uses `process.env.JWT_SECRET` without a fallback (asymmetric with middleware)**
   - File: `backend/src/services/authService.js` lines ~14–17
   - `authService` uses `const JWT_SECRET = process.env.JWT_SECRET` (no fallback), while `authMiddleware` has `process.env.JWT_SECRET || 'spysalon_super_secret_jwt_key_2026'`. This means tokens generated by the service (when `.env` is present) cannot be verified by the middleware if `.env` is absent, and vice versa — an inconsistency that could cause sporadic auth failures in misconfigured environments.
   - **Fix:** Both should throw a startup error if the secret is missing. Do not add any fallback to `authService`.

9. **`authService.sendLoginOtp` auto-creates a user account for any unknown email — security concern**
   - File: `backend/src/services/authService.js` lines ~195–210
   - When an unknown email is passed to `/auth/send-otp`, the service silently auto-registers a new customer account. This means any unauthenticated caller can create accounts for arbitrary email addresses.
   - **Impact:** Medium — spam account creation vector. An attacker can enumerate email addresses by calling `/send-otp` repeatedly.
   - **Fix:** Add rate limiting (already partially present via `otpSendLimiter`) and optionally add a flag to disable auto-registration for the OTP flow (require explicit registration first).

10. **`authMiddleware.js` does not check `user.isVerified` — unverified accounts can authenticate**
    - File: `backend/src/middlewares/authMiddleware.js`
    - The middleware only checks `user.status === 'Inactive'`. The `User` model has an `isVerified` field, but it is not checked during auth.
    - **Impact:** Low for current flow (registration sets `isVerified: true` automatically), but if a verification flow is added later, this would be a gap.
    - **Note:** Current code sets `isVerified: true` on registration so this is not currently exploitable.

### Flutter Mobile (`mobile_app/`)

11. **`login_screen.dart` phone number validation strips all non-digits but backend requires 10-digit Indian mobile numbers starting with 6/7/8/9**
    - File: `mobile_app/lib/screens/login_screen.dart` line ~81
    - `final cleanPhone = phone.replaceAll(RegExp(r'\D'), '')` then checks `cleanPhone.length < 10`. This accepts any 10+ digit number (e.g. a US number).
    - The backend's `isValidPhone` enforces that the first digit is 6, 7, 8, or 9.
    - **Impact:** User passes Flutter client validation but gets a backend error with `validateRequest({ phone: ['phone'] })` applied on register.
    - **Fix:** Add first-digit validation: `['6','7','8','9'].contains(cleanPhone[0])`.

12. **`splash_screen.dart` does not verify the JWT token's expiry — an expired token causes a successful session restoration followed by immediate 401s**
    - File: `mobile_app/lib/screens/splash_screen.dart` lines ~99–102
    - Stored token is read from `SharedPreferences` and used for role-based navigation without checking expiry. If the token is expired, the dashboard loads and all subsequent API calls return 401, which then clears the session — poor UX.
    - `ApiService.tryRefreshToken()` exists and works, but it is not called from the splash screen.
    - **Fix:** Call `ApiService.tryRefreshToken()` if the stored JWT appears expired before proceeding to the dashboard.

13. **`api_service.dart` `registerFcmToken` sends `userId` and `email` in the request body — already fixed per notification audit report (H1)**
    - File: `mobile_app/lib/services/api_service.dart`
    - Confirmed this was addressed in the previous notification audit. Status: **already fixed**.

14. **`fcm_service.dart` cold-launch `getInitialMessage` now uses 2800ms delay and auth guard — already fixed per notification audit report (H2)**
    - Status: **already fixed** in previous notification workflow pass.

### API Compatibility

15. **Web register page sends `termsAccepted` etc. — AuthContext drops them before the HTTP request**
    - This is issue #1 above. The net effect on the backend is that registration always uses the `consentData` defaults (`termsAccepted = consentData.termsAccepted !== false` → `true`). Functionally correct today, but the consent timestamp `acceptedAt` will always be set as if accepted, even if the user somehow bypassed the checkbox (the web page enforces the checkbox client-side, so this is low risk).

16. **Flutter and Web both omit `identifier` field for login — backend controller uses `identifier || email || phone`**
    - Flutter sends `{ identifier: loginInput }`. Web sends `{ email, password }`. Backend's `loginUser` uses `identifier || email || phone`, so both work. No fix needed.

---

## Files to Modify

| File | Change |
|------|--------|
| `frontend/context/AuthContext.tsx` | Widen `register` implementation parameter type; pass `termsAccepted`, `privacyPolicyAccepted`, `termsVersion`, `privacyPolicyVersion` in JSON body |
| `frontend/app/reset-password/page.tsx` | Redirect to `/forgot-password` (or fix reset flow); change success redirect from `/book` to `/login` |
| `frontend/app/forgot-password/page.tsx` | Change minimum password length check from `< 4` to `< 6` |
| `frontend/app/login/page.tsx` | Add helper hint about employee code format on the email input |
| `backend/src/middlewares/authMiddleware.js` | Remove hardcoded `'spysalon_super_secret_jwt_key_2026'` fallback; throw startup error if `JWT_SECRET` is unset |
| `mobile_app/lib/screens/login_screen.dart` | Add first-digit validation (6/7/8/9) to phone number check in `_handleRegister` |
| `mobile_app/lib/screens/splash_screen.dart` | Call `ApiService.tryRefreshToken()` when stored token exists; fall back to logout if refresh fails |

---

## Security Findings

1. **Hardcoded JWT secret fallback in `authMiddleware.js`** — `'spysalon_super_secret_jwt_key_2026'` is a well-known constant in the repository. If `JWT_SECRET` is missing from `.env` in production, any attacker who reads this source file can forge valid JWTs. **Severity: HIGH.** Fix: remove the fallback and fail at startup.

2. **Asymmetric JWT secret handling** — `authService.js` uses `process.env.JWT_SECRET` with no fallback while `authMiddleware.js` has a fallback. Tokens signed by the service won't be accepted by the middleware if the env is misconfigured. **Severity: MEDIUM.**

3. **OTP login auto-registers unknown emails** — `authService.sendLoginOtp` creates accounts for any unrecognised email. Combined with the existing rate limiter this is partially mitigated, but a distributed attacker could still enumerate and create accounts. **Severity: MEDIUM.**

4. **Role injection is impossible at registration** — confirmed: `authService.register` hardcodes `role: 'customer'`; the controller does not pass any client-supplied role field. This is correct and secure.

5. **Admin access is blocked in Flutter** — `login_screen.dart` and `splash_screen.dart` both call `ApiService.clearSession()` and refuse to navigate if `role === 'admin'`. Admin JWTs returned by the backend are immediately discarded. This is correct.

6. **JWT secret is embedded in `authMiddleware.js` source** — even if `.env` is correctly configured in production, having the fallback value in source is a credential exposure risk (GitHub scans, etc.). It must be removed.

7. **`authMiddleware.js` does not invalidate tokens on password change** — when a password reset occurs, `authService.resetPasswordWithOtp` revokes all refresh tokens, but existing access tokens remain valid until their 15-minute expiry. This is a standard JWT trade-off and acceptable given the short `JWT_EXPIRE = '15m'` lifetime.

8. **Notification routes secured** — confirmed fixed in the previous notification audit: `GET /notifications`, `GET /notifications/unread`, `PATCH /notifications/read-all` all now require the `protect` middleware and derive identity from `req.user`.

---

## Digest

### Files read and their relevant blocks

| File | Block examined | Test coverage |
|------|---------------|---------------|
| `backend/src/routes/authRoutes.js` | Full file — route definitions, `validateRequest` calls | No automated tests found; verify manually |
| `backend/src/middlewares/validateRequest.js` | Full file — `validateRequest` factory, `sanitizePayload` | No automated tests |
| `backend/src/utils/validators.js` | Full file — `isValidEmail`, `isValidPhone`, `isValidName`, `isValidPassword` | No automated tests |
| `backend/src/middlewares/authMiddleware.js` | Full file — `protect`, `optionalAuth`, `authorize` | No automated tests |
| `backend/src/services/authService.js` | Full file — `register`, `login`, `sendLoginOtp`, `refreshToken`, `deleteAccount`, `resetPasswordWithOtp` | No automated tests |
| `backend/src/controllers/authController.js` | Full file — all exported handlers | No automated tests |
| `backend/src/routes/profileRoutes.js` | Full file — profile route definitions | No automated tests |
| `frontend/context/AuthContext.tsx` | Full file — all auth context functions | No automated tests |
| `frontend/lib/validation.ts` | Full file — all validator functions | No automated tests |
| `frontend/lib/api.ts` | Full file — `apiFetch`, `refreshTokenSingleFlight`, URL helpers | No automated tests |
| `frontend/app/register/page.tsx` | Full file — form state, `handleSubmit`, `validateForm` call | No automated tests |
| `frontend/app/login/page.tsx` | Full file — `handlePasswordSubmit`, `dispatchRoleBasedRedirect` | No automated tests |
| `frontend/app/forgot-password/page.tsx` | Full file — two-step OTP + reset flow | No automated tests |
| `frontend/app/reset-password/page.tsx` | Full file — token-based reset flow | No automated tests |
| `frontend/app/employee/login/page.tsx` | Full file — redirect only | No automated tests |
| `mobile_app/lib/services/api_service.dart` | Lines 1–869 (register, login, tryRefreshToken, saveSession, clearSession) | No automated tests |
| `mobile_app/lib/screens/login_screen.dart` | Lines 1–773 (_handleLogin, _handleRegister, _buildRegisterForm) | No automated tests |
| `mobile_app/lib/screens/splash_screen.dart` | Full file — auth restoration, role-based routing | No automated tests |
| `mobile_app/lib/screens/onboarding_screen.dart` | Full file — no auth logic | No automated tests |
| `mobile_app/lib/services/fcm_service.dart` | Full file — cold-launch guard, handleNotificationNavigation | No automated tests |
| `.agents/tasks/notification-audit-report.md` | Full file — previous fixes verified | N/A |

### Build / test commands
- **Backend:** `cd backend && node src/server.js` (no test runner present)
- **Frontend:** `cd frontend && npm run dev` then navigate to `/register`, `/login`, `/forgot-password`
- **Flutter:** `cd mobile_app && flutter run` on a physical or emulator Android device

### What was verified by source inspection
- No "age" field exists anywhere in the current source across all three codebases
- The "Age is required" error cannot be reproduced by the current code
- `AuthContext.register` drops consent fields before serialization (confirmed by reading both the interface definition and implementation)
- Backend `register` route validates only `name`, `password`, `email`, `phone`
- Flutter `_handleRegister` sends the correct payload with no age field
- Backend `authMiddleware.protect` has a hardcoded secret fallback
- `reset-password/page.tsx` redirects to `/book` on success (wrong)
- `forgot-password/page.tsx` uses a 4-character minimum (wrong, should be 6)
- All notification security fixes from the previous workflow are in place

### What requires runtime testing
- Confirming the "age" error does not appear with the current backend running
- Token refresh behavior on expired JWT (splash screen)
- Flutter phone validation edge cases
- FCM cold-launch navigation flow
