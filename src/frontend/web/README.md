# Omada — `web` (Next.js)

This directory is an **optional Next.js 16** app. It is **not** the primary Omada web client.

## What to use for the product

The **Expo** app under `src/frontend/mobile` targets iOS, Android, and **web** (`npm run web`). Shared screens and **platform-specific** files (e.g. `Component.web.tsx` / `Component.tsx`) must live **inside that project** so Metro resolves them when bundling for web.

## When this folder is useful

- **Marketing site**, **docs**, or **landing pages** that are not part of the Expo bundle.
- A **future** dedicated web-only admin or dashboard that uses Next.js routing and SSR, with shared code extracted to a workspace package (if you introduce one).

## Scripts

```bash
npm install
npm run dev
```

Opens the placeholder page at [http://localhost:3000](http://localhost:3000).

## Relationship to Expo web

| Concern | Location |
|--------|----------|
| Omada app in the browser | `src/frontend/mobile` → `npm run web` |
| Web/native split components | `*.web.tsx` next to the shared code in `mobile/src` |
| Separate Next.js site | this folder |

## Shared code

If you later move API clients, types, or hooks into a shared package, both `mobile` and `web` can depend on it via the workspace root `package.json` (you would add that setup).
