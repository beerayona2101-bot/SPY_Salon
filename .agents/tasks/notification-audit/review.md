# SPY Salon notification system — icon, navigation, screen, and badge

This change introduces the complete notification pipeline that was previously missing: a proper monochrome Android notification icon, `handleNotificationNavigation` that actually navigates instead of showing SnackBars, five new `ApiService` methods for notification CRUD, a new `NotificationScreen`, and bell-icon badges in both the customer and employee dashboard AppBars. The existing FCM initialization, token lifecycle, background/foreground listeners, and all business workflows are untouched. Backend notification routes are already in place; the new client methods align exactly with those routes.

Watch for: (**confirmed**) `markAllNotificationsRead` leaks user identity (role, userId, email) into the request body even though the backend derives identity from the JWT — at worst a no-op, but it sends PII in a request body that probably ignores it. (**confirmed**) `Colors.transparent` is used as the unread-tile background fallback in `NotificationScreen`, which is technically not an `AppColors` token but is also not a brand colour — a minor but reviewable deviation. (**possible**) `getInitialMessage` fires navigation after a fixed 1 200 ms delay with no guard to ensure the user is authenticated before `NotificationScreen` loads.

**Verdict**: APPROVED

---

## High-level view

`ic_notification.xml` is a valid 24 × 24 dp vector drawable with a single `<path>` carrying `android:fillColor="@android:color/white"` — the correct form for Android's monochrome notification icon contract. The `AndroidManifest.xml` now carries both required FCM meta-data tags (`default_notification_channel_id` and `default_notification_icon`), so system-delivered notifications in background and terminated states will use the correct icon.

`handleNotificationNavigation` now routes every tap — appointment, leave, attendance, and the catch-all default — to `NotificationScreen`. The previous SnackBar-only behaviour is gone entirely. The 1 200 ms delay on `getInitialMessage` buys time for Flutter to mount the navigator, but there is no explicit check that a valid session exists before pushing `NotificationScreen`, so a cold launch from a notification on a logged-out device could land on the screen with no auth token.

The five new `ApiService` methods follow the same `try / catch / debugPrint` pattern as existing methods. All endpoint paths align with the backend `notificationRoutes.js`: `GET /notifications`, `GET /notifications/unread`, `PATCH /notifications/read/:id`, `PATCH /notifications/read-all`, `DELETE /notifications/:id`. The one notable quirk is in `markAllNotificationsRead`, which builds a body carrying `role`, `userId`, and `email` from the stored user — data the backend ignores in favour of its JWT middleware, so these fields travel unnecessarily.

`NotificationScreen` uses `AppColors.of(context)` for every colour token. The single exception is `Colors.transparent` as the background of a read notification tile, which is semantic ("no background") rather than a brand colour and is unlikely to cause a theme regression. The screen handles every required state: loading spinner, error with retry, empty, populated list with pull-to-refresh, per-item delete, tap-to-mark-read, and mark-all-read.

Both dashboard AppBars add the bell icon as an additional `actions` entry, preserving all existing actions. The badge reads from `_unreadNotificationCount`, which is loaded on `initState`, refreshed on return from `NotificationScreen`, and updated live via `notification:new` and `notifications:updated` Socket.IO events on the already-joined room.

---

<details>
<summary>Issues (3)</summary>

1. **Identity leak in markAllNotificationsRead** — The method reads the stored user and embeds `role`, `userId`, and `email` into the PATCH body, but `/api/v1/notifications/read-all` derives identity from the JWT. The fields are ignored server-side, but PII still travels in the request body unnecessarily. Remove the user-lookup and send an empty body `{}`.

2. **Unauthenticated cold-launch navigation** — `getInitialMessage` uses a 1 200 ms `Future.delayed` then calls `handleNotificationNavigation`, which unconditionally pushes `NotificationScreen`. If the app was cold-launched on a device with no valid session (token expired, first install), `NotificationScreen` will call `ApiService.getNotifications()` and receive a 401, showing the error state rather than redirecting to login. Add an `ApiService.getStoredToken()` null-check before navigating, or let `NotificationScreen` redirect to login on 401.

