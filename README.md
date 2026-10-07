# HBCPPA public website

Public information website for Hampshire Bowling Clubs Past Presidents Association, with a password-protected admin editor for fixtures, results and news. The public frontend is plain HTML, CSS and JavaScript on Cloudflare Pages. An isolated Supabase API stores shared edits and optional news photos. There is no members zone or payment processing.

## Hosting

- Repository: https://github.com/robert607-rgb/hbcppa-website
- Live website: https://hbcppa-website.pages.dev
- Cloudflare Pages project: `hbcppa-website`
- Production branch: `main`
- Framework preset: None
- Build command: leave empty
- Output directory: `public`
- Automatic deployment: changes pushed to `main` deploy through the Cloudflare Git integration.

The `public` folder contains the complete site and its documents. Old HugoFox page paths are retained through `_redirects`. Unknown paths use a custom 404 page. `_headers` supplies browser security headers. The original brand assets are local. Admin-uploaded news photos are served from the HBCPPA news storage bucket.

## Editing

Edit the relevant `public/<page>/index.html` file, or `public/index.html` for the home page. Shared styles and the navigation script are in `public/assets`. Commit the changes to `main`. No build step is required. For fixtures, results and news, use `/admin/`; these changes are saved directly to shared storage and do not require a Git commit or redeployment.

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

## Admin editor and shared content

- Admin page: `/admin/`, linked from the footer and excluded from search indexing.
- Fixtures retain the public table/mobile-card style. Dates determine the calendar day and year automatically. Results appear in the fixture list and the homepage’s latest results.
- News supports titles, optional dates, paragraphs, drafts, publishing, edits, removal, and JPEG/PNG/WebP photos up to 5 MB. Published stories also appear on the homepage.
- Public pages load fresh shared content and retain the original HTML as a clearly labelled fallback if the API cannot be reached.
- The shared password is verified on the server using PBKDF2-SHA256. Neither the password nor server credentials are in the website or repository. Random sessions expire after eight hours and are revoked on sign-out. Sign-in attempts are rate-limited.
- Revision checks reject stale writes rather than overwriting a newer editor’s save. “Reload latest” keeps the open form for review before resaving.
- Supabase project: `ilowfptzxuxfcyubmlhz` (existing free project, restored for this editor). All new records use the `hbcppa_` prefix; existing unrelated data is untouched. The API function is `hbcppa-content`.
- `backend/schema.sql` documents the server-only tables, permissions and login throttle. `backend/seed.json` records the initial six fixtures and two existing stories; it is a seed snapshot, not the live editing source.
- All editor tables have RLS enabled and grants revoked from public, anon and authenticated roles. Only the server’s service credential can access them. The public API returns published news only. News photos use an isolated public bucket with authenticated server-only uploads.
- Backend source is in `backend/hbcppa-content/`; deploy it with custom authentication enabled in the handler and platform `verify_jwt=false`. Default host secrets supply the server URL/key. Do not put server credentials or plaintext admin passwords in `public/` or Git.
- Meaningful server checks: `node --test tests/backend.test.mjs`. The editor and public pages were also checked through a DOM test harness, without launching a browser.
