#!/usr/bin/env python3
"""After publishing, compare primary/CDN model downloads with this checkout's exact bytes."""
import argparse
import ast
import hashlib
import re
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parent.parent


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--origin', default='https://q499439909.github.io/a-bloom-for-you/')
    parser.add_argument('--mirror-only', action='store_true', help='Verify that the backup works without the primary site')
    args = parser.parse_args()
    source = (ROOT / 'asset-delivery.js').read_text()
    mirror = re.search(r"DELIVERY_MIRROR='([^']+)'", source).group(1)
    resources = ast.literal_eval(re.search(r'PACKED_ASSET_BYTES=(\{[^}]+\})', source).group(1))
    routes = [('mirror', mirror)] if args.mirror_only else [('primary', args.origin), ('mirror', mirror)]
    def verify(job):
        label, base, name, expected = job
        local = (ROOT / name).read_bytes()
        assert len(local) == expected, name
        last_error = None
        for attempt in range(3):
            try:
                request = urllib.request.Request(urljoin(base, name), headers={'User-Agent': 'BloomDeliveryCheck/1.0'})
                with urllib.request.urlopen(request, timeout=45) as response:
                    remote = response.read(expected + 1)
                assert len(remote) == expected, 'Remote size differs: ' + name
                assert hashlib.sha256(remote).digest() == hashlib.sha256(local).digest(), 'Remote hash differs: ' + name
                return label + ': ' + name + ' — SHA-256 matched'
            except Exception as error:
                last_error = error
                if attempt < 2:
                    time.sleep(2 * (attempt + 1))
        raise RuntimeError(label + ' download failed: ' + name) from last_error
    jobs = [(label, base, name, size) for label, base in routes for name, size in resources.items()]
    with ThreadPoolExecutor(max_workers=4) as pool:
        for result in pool.map(verify, jobs):
            print(result, flush=True)
    print('All', len(jobs), 'published downloads match the local model resources.')


if __name__ == '__main__':
    main()
