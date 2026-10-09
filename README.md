# Sail — Realtime Cooperative Multiplayer

Private 2-player browser implementation of the cooperative trick-taking board game **Sail**.

## Stack

- **Client:** React + TypeScript + Vite + Tailwind
- **Server:** Node.js + Express + Socket.IO
- **Engine:** Pure TypeScript in `shared/` (no DOM / Socket deps)

## Commands

```bash
npm install
npm run dev      # client :5173 + server :3001
npm run test
npm run build
```

Open two browser windows, create/join the same room code, pick pirates, and play.

## Notes

- Scenario 1 and pirate abilities are **reconstructed** approximations (see `shared/src/game-engine/scenarios.ts` and `pirates.ts`) and can be corrected against the printed materials.
- Core rules follow `Sail_Rulebook_v10.pdf`.
- Original CSS/SVG artwork only — no commercial game art.
