# Auth Audit Review

**Reviewer:** Kiro (automated review step)  
**Scope:** Changes claimed in `auth-audit-report.md` across Flutter mobile, Next.js web, and Node.js backend.

---

## Evidence Report

### Files read

- `frontend/context/AuthContext.tsx` — full file
- `frontend/app/reset-password/page.tsx` — full file
- `frontend/app/forgot-password/page.tsx` — full file
- `frontend/app/login/page.tsx` — full file
- `backend/src/middlewares/authMiddleware.js` — full file
- `backend/src/services/authService.js` — lines 15–60
- `mobile_app/lib/screens/login_screen.dart` — lines 1–772
- `mobile_app/lib/screens/splash_screen.dart` — full file
- `mobile_app/lib/services/api_service.dart` — lines 1–120, 290–370, 434–520, 1782–1815
- `mobile_app/lib/services/fcm_service.dart` — lines 232–272
- `.agents/tasks/auth-audit/plan.md` — full file
- `.agents/tasks/auth-audit-report.md` — full file
- `.agents/tasks/notification-audit-report.md` — full file

---

### Fix-by-fix verification

#### Web — `AuthContext.register` consent fields (plan #1)

`AuthContext.tsx` lines ~211–230: implementation parameter type is `{ name, email, phone, password, termsAccepted?, privacyPolicyAccepted?, termsVersion?, privacyPolicyVersion? }`. Body serialises the full `formData` object via `JSON.stringify(formData)`. All consent fields are now forwarded.  
**Verified: PASS**

#### Web — `reset-password/page.tsx` success redirect (plan #3)

`reset-password/page.tsx` line ~46: `router.push('/login')`.  
**Verified: PASS**

#### Web — `reset-password/page.tsx` minimum password length

`reset-password/page.tsx` line ~34: `if (password.length < 6)`. Consistent with backend `isValidPassword`.  
**Verified: PASS**

#### Web — `forgot-password/page.tsx` minimum password length (plan #4)

`forgot-password/page.tsx` line ~53: `if (!password || password.length < 6)`.  
**Verified: PASS**

#### Web — `login/page.tsx` employee code hint (plan #5)

`login/page.tsx` lines ~222–224: `<p className="text-[11px] text-gray-500 mt-1">Customers: use your email. Employees: use your staff code (e.g. EMP-1001).</p>` below the email input.  
**Verified: PASS**

#### Backend — `authMiddleware.js` hardcoded secret removed (plan #7)

`authMiddleware.js` lines 4–12: `const JWT_SECRET = process.env.JWT_SECRET; if (!JWT_SECRET) { throw new Error('FATAL: ...') }`. Fallback string `'spysalon_super_secret_jwt_key_2026'` is not present anywhere in the file. Both `protect` and `optionalAuth` use the module-level `JWT_SECRET`.  
**Verified: PASS**

#### Backend — JWT secret asymmetry (plan #8)

`authService.js` line 18: `const JWT_SECRET = process.env.JWT_SECRET;` — no fallback. Because `authMiddleware.js` throws at module-load time when `JWT_SECRET` is unset, the server crashes before any signing or verification can occur. The asymmetry risk is eliminated by the middleware's startup guard.  
**Verified: ACCEPTABLE**

#### Flutter — `login_screen.dart` phone first-digit validation (plan #11)

`login_screen.dart` lines ~110–114: `if (!['6', '7', '8', '9'].contains(cleanPhone[0]))` with a descriptive error message.  
**Verified: PASS**

#### Flutter — `splash_screen.dart` JWT expiry + refresh (plan #12)

`splash_screen.dart`:
- `dart:convert` import present at line 2 ✓
- `_isJwtExpired(String token)` helper uses `base64Url.normalize` + `json.decode` to read `exp` claim; returns `true` on any parse failure (conservative) ✓
- Stage 3: for non-admin sessions, `_isJwtExpired(token)` is called; if expired, `ApiService.tryRefreshToken()` is awaited with a 6-second timeout; if refresh returns `false` or throws, `ApiService.clearSession()` is called and `isLoggedIn = false` ✓
- `tryRefreshToken()` return type is `Future<bool>` — assignment to `bool tokenValid` is type-correct ✓

**Verified: PASS**

#### Flutter — `markAllNotificationsRead` PII removal (plan #13 / notification audit H1)

`api_service.dart` lines 1785–1797: `markAllNotificationsRead` sends `body: json.encode(<String, dynamic>{})` — empty object, no PII.  
**Verified: PASS** (correctly attributed to notification-audit H1; plan item #13 incorrectly attributes it to `registerFcmToken` but the fix is in place)

#### Flutter — cold-launch FCM guard (notification audit H2)

`fcm_service.dart` lines ~232–250: `registerFcmToken` call site — still passes `userId`, `email`, `role` from stored user. The notification audit report explicitly listed `registerFcmToken` as "untouched" (preserved working feature). H1 fixed `markAllNotificationsRead`, not `registerFcmToken`. The plan item #13 contains a documentation inaccuracy (says H1 fixed `registerFcmToken`), but the actual security-sensitive fix (`markAllNotificationsRead`) is correctly applied. `registerFcmToken` sending user data to the device-token registration endpoint is a pre-existing condition out of scope for this audit.  
**No new regression introduced.**

---

### Security checks

| Check | Result |
|-------|--------|
| No hardcoded secrets introduced | ✓ Pass |
| `JWT_SECRET` fallback removed from `authMiddleware.js` | ✓ Pass |
| No new fallback added to `authService.js` | ✓ Pass |
| Role injection at registration impossible (`authService.register` hardcodes `role: 'customer'`) | ✓ Pass — unchanged |
| Admin JWT discarded in Flutter login and splash screens | ✓ Pass — unchanged |
| No validation removed from backend | ✓ Pass |
| Consent fields now forwarded (not dropped) — no bypass introduced | ✓ Pass |
| `reset-password/page.tsx` broken token flow: still broken at protocol level, but now redirects to `/login` on success | ✓ Acceptable — documented remainder |
| No dummy/fake data introduced | ✓ Pass |
| No JWT secrets or credentials exposed | ✓ Pass |

---

### Plan accuracy note (documentation only, no code impact)

Plan item #13 states "`registerFcmToken` sends `userId` and `email` in the request body — already fixed per notification audit report (H1)." This is inaccurate: H1 fixed `markAllNotificationsRead`, and the notification audit report explicitly listed `registerFcmToken` as untouched. The `registerFcmToken` method still sends `userId`, `email`, and `role`. This is a pre-existing condition out of scope for the current task and does not constitute a regression introduced by this change set.

---

## Verdict

All planned fixes are present and correctly implemented. No hardcoded secrets remain. No validation was removed. No fake data was introduced. The one unresolved item (`reset-password/page.tsx` legacy token flow) is correctly documented as requiring a product decision; the mitigated state (correct success redirect, correct password length check) is in place. No blockers remain.

**APPROVED**
