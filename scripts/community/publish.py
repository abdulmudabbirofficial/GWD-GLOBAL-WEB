"""Publish the GWD Community album (the owner's Drive folder) for the site.

  python scripts/community/publish.py <folder with the Drive files, under their Drive names>

Every photo in the Drive folder appears on the site at least once, so this list
must match the folder. Photos the owner supplied directly (outside the Drive)
are copied into the same folder as owner-*.webp. Writes public/media/community/<slug>.<hash>.webp (1800px) and
<slug>.<hash>-sm.webp (720px), and src/content/community-photos.json. Alt text
describes only what is visible; names are given only where the owner named
the person.
"""

import json
import os
import sys

from PIL import Image, ImageOps

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'media'))
from versioned import webp_bytes, write_versioned  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'public', 'media', 'community')
MANIFEST = os.path.join(ROOT, 'src', 'content', 'community-photos.json')

# Drive file, slug, tag, alt, optional crop box (order = best first)
PHOTOS = [
    ('IMG-20261004-WA0157.jpg', 'team-auditorium-above', 'team', 'The GWD team in the VJIT auditorium, seen from above'),
    ('owner-gwd-shirts.webp', 'gwd-shirts', 'team', 'Three members showing the GET WORK DONE on their shirts'),
    ('IMG-20250326-WA0061.jpg', 'community-hall', 'events', 'The whole room together after a community event'),
    ('IMG-20250325-WA0385.jpg', 'club-launch-vjit', 'events', 'The GWD Club launch on stage at VJIT'),
    ('IMG-20261004-WA0151.jpg', 'team-auditorium', 'team', 'The GWD team together in the VJIT auditorium'),
    ('2abeb54fe4c36dea8113c878c95e1aaa.jpg', 'workshop-lab', 'workshops', 'A packed computer lab during a GWD workshop'),
    ('IMG-20250511-WA0110.jpg', 'bizhack-stage', 'events', 'Members on stage at BizHack'),
    ('IMG-20261004-WA0147.jpg', 'courtyard', 'team', 'The GWD team gathered in a courtyard, seen from above'),
    ('IMG-20260911-WA0077.jpg', 'team-turf', 'team', 'The team on the football turf'),
    ('IMG-20250802-WA0112.jpg', 'mudabbir-session', 'workshops', 'Mohammed Abdul Mudabbir leading a session'),
    ('owner-founder-mudabbir.webp', 'founder-mudabbir', 'workshops', 'Mohammed Abdul Mudabbir leading a session'),
    ('owner-founder-rahman.webp', 'founder-rahman', 'workshops', 'Mohd Abdul Rahman Pasha teaching from the lectern'),
    ('IMG-20261004-WA0155.jpg', 'team-stairwell', 'team', 'Members of the GWD team on a stairwell, seen from above'),
    ('IMG-20250326-WA0072.jpg', 'stage-vjit', 'events', 'Guests and members on stage at VJIT'),
    ('2783b8955c4f85b7d2a4af76d2995d8e.jpg', 'speaker-lab', 'workshops', 'A speaker leading a session from the front of the lab'),
    ('IMG-20261004-WA0149.jpg', 'team-steps', 'team', 'Members of the GWD team on the steps outside'),
    ('owner-hsl-auction.webp', 'hsl-auction', 'events', 'Around the table at the HSL auction, the team crests set out'),
    ('owner-rooftop-trio.webp', 'rooftop-trio', 'team', 'Three members on a rooftop at night, the city lit up behind them'),
    ('IMG-20250202-WA0011.jpg', 'podcast', 'events', 'Recording a podcast'),
    ('IMG-20250511-WA0123.jpg', 'bizhack-cheque', 'events', 'Members holding the BizHack cheque'),
    ('IMG-20261004-WA0156.jpg', 'team-red-wall', 'team', 'Four members of the GWD team on the stairs'),
    ('IMG-20260307-WA0068.jpg', 'team-campus', 'team', 'The team outdoors on campus'),
    ('3a515208db50d7309924fab56d3bb446.jpg', 'lab-group', 'workshops', 'A full lab after a workshop'),
    ('IMG_3280.JPG', 'club-stage', 'events', 'Guests on stage at a GWD Club event'),
    ('IMG_9949.JPG', 'team-portico', 'team', 'Members of the team together under a portico on campus'),
    ('IMG-20260325-WA0037.jpg', 'exhibition-team', 'events', 'Members at an exhibition stall'),
    ('defe8e567c94774f099d9367af6096b2.jpg', 'lectern', 'workshops', 'Presenting from the lectern'),
    ('IMG-20250511-WA0053.jpg', 'award-group', 'events', 'Members with an award at a tech event'),
    ('IMG_9929.JPG', 'team-stairs', 'team', 'Members of the team together on the stairs'),
    ('1c3b8eae93c991b6d39dcab1c21038f9.jpg', 'speaker', 'workshops', 'A speaker mid-session'),
    ('d4fab4af79a5d165dcf53fb93d927672.jpg', 'lab-work', 'workshops', 'Students working through an exercise in the lab'),
    ('IMG-20241116-WA0303.jpg', 'industry-booth', 'events', 'Talking with visitors at an industry booth'),
    ('IMG_9960.JPG', 'two-members', 'team', 'Two members on a campus balcony'),
    ('owner-rooftop-duo.webp', 'rooftop-duo', 'team', 'Two members on a rooftop at night, thumbs up'),
    ('IMG-20260130-WA0034.jpg', 'faculty-vjit', 'team', 'Members with faculty at VJIT'),
    ('_MG_8425.JPG', 'outdoor-stall', 'events', 'Students gathered around a laptop at an outdoor stall'),
    ('IMG-20250907-WA0030.jpg', 'tech-stall', 'events', 'Members at the GWD stall with laptops on show', (0, 0, 1600, 726)),
    ('IMG-20250326-WA0068.jpg', 'welcome-stage', 'events', 'Guests being welcomed on stage'),
    ('IMG_9940.JPG', 'team-laughs', 'team', 'Two members sharing a laugh'),
    ('IMG-20251114-WA0010.jpg', 'summit-interview', 'events', 'An interview at an entrepreneurship summit'),
    ('ed6fa1e667a961ad70ee5dadd6af7fb2.jpg', 'lab-session', 'workshops', 'A hands-on session at the computers'),
    ('IMG-20250916-WA0044.jpg', 'book-gift', 'events', 'Presenting a book to a guest'),
    ('IMG20250511130810.jpg', 'event-guest', 'events', 'Members with a guest at an event'),
    ('IMG-20260325-WA0039.jpg', 'exhibition-faculty', 'events', 'Members and faculty at an exhibition stall'),
    ('IMG_20250823_132903.jpg', 'three-members', 'team', 'Three members together at an event'),
    ('15dde1fdcc08b352939587248ea80fe6.jpg', 'lab-front', 'workshops', 'A presenter at the front of the lab'),
    ('IMG-20260911-WA0074.jpg', 'laptop-stall', 'events', 'Students around a laptop at an outdoor stall'),
    ('IMG-20260325-WA0065.jpg', 'exhibition-guests', 'events', 'Guests visiting the stall'),
    ('IMG-20251114-WA0015.jpg', 'event-selfie', 'team', 'Three members, one selfie at an event'),
    ('20251101_134412.jpg', 'ecosystem-event', 'events', 'Two members at an ecosystem partners event'),
    ('IMG-20250202-WA0004.jpg', 'planning', 'team', 'Working through a printed plan together'),
    ('IMG-20251114-WA0007.jpg', 'tech-campus', 'team', 'Three members on a visit to a tech campus'),
    ('IMG_20250823_132828.jpg', 'event-trio', 'events', 'Three members at an evening event'),
    ('ff0aecff9a7e1dd3072cbc252771e552.jpg', 'lab-ready', 'workshops', 'A computer lab set up for a session'),
    ('IMG-20241117-WA0026.jpg', 'collage-avgci', 'events', 'A collage from the AVGCI booth at an exhibition'),
    ('IMG_20260911_201156.jpg', 'collage-turf', 'events', 'A collage: filming at the turf, and a stall outdoors'),
    # October 2026 additions (the six HEIC photos are converted to JPEG under the same name).
    ('IMG20250818113320.jpg', 'gwd-stall-cse', 'events', 'Three members at the GWD stall at a CSE (AI & ML) department event'),
    ('IMG20251103181924.jpg', 'terrace-night-trio', 'team', 'Three members on a terrace at night, the city towers behind them'),
    ('IMG20260307130350.jpg', 'vjit-front-desk', 'events', 'Four people at the Vidya Jyothi Institute of Technology front desk'),
    ('IMG20260830132443.jpg', 'turf-shoot-crew', 'events', 'Filming a football match at the turf'),
    ('IMG20260830133051.jpg', 'turf-shoot-touchline', 'events', 'The camera crew on the touchline'),
    ('IMG20260830133115.jpg', 'turf-shoot-photographer', 'events', 'A photographer kneeling by the pitch during the shoot'),
    ('IMG20260830133820.jpg', 'turf-shoot-lenses', 'events', 'Two photographers at work at the turf'),
    ('IMG20260830134816.jpg', 'turf-shoot-team', 'team', 'Members by the turf after the shoot'),
    ('IMG20260830134823.jpg', 'turf-shoot-group', 'team', 'The team gathered by the turf after the shoot'),
    ('WhatsApp Image 2026-10-05 at 1.04.22 AM.jpeg', 'member-portrait', 'team', 'A member’s portrait, arms folded'),
    ('WhatsApp Image 2026-10-05 at 11.28.33 PM.jpeg', 'campus-group', 'team', 'Community members together on campus'),
    ('WhatsApp Image 2026-10-05 at 11.28.34 PM.jpeg', 'session-selfie', 'workshops', 'A selfie during a session in a classroom'),
    ('WhatsApp Image 2026-10-05 at 11.28.35 PM.jpeg', 'signing-table', 'events', 'Signing papers at a café table'),
    ('WhatsApp Image 2026-10-05 at 11.28.36 PM.jpeg', 'signing-close', 'events', 'Signing the papers, close up'),
    ('WhatsApp Image 2026-10-05 at 11.28.37 PM (1).jpeg', 'gwd-document', 'events', 'Two members holding a GWD document in an office'),
    ('WhatsApp Image 2026-10-05 at 11.28.37 PM.jpeg', 'signed-group', 'events', 'Five members holding signed documents'),
    ('WhatsApp Image 2026-10-05 at 11.28.38 PM (1).jpeg', 'event-backdrop', 'events', 'Three members at an event backdrop'),
    ('WhatsApp Image 2026-10-05 at 11.28.38 PM.jpeg', 'indoor-duo', 'team', 'Two members together indoors'),
]


