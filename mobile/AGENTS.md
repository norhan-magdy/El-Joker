This is an Expo/React Native app for the El-Joker Laravel storefront. The backend is
**frozen**: adapt the mobile client to the existing API, never change the API to
suit the client. Prefer a small honest UI over a screen that lies about what the
server supports.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. This project is on **SDK 57**.
Before writing code that touches an Expo, EAS, or React Native API:

1. Read the `expo` version in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v57.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of Expo
   docs with corrections to common LLM misconceptions. Follow its links; never
   answer from memory.

Concrete SDK 57 traps already hit in this repo:

- `Tabs` comes from `expo-router/js-tabs`. The `expo-router` export is deprecated.
- `expo-file-system` exposes `File`, `Directory`, and `Paths`. `cacheDirectory`,
  `writeAsStringAsync`, and other legacy helpers are **not** on the top-level
  export — see `src/app/orders/[id].tsx` for the correct
  `new File(Paths.cache, name)` → `create({ overwrite: true })` → `write(bytes)`
  sequence.
- FlashList 2 does not take `estimatedItemSize`.
- `Stack.Protected` / `Tabs.Protected` accept `guard`, but `redirectTo` is SDK 58+.
  Denied routes fall back to the always-available `src/app/index.tsx` anchor.

## Commands

```bash
npx expo install <package>   # ALWAYS, never `npm install <pkg>` — resolves SDK-compatible versions
npm run check                # typecheck + lint + test — run before declaring anything done
npx expo-doctor              # dependency and config diagnostics
npx expo install --check     # verify versions
npx expo export --platform android   # real Metro bundle; catches bad runtime imports tsc misses
```

`tsc` cannot catch a wrong runtime import. When touching a native module, run an
`expo export` — it is the only check that proves the bundle resolves.

## Architecture rules

- Routes live in `src/app/`. Every file there is a screen; `_layout.tsx` defines
  navigators. All non-route code goes outside `src/app/`.
- **Access control belongs to `Stack.Protected` guards** in the root layout,
  keyed off the auth store. Do not add redirect logic in screens, and do not
  re-check guards in a child `_layout` — that fights the parent and can loop.
- Guards are keyed on the *right* session. Customer routes check `customer`;
  admin routes check `isAdminSession(admin)`. A device can hold both sessions, so
  a staff screen must not live inside a customer-gated group.
- Typed routes are on (`experiments.typedRoutes`). A `router.push("/typo")` is a
  compile error; do not cast around it.
- All React Query keys come from `src/lib/query-keys.ts`. Hierarchical, so
  `invalidateQueries({ queryKey: queryKeys.catalog.all })` busts a whole subtree.
- Errors are the typed `ApiError` union in `lib/api/errors.ts`
  (`validation` | `stock` | `business`). Never branch on a message string —
  the wording is not part of the contract.
- Map Laravel 422 payloads through `lib/forms.ts` (`applyServerErrors`) so
  `errors` land on fields. A 422 carrying only `message` is a banner, not a
  field error.
- Form values are **strings**, because that is what a `TextInput` holds. Do not
  reach for `z.coerce.number()`: it widens Zod's input type to `unknown` and
  breaks react-hook-form's resolver generics. Validate the string, convert after.
- Tokens are stored per scope (`api` for customer, `admin` for staff). The
  backend deletes prior same-named tokens on login, so a customer login revokes
  the web session. Do not "fix" this by merging the two stores.
- Design tokens are typed and mirror `frontend/app/globals.css`. Do not hardcode
  hex or rgba values in screens — including for borders and dividers.
- Auth state must not be read before `bootstrapped`. The root layout gates on it
  so a cold start does not bounce a signed-in user to the login screen.

## Backend facts that constrain the UI

Check these before adding a control:

- Product routes bind on **UUID id**, not slug. `Product` does not override
  `getRouteKeyName()`.
- Category filters are comma-joined **slugs**, not ids.
- Categories cap at 20 per page with no `per_page`; walk pages to build the tree.
- Order lists accept `page` only. There is no status filter, so a status filter
  in the UI must narrow the loaded page and say so on screen.
- `OrderService::updateStatus()` accepts any of the five statuses without
  checking the sequence. A wrong transition is applied, not rejected.
- `POST /orders/checkout` requires free-text `shipping_address` and is throttled
  10/min, 50/day. There is no address book; last-address is device-local prefill.
- Checkout is throttled and stock is decremented atomically; a 409 `stock`
  conflict means the cart is still intact.
- Invoice sharing must try the signed link first, then fall back to
  authenticated bytes, because `temporaryUrl()` fails on the `local` disk.
- Does not exist: profile editing, password reset, address book, customer
  cancellation, image upload, reviews, push notifications, offline cart.

## Known, accepted issues

- `npm audit` reports 17 advisories, all transitive and build-time only:
  `node-forge` via `@expo/cli`'s code-signing chain, and `decode-uri-component`
  via `expo-router`'s `query-string`. Every suggested fix is a breaking
  downgrade (`expo@44`, `expo-router@5`). Do **not** run `npm audit fix --force`.
- `@expo/vector-icons` is installed for Ionicons on both platforms despite the
  current deprecation guidance; tab icons depend on it.

## Building

EAS builds and over-the-air updates: `eas build`, `eas submit`, `eas update`
(run as `npx eas-cli@latest <command>`). `ios/` and `android/` are generated —
never create or edit them by hand; use `app.config.ts` and config plugins.
Expo Go is insufficient because the app uses native modules; use
`npx expo run:ios|android` or `eas build --profile development`.
