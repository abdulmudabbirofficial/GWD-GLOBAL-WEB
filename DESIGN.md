# GWD Global — Design System v6 "Page Worlds"

v1 (black), v3 (navy/red), v4 (periwinkle haze) and v5 ("Studio Noir": two
flat studios, one look for every page) were all rejected: too plain, too
standard, the same page repeated. v6 gives **every page its own world**: a
live 3D background that runs behind the whole page and reacts to scroll, its
own type voice, and its own signature motion. Colours stay in one family
(monochrome + GWD red) so the site still reads as one brand. No signature
animation is used on two pages.

## Principles

1. **A world per page.** Each page sits on a full-screen live 3D backdrop
   (`src/3d/backdrops`) driven by page-scroll progress. Content sits above it
   in see-through sections; text that needs it sits on glass.
2. **Literal imagery.** Every diorama shows exactly what the service or
   product is (an AI production line, a security operations room, a car
   inspection bay), never a metaphor (no cages, no padlocks). Same clay,
   graphite and GWD-red palette in every render.
3. **The logo is exact.** Letters `#B40001`, brackets `#781215`, always. Never
   chrome, never white. On dark surfaces it sits on a white plate. Inside
   renders it is composited flat after rendering (`scripts/blender/overlay.py`)
   so lighting never shifts its colour.
4. **One accent.** GWD red `#E63946` for UI: dots, words, lines, lit objects.
5. **Never invent facts.** Drafted copy is listed in the README.

## The worlds

| Page | Backdrop (`src/3d/backdrops`) | Tone | Type voice | Signature motion |
| --- | --- | --- | --- | --- |
| Home | `streams` — trails of light that twist into a vortex as you scroll | dark | Geist light | Odometer stats, hover accordion of services, pinned horizontal process track, 3D client ring driven by scroll velocity, Earth fly-out, pointer-tilt product cards, photo scatter |
| Services | `isogrid` — a field of clay tiles that re-forms (ripple, terraces, skyline) with GWD-red modules | pale | Geist light | Split-character title, sticky showcase (index rail, diorama swaps as you scroll, inactive cards shrink and desaturate) |
| Service detail | `blueprint` — a drafting grid with wireframe parts drifting above it | dark | Geist light | Scrambled-text title, pointer-tilt diorama frame, capability lines that draw in |
| Products | `hall` — a mirror-floored gallery of light columns with floating exhibits | dark | Geist light | Red scan line crossing each product, clip reveal, feature pins popping out of the diorama, float parallax |
| GWD Sports | `stadium` — a floodlit multi-sport complex: football and athletics, cricket, hockey, basketball, badminton, table tennis, tennis and volleyball, each with live play | dark | **Big Shoulders** (stadium signage), uppercase | Title words walk out from alternate touchlines, problem numbers slam in, pillar tabs, the 3D Passport turning through editions, LED scoreboard, drag-to-scroll deployment reel, a screening room where the auction films switch on like old sets, two-way crest marquee |
| Community | `photos` — the community's own album flying past in a warm haze | warm | **Bricolage Grotesque** | Arched photo windows rising and cross-fading, "college club" struck through by hand, story prints that develop as you reach them, outlined pillar titles that fill with ink, the old-club list struck out line by line, printed tickets, a route drawn down the page, filterable album with view transitions and a lightbox, bobbing network logos |
| About | `ascent` — an evening mountain with a red path the camera climbs | dusk | Geist extra-light, tracking in | The studio opening from an arched window, an altimeter beside the milestones, curtain-rise mission and vision, stacking then/now/next cards, spotlight co-founder cards, split-flap Founding Members board, registry certificate with a drawn seal |
| Contact | `ripple` — still dark water | dark | Geist light | Title letters fall like drops; every keystroke ripples the water from the field being typed in; directory links light from where the pointer entered |

## Tokens (src/styles/tokens.css)

| Role | Value |
| --- | --- |
| `--c-dark` | `#09090b` |
| Page tones (`html[data-page-tone]`) | dark `#09090b`, pale `#cbccd0`, warm `#d6d3cf`, dusk `#2a2b31` |
| `--c-red` | `#E63946` |
| Logo | letters `#B40001`, brackets `#781215` |
| Fonts | `--font-sans`/`--font-display` Geist, `--font-mono` Geist Mono, `--font-serif` Newsreader italic, `--font-stadium` Big Shoulders, `--font-warm` Bricolage Grotesque |
| Radius | `--r-sm 10px`, `--r-md 18px`, `--r-lg 28px`, pills full |
| Gutter | `clamp(1.25rem, 4vw, 3.5rem)`; max width 1480px |

## Navigation

Fixed floating pill: the logo on a white plate on the left, six links centred
(active link carries a red dot), one page-specific action on the right
(`pageAction` in `src/lib/site.ts`). Hides on scroll down, returns on scroll
up. The smoked plate appears once the page scrolls, and is always on for pale
and warm pages so the links read.

## Imagery (Blender)

Isometric dioramas rendered in Blender 5.2 Cycles (OptiX + denoiser, AgX
"Medium High Contrast"), transparent film with a shadow catcher. The kit is
`scripts/blender/gwd.py` (materials, people, devices, rooms) and `props.py`;
scenes are `scenes.py` (15 services, 3 products, the GWD office) and
`scenes_extra.py` (the five process steps, sports academy and tournament).
UI on screens comes from `scripts/screens/screens.mjs`.

```
node scripts/screens/screens.mjs                 # UI textures
node scripts/blender/logo.mjs                    # the exact-colour mark (for overlays)
blender -b --factory-startup --python scripts/blender/render.py -- <scene[,scene]> [size] [samples]
python scripts/blender/overlay.py <scene>        # only for scenes that place the mark
python scripts/blender/publish.py <scene[,scene]>
```

Community photos come from the community Drive gallery via
`scripts/community/publish.py` (1800px and 720px WebP plus
`src/content/community-photos.json` with tags and factual alt text).

## Live 3D (one shared WebGL canvas, `src/3d/world`)

Views are anchored to DOM elements and drawn by viewport and scissor, sorted
by `layer` (backdrops are layer -1, with depth cleared per view). Page
backdrops mount through `PageShell` (`src/experience/kit/PageShell.tsx`).
Foreground scenes: `mark` (home hero, exact logo colours), `earth` (country
mask lit red for the ten GWD countries, network arcs drawn one by one with
travelling sparks, labels after the network completes), `passport` (Sports).
Every live scene has a static fallback (no WebGL, reduced motion, save-data);
reduced motion turns scroll animation off and shows content as is.

## Content rules (unchanged)

Never invent GWD facts. Drafted copy is listed in the README. Client-first:
no prices, revenue or internal statistics on public pages.

## Sound

Every world has its own synthesised soundscape (`src/features/sound`): a drone that opens as you scroll on Home, a bell per service on Services, a crowd that swells with scroll speed on Sports, wind that rises up the mountain on About, a drop per keystroke on Contact. Off until the visitor turns it on; it ducks while a film plays.
