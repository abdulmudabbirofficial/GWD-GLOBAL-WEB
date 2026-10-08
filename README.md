# GWD Global — website & content platform

The official website of **GWD Global Pvt. Ltd. — Get Work Done**, its admin
(every word, link, image and list on the site is edited at `/admin`), and the
API behind both. Next.js 16 (App Router) · TypeScript · PostgreSQL (Drizzle) ·
three.js.

## Getting started

```bash
npm install
cp .env.example .env.local        # then fill in ADMIN_EMAIL, ADMIN_PASSWORD, IP_HASH_SALT
npm run db:dev                    # terminal 1 — embedded Postgres (PGlite) on :5433
npm run db:setup                  # migrate + seed (idempotent; safe to re-run)
npm run dev                       # terminal 2 — http://localhost:3000
```

No database? Set `CONTENT_SOURCE=snapshot` and the site runs from the
version-controlled content in `src/content/` (the API's write endpoints need a database).

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js development, production build, production server |
| `npm run start:cluster` | Production server on every CPU core (see Scaling) |
| `npm run check` | Type-check + lint |
| `npm run db:dev` | Local embedded Postgres server (no Docker needed) |
| `npm run db:generate` | Create a migration from schema changes |
| `npm run db:migrate` / `db:seed` / `db:setup` | Apply migrations / seed content / both |
| `npm run tech:icons` | Regenerate `public/tech/*.svg` logos from `src/content/technologies.ts` |

`db:seed` only inserts what is missing, so admin edits survive re-seeding.
`npm run db:seed -- --force` overwrites content with the snapshot; add `--prune`
to delete services, products, organisations and highlights no longer in it.

## The admin (`/admin`)

Sign in with a team account. Sections:

| Section | What it controls |
| --- | --- |
| Overview | The first screen: every button, form link and social icon clicked on the site and every form sent, by page, over today / 7 / 30 / 90 days / a year, plus the latest clicks as they arrive (refreshes every 30 s). Clicks are anonymous counts; the people who sent a form are in Registrations |
| Registrations | Every form sent from the site, by page; status, reply by email or phone |
| Pages | Every headline, paragraph, button label and link on every page, plus each page's Google/WhatsApp preview text, the Instagram/LinkedIn links of each page (Everywhere → Social links), the Community reel captions and films, and the Sports events wording. Saves go live in seconds; Reset restores the original wording |
| Images | Upload a replacement for any studio render (services, products, sports, office); Reset restores it |
| Events | Community and Sports events, each with a registration link (a Google Form or any https:// link) |
| Album | The community photos used across Community and Home |
| Team, Products, Services, Numbers, Highlights, Organisations, Locations, Recognitions, Announcements | The site's content collections |
| Company | Legal name, address, CIN/GSTIN, public email and phone, social links |
| Team accounts | Add people, set roles (super admin, admin, editor, viewer), deactivate, set passwords. Admins can manage every account except super admins; only a super admin can create or change a super admin |
| Your account | Change your own password; sign out |

Super admins and admins reach every section and every page. Editors draft (an admin publishes); viewers read. Every change is validated on
the server (links must be site paths, `?register=` forms or https://; a block
must keep its shape) and written to the audit log.

Page copy lives in a typed registry (`src/content/copy/*.ts`): each key has a
label, a section and its default text; the admin's overrides are stored in
`site_settings` and pages read the merged result through `siteCopy()`. Some
lines use `{tokens}` (e.g. `{countries}`, `{legalName}`) that fill from live
data. To make a new piece of text editable, add a key to the registry and read
it on the page.

**Owner account.** `npx tsx scripts/create-owner.ts <email> "<name>"` creates
a super admin with a generated password and writes it only to
`owner-login.local.txt` (git-ignored). Add `--reset` to issue a new password.
Change it after the first sign-in (Your account), then delete the file.

## Scaling

Every page is prerendered and cached (`s-maxage=300, stale-while-revalidate`),
JavaScript and CSS are immutable, and media is cached for 30 days, so a CDN in
front serves almost all traffic. Measured locally (production build, 1,000
connections all requesting at once for 20 s, on a laptop that was also
rendering): one `next start` process served 148–214 requests/s;
`npm run start:cluster` (12 workers) served 450–578 requests/s with no errors.
1,000 people reading the site produce far fewer requests than that.

- **Vercel (recommended):** zero config; admin saves purge the edge cache
  globally, so edits appear everywhere in seconds.
- **Self-hosted:** run `npm run start:cluster` behind a CDN (e.g. Cloudflare)
  with `TRUST_PROXY=true`. With several workers, an admin save refreshes the
  worker that handled it at once and the others within five minutes.

The 3D scenes adapt to the device: a quality tier picks detail at start-up,
and a frame-rate governor lowers the canvas resolution when a device cannot
hold its frame rate (and raises it again when it can).

## Sound

Off until a visitor turns it on (the header toggle). One quiet ambient score in
four looping layers (pad, felt piano, air, a soft heartbeat) that every page
mixes differently, plus soft interface cues (hover, press, page change, form
sent). It is composed offline by `python scripts/sound/compose.py` (numpy +
ffmpeg) into `public/media/sound/` (Opus with an AAC fallback, content-hashed)
and played by `src/features/sound/soundscape.ts`.

## Renders

The studio dioramas are Blender (Cycles) scenes in `scripts/blender/`
(`scenes.py` services and office, `scenes_products.py` the four products,
`scenes_extra.py` process and sports; props in `props.py` and
`props_city.py`; UI on their screens from `scripts/screens/screens.mjs`).
`scenes_dress.py` is a finishing pass applied to the fifteen service scenes
(wall caps, lit coves, spotlights, a GWD plaque with the service number on each
plinth, and one extra piece of the work per scene); `render.py` applies it.

```bash
blender -b --factory-startup --python scripts/blender/render.py -- prod-dreamx 1600 160
python scripts/blender/overlay.py gwd-office      # scenes with the logo only
python scripts/blender/publish.py prod-dreamx     # → public/media/renders, renders.json
```

Technology logos come from Simple Icons (CC0) and Devicon (MIT). Tools without
a free logo (e.g. OpenAI, Power BI) render as lettered badges. Logos are the
trademarks of their owners and are shown only to name the tools GWD uses.

## Pages

| Route | Page |
| --- | --- |
| `/` | Home (streams of light behind the page): the GWD mark in its exact colours (live 3D) → one team, with projects delivered, countries, services and the founding year on rolling counters → five featured services as a hover accordion → how we work as a pinned horizontal track → clients on a 3D ring → the Earth (out from Hyderabad, the network drawn country by country, then where we work) → products → community photos |
| `/services` | The 15 services (isometric tile field behind): a sticky showcase where each service's diorama, scope and link swap in as you scroll, with an index rail; ways in (request a service, brief a new build, join as a freelancer) |
| `/services/[slug]` | One service (blueprint grid behind): its diorama and name, the promise, what we do, what you get / who it suits / the tools, the next service |
| `/products` | A walk down a mirror-floored hall: GWD Sports (live), NestBridge and Torqio (in development), each launched by a red scan with its features pinned to its diorama |
| `/sports` | GWD Sports across a floodlit multi-sport complex (football, athletics, cricket, hockey, basketball, badminton, table tennis, tennis, volleyball), from its product overview PDF: the live 3D Passport card, the problem, the three pillars as tabs (Academy OS, Tournament OS, Sports Passport), the Passport chapter (four earned editions on scroll), the partner promise as a scoreboard, live deployments (drag to browse), the night it went live (the HSL U16 auction films, played with their own sound), the HSL club crests, who it is for, ways in |
| `/community` | GWD Community (formerly GWD Club; `/club` redirects), built from the community's own photos: arched photo hero, how we built it (five chapters), what members gain, the difference, formats, pathway, the album (filterable, with a lightbox), ways in (member, invite, collaborate, campus), network, events, and who runs it (founder and directors, then the student leads) |
| `/about` | On an evening mountain: the GWD studio opening from a window, the road so far beside an altimeter, mission and vision, then/now/next, the two co-founders and the Founding Members, the registered company |
| `/contact` | On still water that ripples as you type: the enquiry form (`?topic=…` / `?service=<slug>` pre-fill it), then a directory of all ten registration forms |

### Registrations (ways in)

Every registration is a button, not a page. Buttons link to `?register=<key>` on the
current page, which opens a slide-over form (full screen on phones); links are shareable,
Esc / Back / the scrim close it, and `&service=<slug>` preselects a practice.
All ten forms are defined once in `src/features/register/intents.ts` (fields, copy, topic)
and that file drives both the drawer form and server validation. Submissions go to
`POST /api/v1/enquiries` with `intent` + `details`; the row stores both, plus a readable
summary in `message`. The header carries one action that changes with the page (`pageAction` in `src/lib/site.ts`): Get in touch, Request a service, Request this service, Request a demo, Host your academy, Join the community, Write to us.

**Reading them:** `/admin` is the team inbox (not linked from the site, `noindex`, disallowed in
robots.txt). Sign in with a team account; registrations are grouped by page (Services,
GWD Community, GWD Sports, Contact form) with unread counts, and each one shows its answers,
reply-by-email and call links, and New / In progress / Closed / Spam status. Viewers and editors
can read; admins can change status (every change is audit-logged). Nothing notifies the team
yet: the hook for email, Slack or a CRM is marked in `src/server/modules/enquiries/service.ts`.

Legacy paths (`/products-and-services`, `/team`, `/founders`, `/club`) redirect permanently.
Every page has its own metadata, Open Graph image, loading state and error boundary;
unknown URLs return a real 404 inside the site layout.

## Architecture

```
src/
  app/                 routes only — pages, API route handlers, metadata files
  content/             canonical GWD content (source of truth; seeds the DB)
  types/               domain types shared by UI, API and database mappers
  server/              config · db (Drizzle) · http wrapper · modules · security
  experience/          the site's UI (v6): kit/ (PageShell, WaysIn, Events) and one folder per page
  3d/                  world/ (the shared WebGL canvas, PageBackdrop), backdrops/ (one live world per page), scenes/ (mark, earth, passport)
  layouts/             header (with the page action), menu, footer
  components/          primitives: brand mark, media (Render), motion (SplitText, LitText, ScrambleText, TiltFrame), ui, tech logos
  features/            motion (GSAP), smooth scroll, preloader, page curtain, forms, admin
  hooks/ lib/ styles/
```

**Content flow.** Pages are static and revalidate every 5 minutes. They read
through `content` (`server/modules/content/service.ts`), which queries Postgres
behind a circuit breaker: if the database is unreachable, reads fall back to the
bundled snapshot instantly and the outage is logged, so the public site stays up.

**Design system.** See `DESIGN.md` (v6, "Page Worlds"). Every page has its own live 3D
world behind it (`src/3d/backdrops`, mounted by `PageShell`), its own type voice and its own
signature motion, and no signature animation repeats across pages. Colours stay in one family:
monochrome plus GWD red `#E63946`. The logo always uses its exact colours (letters `#B40001`,
brackets `#781215`).

**Imagery.** Service, product, process and office images are isometric dioramas rendered in
Blender 5.2 Cycles from `scripts/blender` (kit `gwd.py` + `props.py`, scenes `scenes.py` +
`scenes_extra.py`), with UI screens from `scripts/screens/screens.mjs`. Render with
`blender -b --factory-startup --python scripts/blender/render.py -- <scene[,scene]> [size] [samples]`,
then `python scripts/blender/overlay.py <scene>` for scenes that carry the GWD mark (it is
composited flat from `scripts/blender/logo.mjs` so its colours stay exact), then
`python scripts/blender/publish.py <scene[,scene]>` to write `public/media/renders/*.webp` and
`src/content/renders.json`. After replacing an image under the same name, clear
`.next/dev/cache/images`. Community photos are published from the community Drive gallery by
`scripts/community/publish.py` (`public/media/community`, `src/content/community-photos.json`).
The Earth's land and country mask are baked from Natural Earth by `python scripts/earth/land.py`.
Club crests (`public/media/crests`) are the clubs' own artwork, squared and rounded.

**Sound.** Each page world has its own synthesised soundscape (`src/features/sound/soundscape.ts`, Web Audio, no files) that reacts to scrolling. It is off until the visitor turns it on with the header toggle, remembers the choice, and ducks while a video plays.

**Motion.** GSAP (ScrollTrigger, SplitText) driven by Lenis, plus CSS and IntersectionObserver
reveals; each page's set is listed in `DESIGN.md`. Reduced motion turns scroll animation off and
shows content as is.

**3D.** One WebGL renderer for the whole site (`src/3d/world`): each view anchors to a DOM element
and is drawn into its rectangle (viewport + scissor), sorted by layer, loaded when it nears the
viewport and disposed when it unmounts. Page backdrops are layer -1 and follow page-scroll
progress. Foreground scenes: `mark`, `earth` (the ten GWD countries lit red, network arcs drawn
in sequence with travelling sparks) and `passport`. Without WebGL each shows a still.

**Ready for a CRM.** Content is already served from Postgres through `content`, with an audited,
role-checked admin API (`/api/v1/admin/*`); the team inbox at `/admin` is the first admin screen.
Images a future CRM should be able to swap (renders, community photos) are listed in manifests
(`src/content/renders.json`, `src/content/community-photos.json`) rather than hard-coded in pages,
so they can move into the database behind an upload screen without touching page code.

## API (`/api/v1`)

Consistent envelopes: `{ data }` or `{ error: { code, message, details, requestId } }`.

**Public** (cached, rate limited): `site`, `services[/slug]`, `products[/slug]`,
`team?group=`, `organizations?kind=`, `ecosystem`, `events?scope=&upcoming=`,
`club`, `sports`, `announcements`, `health`.
`POST track` — one anonymous click on a call to action (page, action key, label, device class; the salted IP hash only counts unique visitors). Sent as a beacon by `src/features/analytics/CtaTracker.tsx`; skipped for bots/headless browsers and when the browser sends Do Not Track or Global Privacy Control; rate limited (120 / min); rows older than ~400 days are pruned.
`POST enquiries` — validated, rate limited (5 / 10 min), honeypot + timing bot checks. Optional `intent` (a key from `intents.ts`) and `details` (that form's fields) are validated against the intent's field list.

**Auth:** `POST auth/login`, `POST auth/logout`, `GET auth/me`. Server-side
sessions in an HttpOnly, SameSite=Strict cookie (`__Host-` prefixed in production);
only a SHA-256 of the token is stored.

**Admin** (role-based):

| Endpoint | Permission |
| --- | --- |
| `GET/POST admin/content/:collection` | `content:read` / `content:write` |
| `PATCH/DELETE admin/content/:collection/:id` | `content:write` / `content:publish` |
| `GET admin/enquiries?status=&group=&page=`, `PATCH admin/enquiries/:id` | `enquiries:read` / `enquiries:write` (list also returns unread counts per form) |
| `GET/POST admin/media` (image upload) | `content:read` / `media:write` |
| `GET/POST admin/users`, `PATCH admin/users/:id` | `users:manage` (super admin and admin; only a super admin may create or change a super admin) |
| `GET admin/insights?days=` | `enquiries:read` (the Overview: clicks by action and page, forms sent, latest clicks) |

Collections: `services, products, team, organizations, stats, locations,
highlights, recognitions, events, announcements, ecosystem-entities`.
Roles: `super_admin`, `admin` (everything except other super admins), `editor` (drafts only — cannot publish), `viewer`.
Every mutation is audited and revalidates the affected pages.

## Security

Strict CSP and security headers (`next.config.ts`), Origin checks on every
state-changing request, Zod validation with unknown fields rejected, scrypt
password hashing with timing-safe comparison, rate limiting, salted IP hashes
(never raw IPs), magic-byte image sniffing (SVG refused), uploads stored outside
`/public` and served with `nosniff` + sandbox CSP, secrets only via environment.

## Deploying

- Use a managed PostgreSQL; set `DATABASE_URL` and `DATABASE_POOL_MAX` (~10).
  `DATABASE_POOL_MAX=1` is only for the single-session embedded dev database.
- Required in production: `IP_HASH_SALT`, `NEXT_PUBLIC_SITE_URL`.
  Set `TRUST_PROXY=true` only behind a trusted proxy/CDN.
- Run `npm run db:migrate` on deploy. Create the first admin with `db:seed`.
- The rate limiter and media storage are in-process/local-disk. For multiple
  instances or serverless, plug in Redis (`setRateLimitStore`) and object storage
  (`MediaStorage` interface).

## Content that needs sign-off

The site uses only facts from the GWD decks (the GWD Global deck is the
current source; GWD Orbit and the photo walls are intentionally left out).
These items were written or left open because the source does not cover them:

- **Practice detail** (`src/content/services.ts`) — the 15 practice names and one-line scopes are the deck's; the short list labels (`shortName`, e.g. "AI & Automation"), headlines, descriptions, capabilities, deliverables, "ideal for" and technology lists are drafted.
- **How we work** (`src/content/process.ts`: Brief, Scope, Build, Launch, Run) — drafted.
- **Page copy (v5/v6)** — headlines and short leads written for the rebuilds (e.g. "Software that gets work done.", "Fifteen services. One team.", "From Hyderabad to ten countries.", "What we build for ourselves.", "Real work, before the degree.", "A community is built one room at a time.", the five "How we built it" chapters on Community, the community pathway lines, the Sports section titles, the mission line on About) are drafted from the deck's wording and the photos; the vision line and the then/now/next statements are the deck's.
- **Projects delivered** — the site says 200+ at the owner's instruction; the GWD Global deck says 230+. Confirm which to keep.
- **Team photos** — co-founder and founding-member portraits (`public/media/team`) and the HSL auction films (`public/media/sports`) were supplied by the owner; the Community story chapters were redrafted from the owner's brief (tech and startup focus, expanding beyond VJIT).
- **Community leadership** — the Community Founder & Director (Mohammed Abdul Mudabbir) and Co-Founders & Directors (Mohd Abdul Rahman Pasha, Mohammed Moin) are as instructed; the president and student leads shown are the earlier list, to be replaced from the owner's screenshots.
- **GWD Sports page** (`src/content/sports.ts`) — every fact is from the GWD Sports product overview PDF; prices, market size and internal engineering numbers from it are deliberately left out. The PDF spells the academy "Sreenidhi Deccan Little Stars"; the site uses "Sreenidi Deccan" (the club's spelling elsewhere in the content) — confirm.
- **Sports Passport** — the name, rating, stats and ID on the 3D card are samples (the ID format is the PDF's example) and the page labels it "Sample card".
- **Registration copy and fields** (`src/features/register/intents.ts`) — every "ways in" title, explanation, audience line, form field, option list and confirmation message is drafted. Who replies, and how fast, should be confirmed before launch.
- **Recognition wording** — the deck says both "Top 600 Startups · Asia" (numbers slide) and "Top 500 Upcoming Startups of Asia and Top 25 Upcoming Startups of India" (timeline). The site uses the numbers-slide wording; confirm which is right.
- **Contact email, phone, social links** — not in the source; the contact form is the channel until they are set via `company_profile`.
- **Portraits** — monogram placeholders until photos are uploaded (`photoUrl` on team members).
- **Events** — none listed; the Community page shows an honest empty state until events are published (add them under Admin → Events, with a registration link).
- **Products (October 2026)** — the NestBridge, Torqio and DreamX descriptions and features were written from the owner's brief; DreamX is marked "Ideation". No brands or partners are named for DreamX. The product app screens in the renders (listings, mechanics, stores, timers) are illustrative.
- **Community** — "What every member gets", the growth path, idea backing and campus expansion follow the general-meeting deck screenshots; 50+ active members at VJIT and the 10+ colleges target are as instructed.