3. **Colors.transparent not an AppColors token** — `_buildNotificationTile` sets `color: Colors.transparent` for read tiles. The task requires `AppColors.of(context)` throughout. While `Colors.transparent` is theme-neutral and won't cause a visual regression, it deviates from the stated requirement. Replace with `themeColors.cardSurface` or a dedicated `AppColors` transparent token if one exists.

</details>

<details>
<summary>Details</summary>

### Monochrome icon and manifest wiring

`ic_notification.xml` uses `android:fillColor="@android:color/white"` and a standard 24 dp viewport. `AndroidManifest.xml` carries both `default_notification_icon` → `@drawable/ic_notification` and `default_notification_channel_id` → `spy_salon_notifications`, matching the channel declared in `_initLocalNotifications`. `AndroidInitializationSettings` and `AndroidNotificationDetails.icon` in `fcm_service.dart` both reference `@drawable/ic_notification`, ensuring foreground local notifications use the same icon as system-delivered FCM ones.

### Notification navigation on cold launch

`getInitialMessage` registers inside `_setupListeners`, which is called unconditionally during `initialize()`. The 1 200 ms delay is a pragmatic workaround for navigator readiness, but it does not verify session state. If a logged-out user taps a notification to cold-launch the app, the navigator will be ready and `NotificationScreen` will be pushed before the auth gate has run. The `NotificationScreen` will call `getNotifications()`, get a 401 (which `_requestWithRetry` handles by calling `_handle401()` → `clearSession()`), and render the error state — no crash, but a poor UX that silently clears whatever partial session existed. A `getStoredToken()` guard before the `handleNotificationNavigation` call would close this gap. (**confirmed**)

### API surface and endpoint alignment

All five new methods use `_requestWithRetry`, which provides automatic retries, 401 refresh exchange, and `debugPrint` logging — consistent with the rest of the service. The endpoint paths match `notificationRoutes.js` exactly:

| Method | Verb | Path |
|---|---|---|
| `getNotifications` | GET | `/api/v1/notifications?limit=N` |
| `getUnreadNotificationCount` | GET | `/api/v1/notifications/unread` |
| `markNotificationRead` | PATCH | `/api/v1/notifications/read/:id` |
| `markAllNotificationsRead` | PATCH | `/api/v1/notifications/read-all` |
| `deleteNotification` | DELETE | `/api/v1/notifications/:id` |

`markAllNotificationsRead` calls `getStoredUser()` and injects `role`, `userId`, and `email` into the body. The backend `notificationController.markAllAsRead` uses `req.user` from JWT middleware and ignores any body fields. The call is a confirmed no-op data leak — PII sent, silently discarded. (**confirmed**)

### NotificationScreen AppColors compliance gap

One `Colors.transparent` usage exists at line 270 in `_buildNotificationTile` as the background of a read tile. Every other colour reference goes through `AppColors.of(context)`. The task requires `AppColors.of(context)` throughout with no raw `Color()` literals; `Colors.transparent` is not a `Color()` literal but it is also not an `AppColors` token. Replace with `themeColors.cardSurface`. (**confirmed**)

Local state mutation in `_onTapNotification` updates `isRead` and decrements `_unreadCount` immediately without an API round-trip. The delete path decrements `_unreadCount` only if the deleted notification was unread — the asymmetry is correct.

</details>

---

<details>
<summary>File map</summary>

| File | What changed |
|---|---|
| `android/.../drawable/ic_notification.xml` | New monochrome bell vector drawable (white fill, 24 dp) |
| `android/.../AndroidManifest.xml` | Added `default_notification_channel_id` and `default_notification_icon` FCM meta-data tags |
| `lib/services/fcm_service.dart` | Icon references updated to `@drawable/ic_notification`; `handleNotificationNavigation` rewritten to push `NotificationScreen`; import added |
| `lib/services/api_service.dart` | Five new notification CRUD methods appended |
| `lib/screens/notification_screen.dart` | New screen: list, empty, error, loading states; per-item mark-read and delete; mark-all-read |
| `lib/screens/customer_dashboard_screen.dart` | Bell icon with unread badge added to AppBar; `_unreadNotificationCount` state and Socket.IO listener added |
| `lib/screens/employee_dashboard_screen.dart` | Same bell icon and badge changes as customer dashboard |
| `.agents/tasks/notification-audit-report.md` | New audit report with all seven sections A–G |

Full diff: `git diff main -- mobile_app/ .agents/`

</details>
