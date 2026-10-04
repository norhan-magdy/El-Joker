# El-Joker Mobile

Expo / React Native storefront and staff console for the El-Joker Laravel API.
Replaces nothing in the web app — both clients talk to the same frozen backend.

## Requirements

- Node 20+
- Expo SDK 57 (`npx expo install` resolves SDK-compatible versions)
- A running Laravel backend on port 8000

## Setup

```bash
npm install
cp .env.example .env      # adjust if the backend is not on localhost:8000
npm start
```

### Pointing at the backend

| Target | Value |
| --- | --- |
| iOS simulator / web | `http://localhost:8000/api` |
| Android emulator | `http://10.0.2.2:8000/api` |
| Physical device | `http://<your-LAN-IP>:8000/api` |

Set `EXPO_PUBLIC_API_URL` for an explicit override. Android emulators cannot
reach the host over `localhost`; `src/lib/config.ts` substitutes `10.0.2.2` when
the URL is not set explicitly. No trailing slash.

## Commands

```bash
npm start           # dev server
npm run android     # dev server, open Android
npm run ios         # dev server, open iOS
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
npm test            # jest
npm run check       # typecheck + lint + test
npm run doctor      # expo-doctor
```

`npm run check` is the gate to run before calling anything done.

Native projects are not checked in. Use `npx expo run:ios|android` locally, or
`eas build --profile development`, because the app uses native modules that
Expo Go does not bundle.

## Architecture

```
src/
  app/          expo-router routes; every file here is a screen
    _layout.tsx root providers, hydration gate, Stack.Protected guards
    index.tsx   always-available redirect anchor
    (shop)/     public tabs: home, search, account
    (auth)/     customer login and registration
    admin/      staff console
  components/
    ui/         design-system primitives (exported from ui/index.ts)
    layout/     Screen, ScreenHeader, ListRow, AuthShell
    product/    ProductCard
    order/      OrderStatusBadge and transition rules
  hooks/        data hooks: use-products, use-cart, use-categories, ...
  lib/
    api/        one module per API area; client.ts owns transport and errors
    types.ts    the API contract
    schemas.ts  Zod validation, mirrored from Laravel FormRequests
    forms.ts    Laravel 422 -> react-hook-form field errors
    query-keys.ts
  providers/    QueryProvider, SafeAreaProviderWrapper
  store/        Zustand auth store
  theme/        typed design tokens mirroring the web globals.css
```

### Conventions that matter here

- **Route guards.** `Stack.Protected guard={...}` owns access control. `redirectTo`
  is SDK 58+, so a denied route falls back to the always-available `index` anchor.
- **Tabs.** `Tabs` is imported from `expo-router/js-tabs`; the `expo-router`
  export is deprecated in SDK 57.
- **Errors.** `ApiError` is a typed union (`validation` / `stock` / `business`).
  Never branch on a message string.
- **Query keys.** All keys come from `lib/query-keys.ts` so an invalidation
  cannot miss a sibling cache.
- **Tokens.** Customer and admin tokens are stored separately (`api` / `admin`),
  so one device can hold both sessions. The backend revokes prior same-named
  tokens on login.
- **Forms.** Values are strings, because that is what a `TextInput` holds.
  `z.coerce.number()` is deliberately avoided: it makes Zod's input type
  `unknown`, which does not satisfy react-hook-form's resolver generics.
  Convert after validation.

## Backend contract this app assumes

- Product detail is keyed by UUID id, not slug: Laravel binds
  `products/{product}` on the primary key because `Product` does not override
  `getRouteKeyName()`.
- Catalogue category filters take comma-joined category **slugs**.
- Categories are capped at 20 per page with no `per_page` override, so the full
  tree is walked page by page.
- Order list endpoints take `page` only — there is no status filter, so any
  status filter in the UI narrows the loaded page and says so.
- `OrderService::updateStatus()` validates only that a status is one of the five
  known values. It does not enforce a sequence, so a wrong transition is applied
  rather than rejected.
- Checkout accepts free-text `shipping_address`; there is no address book, so the
  last address is a device-local prefill only.
- Invoice PDF sharing tries the signed link first and falls back to
  authenticated bytes, because `temporaryUrl()` is unsupported on the default
  `local` invoice disk.

## Not available in the API

Profile editing, password reset, address book, customer-initiated cancellation,
image upload, reviews, push notifications, and offline cart. The UI does not
offer controls for any of these.
