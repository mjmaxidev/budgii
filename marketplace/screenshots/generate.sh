#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
RAW="$ROOT/raw"
OUT="$ROOT/app-store"
FRAME="$ROOT/iphone-frame.png"
FONT="/System/Library/Fonts/Supplemental/Arial Bold.ttf"
REGULAR="/System/Library/Fonts/Supplemental/Arial.ttf"

mkdir -p "$OUT"

render() {
  source=$1
  output=$2
  headline=$3
  subtitle=$4
  shot=$(mktemp /tmp/budgii-shot.XXXXXX.png)
  mask=$(mktemp /tmp/budgii-mask.XXXXXX.png)
  frame=$(mktemp /tmp/budgii-frame.XXXXXX.png)
  phone=$(mktemp /tmp/budgii-phone.XXXXXX.png)

  magick "$source" -resize '1020x2216^' -gravity center -extent 1020x2216 "$shot"
  magick -size 1020x2216 xc:none -fill white -draw 'roundrectangle 0,0 1019,2215 125,125' "$mask"
  magick "$shot" "$mask" -alpha off -compose CopyOpacity -composite "$shot"
  magick "$FRAME" -trim +repage -resize 1110x2308! "$frame"
  magick -size 1110x2308 xc:none "$shot" -geometry +45+46 -composite "$frame" -composite "$phone"

  magick -size 1320x2868 gradient:'#FFF8F0-#FFE5CC' \
    -fill '#FF6A00' -draw 'circle 1190,150 1250,150' \
    -fill '#16A34A' -draw 'circle 1100,205 1120,205' \
    -font "$FONT" -fill '#111827' -pointsize 86 -gravity north-west \
    -annotate +100+92 "$headline" \
    -font "$REGULAR" -fill '#6B7280' -pointsize 38 \
    -annotate +104+312 "$subtitle" \
    \( "$phone" -background '#6B3A1A55' -shadow 55x18+0+20 \) -geometry +105+496 -composite \
    "$phone" -geometry +105+476 -composite \
    "$OUT/$output"
  magick "$OUT/$output" -resize 1284x2778! -strip "$OUT/$output"

  rm -f "$shot" "$mask" "$frame" "$phone"
}

render "$RAW/01-welcome.png" \
  "01-welcome.png" "Take control of\nyour money" "Smart budgets. Better futures."
render "$RAW/02-overview.png" \
  "02-overview.png" "Your whole budget\nat a glance" "See spending, progress and what remains."
render "$RAW/03-transactions.png" \
  "03-transactions.png" "Every transaction,\nclearly organised" "Search, scan and understand every purchase."
render "$RAW/04-reports.png" \
  "04-reports.png" "Plan smarter.\nSpend confidently." "Turn everyday spending into a better plan."
