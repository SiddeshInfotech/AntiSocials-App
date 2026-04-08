# Frontend API Binding Guide (Expo)

This document is the implementation starter for binding the mobile frontend with the backend APIs in this repository.

## 1. Base Setup

- Base URL should be environment-driven.
- Local Expo on device must use LAN IP, not localhost.

Example:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:4000
```

## 2. Response and Error Contract

Most success responses follow:

```json
{
  "success": true,
  "message": "Optional",
  "data": {}
}
```

Validation failure:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "fieldName": ["error message"]
  }
}
```

General failure:

```json
{
  "success": false,
  "message": "Some error"
}
```

Rate limits return `429` with endpoint-specific message.

## 3. Auth Requirements

- Protected routes require `Authorization: Bearer <token>`.
- Missing, malformed, invalid, or expired token returns `401`.
- On `401`, frontend should clear session and navigate to auth stack.

## 4. Endpoint Matrix

### Public Endpoints

- `GET /health`
- `POST /auth/register-email`
- `POST /auth/login-email`
- `POST /auth/send-otp`
- `POST /auth/verify-otp`

### Protected Endpoints

- `GET /tasks/today`
- `GET /tasks/:id/subtasks`
- `POST /tasks/:id/complete`
- `GET /wallet`
- `GET /wallet/transactions`
- `GET /streak`
- `GET /life-circle`
- `GET /profile`
- `PUT /profile`
- `PATCH /profile`
- `POST /activities`
- `GET /activities/discover`
- `GET /activities/joined`
- `POST /activities/:id/join`
- `DELETE /activities/:id/leave`
- `GET /notifications/devices`
- `POST /notifications/devices/register`
- `POST /notifications/devices/unregister`

## 5. Frontend Client Template (TypeScript)

```ts
import axios from "axios";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      await clearSession();
      navigateToAuth();
    }

    throw normalizeApiError(error);
  },
);

export { api };
```

## 6. Feature Service Layout (Recommended)

```txt
src/api/client.ts
src/api/types.ts
src/features/auth/auth.api.ts
src/features/tasks/tasks.api.ts
src/features/wallet/wallet.api.ts
src/features/streak/streak.api.ts
src/features/lifeCircle/lifeCircle.api.ts
src/features/profile/profile.api.ts
src/features/activities/activities.api.ts
src/features/notifications/notifications.api.ts
```

## 7. React Query Key and Invalidation Map

Recommended keys:

- `auth.me`
- `tasks.today`
- `tasks.subtasks.{taskId}`
- `wallet.summary`
- `wallet.transactions`
- `streak.current`
- `lifeCircle.scores`
- `profile.me`
- `activities.discover`
- `activities.joined`
- `notifications.devices`

On successful `POST /tasks/:id/complete`, invalidate:

- `tasks.today`
- `wallet.summary`
- `wallet.transactions`
- `streak.current`
- `lifeCircle.scores`

## 8. UX Rules to Implement

- OTP: show resend cooldown and limit-reached message on `429`.
- Task complete: disable button while request is in flight.
- Task complete `409`: show "already completed" state (do not retry loop).
- Profile: lock username editing after profile is completed.
- Edit Profile: use `PATCH /profile` for partial updates.
- Profile photo update uses base64 data URL (`data:image/<type>;base64,...`).
- `PUT /profile` remains onboarding-style and expects full profile payload.
- Activities create: enforce date and time together; compress image before base64 upload.

## 9. Known Integration Notes

- `GET /tasks/today` should be request-deduped on app startup.
- Wallet transactions and activities lists are currently non-paginated.
- Base64 payloads for photos should be compressed on device before upload.

## 10. Backend Files (Source of Truth)

- `src/app.ts`
- `src/middleware/auth.ts`
- `src/middleware/error-handler.ts`
- `src/middleware/validate.ts`
- `src/middleware/rate-limit.ts`
- `src/modules/auth/auth.routes.ts`
- `src/modules/tasks/tasks.routes.ts`
- `src/modules/wallet/wallet.routes.ts`
- `src/modules/streak/streak.routes.ts`
- `src/modules/lifeCircle/lifeCircle.routes.ts`
- `src/modules/profile/profile.routes.ts`
- `src/modules/activities/activities.routes.ts`
- `src/modules/notifications/notifications.routes.ts`
