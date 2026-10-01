# Validation

1 October 2026

- HTML page structure: one H1 per page; descriptive titles, descriptions, canonical URLs, social metadata and organization structured data.
- All local page links and image/style/script references resolve to files.
- Both downloaded Word documents open as valid DOCX archives and contain document XML.
- Corrected 1953 crest preserved as the supplied original JPEG.
- Home and membership pages inspected visually in the browser.
- All nine public pages inspected at 390px mobile width; no horizontal overflow or broken images.
- Mobile menu opens, closes and supports Escape with correct expanded state and focus return.
- Revised badge palette checked on desktop and all nine mobile pages: navy throughout, burgundy panels and gold typography/details.
- Main text and control contrast ratios exceed WCAG AA: gold headings 11.41:1, body 13.09:1, muted copy 9.42:1, buttons 9.91:1, burgundy panel body 9.68:1, burgundy panel headings 9.50:1.
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
- The replacement 1953 crest uses a smaller WebP display copy and retains the supplied JPEG unchanged. Header, homepage, favicon, sharing metadata and organization logo reference the replacement. Versioned filenames avoid cached copies of the previous crest.
- Association domain `hbcppa.org` has not been cut over. Domain-owner/registrar access is still needed.
- Custom unknown route returned 404 with the designed error page. Security response headers verified. Both live downloads match the downloaded originals byte for byte.
