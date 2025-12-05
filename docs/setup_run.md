# Setup & Run (local)

Use Node 22 (matches `.nvmrc`); npm is assumed.

## 1) Install deps
```bash
npm install
```

## 2) Start dev server
```bash
npm run dev
# opens http://localhost:5173
```
Stop with `Ctrl+C`.

## 3) Build for production
```bash
npm run build
```

## 4) Preview built app
```bash
npm run preview
# serves the dist build locally
```
Stop with `Ctrl+C`.

## Notes
- Frontend-only; no backend or database required.
- State/persistence not yet wired; will be added via `localStorage` and JSON export/import.
- If you switch Node versions, reinstall deps to avoid native-module mismatches.


