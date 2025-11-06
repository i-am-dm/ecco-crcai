# Ecco Studio UI (Tailwind 3)

A polished, professional Tailwind 3 starter aligned with the JSON-in-GCS platform. Includes a responsive shell, brand color palette, light/dark mode, and example dashboard components.

Quick start
- Open `ui/index.html` in a browser (uses Tailwind Play CDN; no build needed).
- Toggle dark mode with the button in the header.

Design choices
- Palette
  - `brand`: Indigo-based (calm, professional) for primary actions.
  - `accent`: Emerald-based (positive) for highlights and success states.
  - `warn`/`danger`: Amber/Rose for status accents.
  - Neutrals: Slate for readable text and surfaces.
- Typography: Inter (system fallback) for clean UI text.
- Components: Header, KPI cards, table, and activity list.
- Accessibility: High-contrast text on brand backgrounds; focus/hover states via Tailwind defaults.

Customization
- Update palette in the inline `tailwind.config` in `index.html` (alias additional semantic colors as needed).
- Add more pages/components; the nav matches entities from the spec (Ideas, Ventures, Talent, Experiments, Rounds, Cap Tables, Reports).
- For production, migrate off the Play CDN to a PostCSS build with a real `tailwind.config.js` and content paths for purging.

Next steps (optional)
- Create a `apps/web` project with Vite + Tailwind 3 + TypeScript.
- Extract layout and components into a reusable library.
- Add state wiring to lists/indices (e.g., fetch manifests/indices from GCS-backed API).

