# 🌐 Omada — Next.js Web (Placeholder)

> This directory is an **optional Next.js 16** app. It is **not** the primary Omada web client.

---

## ⭐ What to use for the product

The **Expo** app under `src/frontend/mobile` is the real Omada client:

| Platform | Command | Result |
|----------|---------|--------|
| 🌐 Browser | `npm run web` | Full Omada app in browser |
| 📱 iOS / Android | `npm run ios` / `android` | Native mobile app |

Platform-specific behavior uses **`*.web.tsx`** files **inside** `mobile/src/` — Metro resolves them when bundling for web.

---

## 🤔 When is this folder useful?

| Use case | Why Next.js here |
|----------|------------------|
| 📣 **Marketing site** | Landing pages separate from the Expo bundle |
| 📚 **Documentation site** | Static/SSR docs |
| 🔮 **Future web admin** | Dedicated SSR dashboard (would share a workspace package) |

---

## 🚀 Scripts

```bash
npm install
npm run dev
```

Opens the placeholder page at [http://localhost:3000](http://localhost:3000).

---

## 📊 Expo web vs Next.js

| Concern | Location |
|---------|----------|
| ⭐ Omada app in browser | `src/frontend/mobile` → `npm run web` |
| 🔀 Web/native split components | `*.web.tsx` in `mobile/src/` |
| 📣 Separate marketing site | **This folder** |

---

## 📁 What's here

```text
web/
├── package.json          Next.js 16
├── next.config.ts
└── src/app/
    ├── layout.tsx
    └── page.tsx          Placeholder → points to Expo web
```

**Not connected** to Omada APIs today.

---

## 🔮 Shared code (future)

If you extract API clients, types, or hooks into a shared package, both `mobile` and `web` can depend on it via a workspace root `package.json`.

---

## 📚 Documentation

| Doc | Topic |
|-----|-------|
| 📱 [`../mobile/README.md`](../mobile/README.md) | Primary mobile client |
| 📖 [`../../docs/Frontend.md`](../../docs/Frontend.md) | Full frontend guide |
| 🏠 [`../../README.md`](../../README.md) | Monorepo overview |
| 🔧 [`../../docs/Configuration.md`](../../docs/Configuration.md) | Environment setup |
