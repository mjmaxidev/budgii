#!/usr/bin/env python3
from PIL import Image
import os

DL = os.path.expanduser("~/Downloads")
OUT = os.path.join(os.path.dirname(__file__), "public/assets/onboarding")
os.makedirs(OUT, exist_ok=True)

SRC = {
    "step1": os.path.join(DL, "1cb05ab9-dbc4-4691-854e-9e202a8ad2c6.png"),
    "step2": os.path.join(DL, "458cd41e-ca2a-476b-b497-6405772c71b8.png"),
    "step3": os.path.join(DL, "0e9a4aab-8023-4f24-bff0-556ea0a4963c.png"),
    "step4": os.path.join(DL, "c81c5004-b21b-4b5a-820b-545405072d89.png"),
}

# (src, name, left, top, right, bottom) as fractions of W/H
CROPS = [
    ("step1", "wordmark",   0.30, 0.100, 0.70, 0.162),
    ("step1", "wallet",     0.27, 0.168, 0.73, 0.315),
    ("step2", "envelope",   0.27, 0.155, 0.73, 0.315),
    ("step3", "about",      0.16, 0.140, 0.84, 0.255),
    ("step3", "individual", 0.175, 0.430, 0.395, 0.560),
    ("step3", "family",     0.615, 0.448, 0.815, 0.575),
    ("step4", "bag",        0.22, 0.125, 0.78, 0.292),
]

for src, name, l, t, r, b in CROPS:
    im = Image.open(SRC[src]).convert("RGBA")
    W, H = im.size
    box = (int(l*W), int(t*H), int(r*W), int(b*H))
    im.crop(box).save(os.path.join(OUT, f"{name}.png"))
    print(f"{name}.png  <- {src}  {box}")

print("done ->", OUT)
