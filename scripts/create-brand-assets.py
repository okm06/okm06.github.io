"""Recreate the portfolio favicon and 1200×630 sharing card with Pillow.
Uses local system fonts; no network or runtime build step is required.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SCALE = 2
BG, INK, MUTED, ACCENT, BORDER = '#faf9f6', '#242622', '#62665f', '#303b32', '#deddd8'
FONT_DIR = Path('/System/Library/Fonts')

def font(size, bold=False, korean=False):
    path = FONT_DIR / ('AppleSDGothicNeo.ttc' if korean else f'Supplemental/Arial{" Bold" if bold else ""}.ttf')
    return ImageFont.truetype(str(path), size * SCALE)

def icon(size):
    im = Image.new('RGBA', (256, 256))
    draw = ImageDraw.Draw(im)
    draw.rounded_rectangle((0, 0, 255, 255), radius=60, fill=ACCENT)
    draw.ellipse((48, 76, 112, 180), outline=BG, width=20)
    draw.line((152, 76, 152, 180), fill=BG, width=20)
    draw.line((156, 128, 208, 76), fill=BG, width=20)
    draw.line((156, 128, 208, 180), fill=BG, width=20)
    return im.resize((size, size), Image.Resampling.LANCZOS)

icon(256).save(ROOT / 'favicon.ico', sizes=[(16,16), (32,32), (48,48), (64,64)])
icon(180).save(ROOT / 'images/apple-touch-icon.png')
canvas = Image.new('RGB', (1200*SCALE, 630*SCALE), BG)
draw = ImageDraw.Draw(canvas)

def text(x, y, value, size, color=INK, bold=False, korean=False):
    draw.text((x*SCALE, y*SCALE), value, font=font(size,bold,korean), fill=color)

brand = icon(52*SCALE)
canvas.paste(brand, (64*SCALE, 55*SCALE), brand)
text(134, 73, 'OKM / PORTFOLIO', 17, MUTED, bold=True)
text(62, 158, 'Frontend', 88, bold=True)
text(62, 252, 'Developer', 88, bold=True)
text(66, 378, '오경민', 36, korean=True)
text(66, 441, '화면과 인터랙션을 구현합니다.', 25, MUTED, korean=True)

for y, filename, name in [(125, 'jworld.webp', 'J-WORLD / SCROLL INTERACTION'), (342, 'teemo.webp', 'TEEMO GOLF / WEB PUBLISHING')]:
    x, width, height = 790, 346, 194
    rect = (x*SCALE, y*SCALE, (x+width)*SCALE, (y+height)*SCALE)
    draw.rounded_rectangle(rect, radius=12*SCALE, fill='#ffffff', outline=BORDER, width=SCALE)
    image = Image.open(ROOT / 'images' / filename).convert('RGB')
    image = ImageOps.fit(image, ((width-2)*SCALE, 150*SCALE), Image.Resampling.LANCZOS)
    mask = Image.new('L', image.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0,0,image.width,image.height+24), radius=11*SCALE, fill=255)
    canvas.paste(image, ((x+1)*SCALE, (y+1)*SCALE), mask)
    text(x+16, y+164, name, 11, MUTED, bold=True)

draw.line((64*SCALE, 566*SCALE, 1136*SCALE, 566*SCALE), fill=BORDER, width=SCALE)
text(66, 586, 'HTML · CSS · JavaScript · GSAP', 16, MUTED)
text(974, 586, 'okm06.github.io', 16, MUTED)
canvas.resize((1200,630), Image.Resampling.LANCZOS).save(ROOT / 'images/og-image.png', optimize=True)
print('Generated favicon.ico, apple-touch-icon.png, and og-image.png')
