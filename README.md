# Alvocor.Astro

The Astro version of the ALVOCOR website, named `Alvocor.Astro` to distinguish it from the original `Alvocor.Web` project. Suggested GitHub repository name: `Alvocor.Astro`; Cloudflare Pages project name: `alvocor-astro`.

Astro site preserving the Razor site's content, design, assets, metadata, and public URLs (`/`, `/Services`, `/Portfolio`, `/About`, `/Contact`, `/Privacy`). The `Alvocor.Web/` directory and solution are retained as legacy reference; they are not used by the Astro build or deployed. Edit `src/pages/`, the shared `src/layouts/Layout.astro`, and `public/` for future changes.

## Local development

Use Node 24.12 or newer (Astro requires at least Node 22.23.4).

```sh
npm ci
npm run dev
npm run build
npm run preview
npm test
```

`preview` serves only static output. To test the contact function locally, copy `.dev.vars.example` to `.dev.vars`, fill in the email settings, and run `npm run pages:dev`.

## Cloudflare Pages

Connect this repository to Cloudflare Pages, select the Astro preset, and use:

- Root directory: repository root (the directory containing this README and package.json)
- Build command: `npm run build`
- Build output directory: `dist`
- Node version: `24.12.0` (also set in `.node-version`)

Alternatively run `npm run deploy` with Wrangler authenticated to your Cloudflare account. The project name in `wrangler.jsonc` must match your Pages project. Deploy from the repository root so Wrangler includes `functions/`. A dashboard drag-and-drop upload of `dist` alone does not include the contact function.

All pages are prerendered; no Astro server adapter or .NET runtime is required. The top-level `404.html` provides a real not-found page. Keep the existing capitalized page URLs to preserve links and search indexing.

## Contact email setup

The old SMTP handler is replaced by `functions/api/contact.js`, a Cloudflare Pages Function using Resend's HTTPS email API. In the Pages project's runtime settings, configure these for production and any preview environment that should send email, then redeploy:

- `RESEND_API_KEY`: secret containing a Resend API key with sending permission
- `CONTACT_FROM`: sender on a domain verified with Resend, e.g. `ALVOCOR Website <website@alvocor.com>`
- `CONTACT_TO`: optional recipient; defaults to `contact@alvocor.com`

The function validates fields and same-origin requests, ignores honeypot submissions, and reports success only after the provider accepts the email. Missing configuration displays an error with a direct email fallback. SMTP credentials from ASP.NET are not reused. The site can be previewed without email credentials; live delivery needs the configuration above. Consider Cloudflare rate limiting or Turnstile if spam becomes a problem.

Documentation: [Cloudflare Pages build settings](https://developers.cloudflare.com/pages/configuration/build-configuration/), [Pages Functions routing](https://developers.cloudflare.com/pages/functions/routing/), [Resend email API](https://resend.com/docs/api-reference/emails/send-email).