def main(src):
    os.makedirs(OUT, exist_ok=True)
    have = set(os.listdir(src))
    listed = {p[0] for p in PHOTOS}
    missing = have - listed
    if missing:
        sys.exit(f'Drive photos not placed on the site: {sorted(missing)}')
    # Clear out photos that have left the Drive folder (any version of a stem not listed).
    slugs = {p[1] for p in PHOTOS}
    for f in os.listdir(OUT):
        # Only album photos; other files here (the community reels and their posters) stay.
        if f.endswith('.webp') and f.split('.')[0].removesuffix('-sm') not in slugs:
            os.remove(os.path.join(OUT, f))
    out = []
    for entry in PHOTOS:
        name, slug, tag, alt = entry[:4]
        im = ImageOps.exif_transpose(Image.open(os.path.join(src, name))).convert('RGB')
        if len(entry) > 4:
            im = im.crop(entry[4])
        big = im.copy()
        big.thumbnail((1800, 1800), Image.LANCZOS)
        sm = im.copy()
        sm.thumbnail((720, 720), Image.LANCZOS)
        file = write_versioned(OUT, slug, webp_bytes(big, 82), webp_bytes(sm, 78))
        out.append({'slug': slug, 'file': file, 'w': big.width, 'h': big.height, 'tag': tag, 'alt': alt})
        print(slug, big.size)
    with open(MANIFEST, 'w', encoding='utf-8') as f:
        json.dump({'photos': out}, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print(len(out), 'photos')


if __name__ == '__main__':
    main(sys.argv[1])
