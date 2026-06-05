# Star Cadets — Backlog (for the dedicated Titus session)

> This file is the work queue for StarCadets' own concurrent Titus CLI session
> (Eric S1375). When that session boots in `~/Projects/StarCadets` on its own
> `starcadets` task list, it seeds tasks from here, works until empty, then
> full-stops. Titus builds/iterates the game; the kids only play it.

## Live status (2026-06-05, verified)
- **Built + deployed.** Public URL the kids use: **https://ericbuess.github.io/StarCadets/**
  (GitHub Pages CDN — stays up independent of the dev Mac). Repo:
  github.com/ericbuess/StarCadets. Push to `main` → Actions builds (Bun) + deploys in ~30s.
- Local dev preview also runs at http://192.168.1.90:4178/ (LaunchAgent `com.titus.starcadets`).
- Hub + ~13 game engines render; **Math Drill** verified functional (3-number equations,
  keypad entry, correct answers score, Apple-Pencil draw pad). Zero console errors.

## Prioritized backlog
1. **Verify every game engine actually plays** (NeonRunner, Asteroids, BrickBreaker, Frogger,
   Pac-Man, Tetris, Gorillas, Snake, SnakeArena, NeonDash, HyperCircuit, EduRacer) — headless
   smoke + screenshot each; fix any that don't start. (Math Drill already verified.)
2. **Math Drill depth** — confirm/extend operations (×, ÷) + difficulty/grade levels + a
   level/difficulty selector so it grows with the kids; per-kid profile/progress.
3. **Apple-Pencil draw-to-answer polish** — exercise DrawCanvas recognition (8×8 prototypes),
   confirm recognition accuracy on iPad, tune.
4. **Finish the `plan.md` re-skin phases** not yet applied (audit Phases 4–5 vs shipped state).
5. **Sticker/reward loop** — verify Holo-Archive collection + unbox flow end-to-end.
6. **(Optional perk, do NOT over-invest — Eric S1375)** kids tinkering with AI on it.

## Constraints
- Kids do NOT use Claude on this; Titus builds it. The remote URL must not go down.
- No secrets in the repo (Supabase unconfigured; game runs on localStorage). Keep it that way
  for the public Pages deploy.
- Capabilities like video/music generation are Titus *skills*, not part of this game.
