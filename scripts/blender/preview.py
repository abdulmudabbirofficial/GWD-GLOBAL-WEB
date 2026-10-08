"""Composite RGBA diorama renders onto a backdrop for review: python scripts/blender/preview.py out.png name[,name] [bg=#cbccd0] [cols]"""
import sys
from PIL import Image
out, names = sys.argv[1], sys.argv[2].split(',')
bg = sys.argv[3] if len(sys.argv) > 3 else '#cbccd0'
cols = int(sys.argv[4]) if len(sys.argv) > 4 else min(4, len(names))
ims = [Image.open(f'scripts/blender/out/{n}.png').convert('RGBA') for n in names]
w, h = 700, 700
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * h), bg)
for i, im in enumerate(ims):
    im.thumbnail((w, h))
    sheet.paste(im, ((i % cols) * w + (w - im.width) // 2, (i // cols) * h + (h - im.height) // 2), im)
sheet.save(out)
