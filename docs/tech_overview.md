# Tech Overview

Local-first React + TypeScript + Vite SPA. Everything runs in the browser; persistence can be added via `localStorage` later.

## Stack
- React 18, TypeScript 5, Vite 5.
- Styling: CSS modules/simple CSS (no global framework).
- Tooling: Vite dev server/build, esbuild under the hood.

## Project Layout
- `src/App.tsx` — landing shell with entry points for setup, live session, settlement.
- `src/components/SectionCard.*` — simple card UI building block.
- `src/domain/` — domain model aligned with `docs/general_idea.md` (types, constants).
- `src/index.css`, `src/App.css` — base/global styles.
- `vite.config.ts`, `tsconfig*.json` — tooling config.

## Domain Model Highlights
- `Denomination`, `CalculatorMode`, `ChipStack` primitives.
- `Player` with `wallet_balance`.
- `GameConfig` for table setup (players, multiplier, chip counts, mode, loan rules).
- `Loan` ledger entries (player↔player or bank).
- `Settlement` with net results and suggested transfers.
- `GameSession` aggregates config, stacks, events, and settlement.

## State & Persistence (future)
- State lives client-side; no backend planned.
- `localStorage` can keep players, session history, defaults, and last-known state.
- Export/import JSON can be added for backups/migration.

## UX Flow (target)
- Setup: choose players, set multiplier/chips/mode, preview stack split.
- Live: track stacks, rebuys, loans; enforce chip availability and debt limits.
- Settlement: enter final stacks, compute net results, suggest transfers, update wallets (SALDO mode).


