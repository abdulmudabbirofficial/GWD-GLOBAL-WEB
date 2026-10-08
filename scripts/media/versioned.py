"""Content-hashed file names for published media.

Files under /media are cached by browsers and CDNs for a month, so a re-published
image must get a new name or visitors keep seeing the old one. Every publisher
writes `<stem>.<hash8>.webp` (and `<stem>.<hash8>-sm.webp`) and removes older
versions of the same stem.
"""

import hashlib
import io
import os
import re


def webp_bytes(im, quality):
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=quality, method=6)
    return buf.getvalue()


def write_versioned(folder, stem, big, small=None):
    """Writes big (and small) WebP bytes; returns the big file's name."""
    digest = hashlib.sha1(big).hexdigest()[:8]
    pattern = re.compile(rf'^{re.escape(stem)}(\.[0-9a-f]{{8}})?(-sm)?\.webp$')
    for f in os.listdir(folder):
        if pattern.match(f):
            os.remove(os.path.join(folder, f))
    name = f'{stem}.{digest}.webp'
    with open(os.path.join(folder, name), 'wb') as fh:
        fh.write(big)
    if small is not None:
        with open(os.path.join(folder, f'{stem}.{digest}-sm.webp'), 'wb') as fh:
            fh.write(small)
    return name
