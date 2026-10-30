# Hadon Technology Services — website

Static site, no framework, no dependencies. Requires Node 18+ only to build.

```
node build.js          # builds src/ into dist/
node build.js serve    # builds, then serves dist/ at http://localhost:8080
```

Deploy the `dist/` folder to any static host (Vercel, Netlify, Cloudflare Pages, S3).

## Editing

- `src/pages/` — one file per page. Front-matter comments at the top set the title, meta description and active nav item.
- `src/partials/` — shared blocks (header, footer, pricing tiers, FAQ, comparison table, closing CTA, case-study visuals). Pull one into a page with `<!-- @include name -->`.
- `src/assets/styles.css` — every design token (colours, type, spacing) is at the top.
- `src/assets/main.js` — set `CAL_URL` to your real Cal.com booking link and `INQUIRY_EMAIL` if it changes.

## Before launch

- Replace `CAL_URL` in `src/assets/main.js`.
- The contact form opens the visitor's email app pre-filled (no backend). To collect submissions directly, point the form at Formspree, Basin, or your own endpoint.
- Footer links to Privacy Policy, Terms of Service and Security & IP Protection are placeholders (`#`).
