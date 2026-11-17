#!/usr/bin/env python3
"""Generate the README's static QR code; no external QR service is used."""
from pathlib import Path
import qrcode

URL = 'https://q499439909.github.io/a-bloom-for-you/'
ROOT = Path(__file__).resolve().parent.parent
target = ROOT / 'docs/images/experience-qr.png'
target.parent.mkdir(parents=True, exist_ok=True)
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=12, border=4)
qr.add_data(URL)
qr.make(fit=True)
qr.make_image(fill_color='black', back_color='white').save(target)
print('QR code:', target, '→', URL)
