# HBCPPA public website

Finished public information website for Hampshire Bowling Clubs Past Presidents Association. Plain HTML, CSS and a small accessible navigation script. No members zone, database, API, payment processing or backend.

## Hosting

- Repository: https://github.com/robert607-rgb/hbcppa-website
- Live website: https://hbcppa-website.pages.dev
- Cloudflare Pages project: `hbcppa-website`
- Production branch: `main`
- Framework preset: None
- Build command: leave empty
- Output directory: `public`
- Automatic deployment: changes pushed to `main` deploy through the Cloudflare Git integration.

The `public` folder contains the complete site and its documents. Old HugoFox page paths are retained through `_redirects`. Unknown paths use a custom 404 page. `_headers` supplies browser security headers. All assets are local.

## Editing

Edit the relevant `public/<page>/index.html` file, or `public/index.html` for the home page. Shared styles and the navigation script are in `public/assets`. Commit the changes to `main`. No build step is required.

The `source` folder records research and content checks. It is not deployed. The original supplied crest is preserved as `public/assets/crest-1953.jpg`; a smaller WebP copy is used for display. The bowls still life is an illustrative AI-generated image, not a photograph of an association venue or members. It was created with the built-in image generation tool using the prompt recorded in `source/RESEARCH.md`.

## Before switching the association domain

The current `hbcppa.org` domain remains with its existing provider. Connecting this repository to Cloudflare creates the new hosted website; it does not transfer the domain. Domain-owner/registrar access is needed for a cutover. Update canonical URLs, the sitemap, robots.txt and Organization URL to the final domain when it is attached. Retain all existing email records during any DNS migration.

## Content points to confirm

- The user supplied the corrected crest showing 1953 on 1 October 2026. It matches the published association history and anniversary notice.
- Officers and contact details follow the association’s 2026 website.
- Existing membership leaflet advertises £7 per year. The site asks applicants to confirm the current subscription before paying.
- Presidents Day on 9 September 2026 is archived as a past event.
- The fixtures page includes all six indoor friendlies published on the association’s existing fixture page, checked 7 October 2026: three in late 2026 and three in early 2027. Dates, opponents, venues, times, formats, dress codes and the Riverside lunch note are preserved. No results are published yet. The old friendly-fixtures paths redirect to `/fixtures/`.
- No separately verified member honours were available. Match enquiries go to the joint match secretaries.

See `source/VALIDATION.md` for the completed checks.
