#!/usr/bin/env python3
"""Flood-fill the cream background of hero crops to transparent, from the
corners only, so cream tones inside the illustration are preserved."""
from PIL import Image, ImageDraw
import os

OUT = os.path.join(os.path.dirname(__file__), "public/assets/onboarding")
SENT = (255, 0, 255)  # sentinel magenta

# heroes that sit on the cream page background; envelope keeps its green circle
TARGETS = ["wordmark", "wallet", "about", "bag", "envelope"]

for name in TARGETS:
    p = os.path.join(OUT, f"{name}.png")
    im = Image.open(p).convert("RGB")
    W, H = im.size
    for corner in [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)]:
        ImageDraw.floodfill(im, corner, SENT, thresh=22)
    rgba = im.convert("RGBA")
    px = rgba.load()
    for y in range(H):
        for x in range(W):
            if px[x, y][:3] == SENT:
                px[x, y] = (0, 0, 0, 0)
    rgba.save(p)
    print(f"transparent bg -> {name}.png")

# preview all on magenta so leftover bg / eaten pixels are obvious
names = ["wordmark", "wallet", "envelope", "about", "bag", "individual", "family"]
ims = [Image.open(os.path.join(OUT, f"{n}.png")).convert("RGBA") for n in names]
pad = 16
cw = max(i.width for i in ims); ch = max(i.height for i in ims)
cols = 4; rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGBA", (cols*(cw+pad)+pad, rows*(ch+pad+22)+pad), (255, 0, 255, 255))
d = ImageDraw.Draw(sheet)
for i, (n, im) in enumerate(zip(names, ims)):
    r, c = divmod(i, cols); x = pad+c*(cw+pad); y = pad+r*(ch+pad+22)
    sheet.paste(im, (x, y), im); d.text((x, y+ch+4), n, fill=(255, 255, 255, 255))
sheet.convert("RGB").save("/tmp/transparent_check.png")
print("preview -> /tmp/transparent_check.png")
