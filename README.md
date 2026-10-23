# Adrian W. Mercer: Website Tiers

Three author websites for a fictional novelist, built as a side-by-side package comparison. Plain HTML, CSS, and JavaScript. No frameworks, no build step.

Live: https://mikemrls.github.io/Tiers/

## How it works

The root page shows three tiles. Each tier opens in a new tab. Inside a tier, every internal link replaces the current history entry instead of adding one (`shared/js/stay.js`), so the tab never builds up back-history and the browser's back button stays disabled.

## Tiers

**Tier 1: single page** (`tier-1/`)
Sticky navbar with smooth-scroll anchors. Hero with cover, title, hook, and buy button; About the Author; Other Books; Reviews; Where to Buy (Amazon, Barnes & Noble, Walmart, eBay, Books-A-Million); Contact. Mobile responsive, basic SEO (title, meta description, Open Graph image, JSON-LD). No animation beyond hover states.

**Tier 2: multi-page** (`tier-2/`)
Everything in Tier 1, split into a landing page with condensed sections and dedicated pages: About (full bio, photo, story, press), Books (grid plus one page per book with synopsis, excerpt, formats, buy links), Reviews (pull quotes and full list), Contact. Adds scroll-reveal animations, cover and button hover effects, page transitions, and an email capture with a free chapter PDF as the lead magnet.

**Tier 3: custom identity** (`tier-3/`)
Everything in Tier 2, designed around the author instead of a template. See the brief below.

## Tier 3 creative brief

| | |
|---|---|
| Concept | "Every place holds two histories": the record and the memory. The site moves between architectural records (blueprints, catalog cards, survey notes) and personal memory (handwritten notes, lamplight). |
| Colors | Archive paper `#ECE4D4`, ink `#1A1814`, oxide stamp red `#B5462E`, blueprint blue `#22385A`, lamplight amber `#F0C46C` |
| Type | Fraunces (variable, from 100 thin italic to 900 black), IBM Plex Mono for catalog labels, Homemade Apple for handwritten margin notes |
| Mood | Library archive, architectural drawings, old letters, city maps |
| Layout | Editorial, numbered sections ("No. 01"), asymmetric grids, mono labels in the margins |

Interactions:

- **Hero lantern:** the cursor (or a finger on touch screens) reveals the memory layer of a street drawing, and the name's letters thicken as the light passes.
- **Scroll story:** a house in section draws itself and letters spill from under the stairs.
- **Cover reveals:** with 3D tilt and glare.
- **Custom cursor.**
- **Vanishing-city map:** a year slider and autoplay show places disappearing from 1950 to 2020.
- **Object picker:** a plumb bob swings with mouse movement.
- **Character cards:** flip to meet the novel's people.
- **Variable-font hover states.**
- **Journal and events:** a blog with an events list.
- **Press kit:** a downloadable PDF.
- **Audiobook sample player:** a synced transcript highlights each word as it is read.

All motion respects `prefers-reduced-motion`.

## Structure

```
index.html            Tier selector
assets/thumbs/        Selector thumbnails
shared/
  fonts/              Self-hosted woff2 (latin subset)
  img/covers/         Book covers (WebP for the sites, JPG for PDFs)
  img/og/             1200x630 social share images, one per tier
  downloads/          Free chapter PDF (lead magnet), press kit PDF
  js/stay.js          No-history navigation
tier-1/               Single page
tier-2/               Multi-page site, assets/style.css + assets/main.js
tier-3/               Custom site, assets/style.css + assets/app.js
```

## Swapping in a real author

- **Email:** search for `adrian@adrianwmercer.com`.
- **Social links:** they point to each platform's home page. Replace them with the author's profile URLs.
- **Retailer links:** they are title searches. Replace them with direct product URLs or affiliate links.
- **Email capture:** add `data-endpoint="https://..."` to `form[data-lead]` (Tier 2) or `form[data-letterbox]` (Tier 3) to post sign-ups to Mailchimp, ConvertKit, Formspree, or similar. Without an endpoint, the form unlocks the download directly.
- **Audiobook sample:** it uses the browser's built-in speech voice. For a studio recording, swap the player to an `<audio>` source.
- **Open Graph URLs:** these are absolute (`https://mikemrls.github.io/Tiers/...`). Update them if the site moves to a custom domain.

## Deploying on GitHub Pages

Settings → Pages → Build and deployment → Source: **Deploy from a branch** → pick the branch and `/ (root)` → Save. On a free plan the repository must be public for Pages to publish.

---

Adrian W. Mercer is a fictional author. All names, books, reviews, and publications are fictional and used for demonstration.
