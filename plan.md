# Star Cadets Re-skin + Speed Drill Integration Plan

## Overview
Re-skin the entire EduGames app with the "Star Cadets — Galactic Math Academy" arcade theme from the design handoff, AND integrate the 3-number speed drill game from the GitHub repo as a new game in the hub.

## Phase 1: Foundation — Fonts, Tokens, Global Styles
1. Update `index.html` title to "Star Cadets — Galactic Math Academy"
2. Add Google Fonts (Press Start 2P + VT323) to `index.html`
3. Add CSS custom properties from the design handoff to `src/index.css` (colors, backgrounds)
4. Add keyframe animations: shake, pulse, correctPulse, blink, particle animations
5. Add scanline overlay CSS, starfield background gradient

## Phase 2: Shared UI Components
6. Create `src/components/ui/PixelPanel.tsx` — panel surfaces (default, hot, info, error)
7. Create `src/components/ui/ArcadeButton.tsx` — arcade-style embossed buttons with hierarchy (pink CTA / yellow reward / green positive / muted neutral)
8. Create `src/components/ui/StarField.tsx` — decorative twinkling star background
9. Create `src/components/ui/ScanlineOverlay.tsx` — CRT scanline effect overlay

## Phase 3: Speed Drill Game Integration
10. Copy and adapt from GitHub repo into our project:
    - `src/game/drillProblems.ts` — equation generation (genProblem)
    - `src/game/drillScoring.ts` — star scoring, accuracy, perMin
    - `src/game/drillRecognize.ts` — handwriting recognition (8×8 prototypes + recognizeNumber)
    - `src/types/drill.ts` — Problem, DrillResult, SessionMode, Settings, Stats, RecentRun, Sticker types
    - `src/game/drillStorage.ts` — localStorage persistence for drill state
11. Create `src/components/DrawCanvas.tsx` — Apple Pencil canvas with stroke rendering + recognition
12. Create `src/components/drill/DrillScreen.tsx` — the main speed drill game screen
13. Create `src/components/drill/DrillResultsScreen.tsx` — mission clear results
14. Create `src/components/drill/UnboxScreen.tsx` — supply crate reward animation
15. Create `src/components/drill/CollectionScreen.tsx` — holo-archive sticker grid
16. Create `src/components/drill/StatsScreen.tsx` — flight log with weekly chart
17. Create `src/components/drill/DrillSettingsScreen.tsx` — mission briefing (session/pen/sound)
18. Create `src/game/drillStickers.ts` — 9 pixel-art sticker definitions with palette
19. Create `src/components/drill/PixelSticker.tsx` — renders 16×16 pixel art from string arrays
20. Create `src/components/drill/StickerCard.tsx` — sticker display card with rarity glow
21. Wire into App.tsx: add "mathdrill" to Screen type, add drill-related screens (drillhome, drill, drillresults, drillunbox, drillcollection, drillstats, drillsettings)

## Phase 4: Re-skin Hub & Settings
22. Re-skin App.tsx GameHub with Star Cadets theme:
    - "STAR CADETS" title with 3-layer text shadow
    - "ACADEMY OF THE OUTER RIM" subtitle
    - Cadet badge with player name (top-left)
    - Star counter (top-right)  
    - Game cards with pixel-panel styling (4px borders, no rounded corners)
    - Arcade-style game icons
    - Copy deck changes per design handoff
    - Add Math Drill as a new game card with "✎" icon
23. Re-skin SettingsPanel with arcade theme (pixel panels, arcade buttons, Press Start 2P headings)
24. Re-skin GameControls (in-game pause/test buttons) with arcade styling
25. Update the Education Overlay with arcade theme

## Phase 5: Polish & Verify
26. Test all existing games still work (runner, asteroids, brick breaker, frogger, pacman, tetris)
27. Test speed drill game end-to-end: equation → draw → recognize → correct/wrong → results → unbox → collection
28. Run `bun run build` to verify clean TypeScript compilation
29. Browser-verify the re-skinned hub, each game launch, and the drill flow

## Key Decisions
- The speed drill game renders as a FULL SCREEN game (like other games), not inside an iPad frame — the iPad frame was for the design prototype only
- Keep all existing game engines and behavior intact — only re-skin the hub, settings, and shared chrome
- Sticker/reward system is self-contained to the drill game (separate localStorage namespace)
- The drill game uses its own internal screen routing (drill → results → unbox → collection) managed by a DrillGame wrapper component
- Font loading via Google Fonts CDN in index.html (like the design spec)
- No shadcn/ui for the arcade-styled components — they need custom pixel-perfect styling that doesn't match the component library's design language
