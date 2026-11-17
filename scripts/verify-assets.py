#!/usr/bin/env python3
"""Check the published asset inventory, gzip round trips, media dimensions and frame counts."""
import argparse
import gzip
import hashlib
import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def media_info(data):
    result, top = {}, []
    def boxes(start, end, depth=0):
        at = start
        while at + 8 <= end:
            size, kind = struct.unpack('>I4s', data[at:at+8])
            assert size >= 8 and at + size <= end, 'Invalid MP4 box'
            if depth == 0:
                top.append(kind)
            if kind in [b'moov', b'trak', b'mdia', b'minf', b'stbl']:
                boxes(at+8, at+size, depth+1)
            elif kind == b'stsz':
                result['frames'] = struct.unpack('>I', data[at+16:at+20])[0]
            elif kind == b'stsd':
                # Single H.264 visual sample entry; width/height are in the sample entry header.
                assert data[at+20:at+24] == b'avc1', 'Expected H.264'
                result['width'], result['height'] = struct.unpack('>HH', data[at+48:at+52])
            at += size
        assert at == end, 'Trailing MP4 data'
    boxes(0, len(data))
    assert top.index(b'moov') < top.index(b'mdat'), 'MP4 is not faststart'
    return result


def inventory():
    paths = [ROOT / 'index.html', ROOT / 'style.css', *ROOT.glob('*.js')]
    for directory in ['assets', 'models', 'vendor', 'tools/fonts', 'tests/fixtures']:
        paths.extend(p for p in (ROOT / directory).rglob('*') if p.is_file() and p.name != '.DS_Store')
    return {str(p.relative_to(ROOT)): {'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
            for p in sorted(set(paths))}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--update', action='store_true', help='Record an intentionally changed set of files')
    args = parser.parse_args()
    current = inventory()
    manifest = ROOT / 'docs/assets-sha256.json'
    if args.update:
        manifest.write_text(json.dumps({'files': current}, ensure_ascii=False, indent=2) + '\n')
    expected = json.loads(manifest.read_text())['files']
    assert current.keys() == expected.keys(), 'Asset list changed; inspect before updating the inventory'
    for name in current:
        assert current[name] == expected[name], 'Asset checksum differs: ' + name
        if name.endswith('.gz'):
            assert gzip.decompress((ROOT / name).read_bytes()) == (ROOT / name[:-3]).read_bytes(), name
    materials = json.loads((ROOT / 'docs/materials.json').read_text())
    for flower in materials['flowers']:
        path = ROOT / flower['video']
        info = media_info(path.read_bytes())
        assert info == {'frames': flower['frameCount'], 'width': flower['width'], 'height': flower['height']}, flower['id']
        assert len(flower['sourceFrames']) == flower['frameCount'], flower['id']
        for key in ['video', 'poster']:
            assert current[flower[key]]['sha256'] == flower[key + 'Sha256'], flower[key]
        print('Verified:', flower['id'], info)
    print('Verified', len(current), 'files; gzip round trips, faststart, frame counts and dimensions passed.')


if __name__ == '__main__':
    main()
