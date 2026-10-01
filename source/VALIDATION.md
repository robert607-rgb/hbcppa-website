# Validation

1 October 2026

- HTML page structure: one H1 per page; descriptive titles, descriptions, canonical URLs, social metadata and organization structured data.
- All local page links and image/style/script references resolve to files.
- Both downloaded Word documents open as valid DOCX archives and contain document XML.
- Supplied crest preserved as the original PNG.
- Home and membership pages inspected visually in the browser.
- All nine public pages inspected at 390px mobile width; no horizontal overflow or broken images.
- Mobile menu opens, closes and supports Escape with correct expanded state and focus return.
- Light/dark semantic styles inspected; button colours checked against computed CSS.
- No members zone, backend, submitted web form, analytics or external asset dependency.
- Original current-site URLs mapped in `_redirects`.
- Presidents Day 9 September 2026 represented as a past event; anniversary matches remain unconfirmed.
- Published rules, real public officers/contact information and original downloads retained.

Real phones, Safari and email/call applications have not been exercised. Search rankings and Core Web Vitals from real visitors are not measured.

## Production verification

- GitHub repository: https://github.com/robert607-rgb/hbcppa-website
- Cloudflare Pages: https://hbcppa-website.pages.dev
- Existing GitHub integration connected successfully. Production branch `main`, framework None, no build command, output `public`.
- Cloudflare confirmed successful deployment. Live HTTP checks returned 200 for all nine public pages, the crest, bowls image and both DOCX documents with their expected content types.
- Legacy officers URL follows a redirect to `/officers/` and returns the new page.
- Display crest optimised to 191 KB WebP, retaining the untouched 2.75 MB PNG in the source assets. Same image and proportions; no redrawing or content changes.
- Association domain `hbcppa.org` has not been cut over. Domain-owner/registrar access is still needed.
