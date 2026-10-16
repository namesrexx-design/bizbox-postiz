#!/usr/bin/env python3
"""Rebuild only the ICO derivative from the locked Live SVG master (requires Pillow).
No generation, recoloring, cropping, upscaling or source-master mutation.
"""
import base64
import io
from pathlib import Path
import re
from PIL import Image

root = Path(__file__).resolve().parents[2]
public = root / 'apps/frontend/public'
svg = (public / 'logo.svg').read_text()
embedded = re.search(r'data:image/jpeg;base64,([^"\s]+)', svg)
if not embedded:
    raise SystemExit('Expected locked embedded Live JPEG is absent')
image = Image.open(io.BytesIO(base64.b64decode(embedded.group(1)))).convert('RGBA')
if image.size != (256, 256):
    raise SystemExit('Locked Live master dimensions changed; review before rebuilding')
image.save(public / 'favicon.ico', format='ICO', sizes=[(n, n) for n in (16, 32, 48, 64, 128, 256)])
print('Rebuilt six ICO sizes from the unchanged 256x256 Live master')
