#!/usr/bin/env python3
"""Rebuild web assets using this repository plus the separate original-frame archive."""
import argparse
import gzip
import hashlib
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def source_frames(root, flower):
    folder = root / flower['sourceDirectory']
    expected = flower['sourceFrames']
    actual = {path.name for path in folder.glob('*.png')}
    if actual != {item['name'] for item in expected}:
        raise ValueError('Source frame list differs: ' + str(folder))
    files = []
    for item in expected:
        path = folder / item['name']
        if path.stat().st_size != item['bytes'] or sha256(path) != item['sha256']:
            raise ValueError('Source checksum differs: ' + str(path))
        files.append(path)
    return files


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('task', choices=['all', 'videos', 'posters', 'font', 'models'])
    parser.add_argument('--input-root', type=Path, help='Directory containing the three original-frame folders')
    parser.add_argument('--output', type=Path, default=ROOT / 'build/generated')
    parser.add_argument('--ffmpeg', help='Optional FFmpeg binary; otherwise use PATH or imageio-ffmpeg')
    parser.add_argument('--crf', type=int, help='Override the manifest video quality setting')
    parser.add_argument('--install', action='store_true', help='Explicitly replace published assets after successful generation')
    args = parser.parse_args()
    manifest = json.loads((ROOT / 'docs/materials.json').read_text())
    output = args.output.resolve()
    if output == ROOT:
        parser.error('Build into a separate directory; use --install after checking the outputs.')
    output.mkdir(parents=True, exist_ok=True)
    artifacts, report = [], {'task': args.task, 'artifacts': []}
    tasks = {'videos', 'posters', 'font', 'models'} if args.task == 'all' else {args.task}
    frames = {}
    if tasks & {'videos', 'posters'}:
        if not args.input_root:
            parser.error('--input-root is required for videos and posters')
        for flower in manifest['flowers']:
            frames[flower['id']] = source_frames(args.input_root.resolve(), flower)
    if 'videos' in tasks:
        ffmpeg = args.ffmpeg or shutil.which('ffmpeg')
        if not ffmpeg:
            import imageio_ffmpeg
            ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
        report['ffmpegVersion'] = subprocess.check_output([ffmpeg, '-version'], text=True).splitlines()[0]
        config = manifest['encoding']
        for flower in manifest['flowers']:
            target = output / flower['video']
            target.parent.mkdir(parents=True, exist_ok=True)
            with tempfile.TemporaryDirectory(prefix='bloom-frames-') as temp:
                for index, source in enumerate(frames[flower['id']], 1):
                    staged = Path(temp) / ('frame_%05d.png' % index)
                    try:
                        staged.symlink_to(source)
                    except OSError:
                        shutil.copy2(source, staged)
                command = [ffmpeg, '-y', '-v', 'error', '-framerate', str(manifest['fps']),
                    '-start_number', '1', '-i', str(Path(temp) / 'frame_%05d.png'),
                    '-frames:v', str(flower['frameCount']), '-vf', 'scale=%d:%d' % (flower['width'], flower['height']),
                    '-an', '-c:v', config['codec'], '-preset', config['preset'],
                    '-crf', str(args.crf if args.crf is not None else config['crf']),
                    '-pix_fmt', config['pixelFormat'], '-g', str(config['keyframeInterval']),
                    '-keyint_min', str(config['keyframeInterval']), '-sc_threshold', '0',
                    '-movflags', '+faststart', str(target)]
                subprocess.run(command, check=True)
            decoded = subprocess.check_output([ffmpeg, '-v', 'error', '-i', str(target), '-an', '-f', 'framemd5', '-'], text=True)
            count = len([line for line in decoded.splitlines() if line and not line.startswith('#')])
            if count != flower['frameCount']:
                raise ValueError('Decoded frame count differs: ' + flower['id'])
            artifacts.append(flower['video'])
            print('Encoded:', flower['id'], count, 'frames,', target.stat().st_size, 'bytes', flush=True)
    if 'posters' in tasks:
        from PIL import Image
        for flower in manifest['flowers']:
            target = output / flower['poster']
            target.parent.mkdir(parents=True, exist_ok=True)
            with Image.open(frames[flower['id']][0]) as image:
                image = image.convert('RGB')
                image.thumbnail((flower['width'], flower['height']), Image.Resampling.LANCZOS)
                image.save(target, quality=manifest.get('posterQuality', 80), optimize=True)
            artifacts.append(flower['poster'])
    if 'font' in tasks:
        from fontTools.ttLib import TTFont
        from fontTools.varLib.instancer import instantiateVariableFont
        from fontTools import subset
        config = manifest['font']
        source = ROOT / config['source']
        if sha256(source) != config['sourceSha256']:
            raise ValueError('Font source checksum differs')
        font = instantiateVariableFont(TTFont(source), {'opsz': config['opticalSize'], 'wght': config['weight']}, inplace=True)
        options = subset.Options()
        options.layout_features = ['lnum', 'tnum']
        selection = subset.Subsetter(options=options)
        selection.populate(text=config['characters'])
        selection.subset(font)
        target = output / config['output']
        target.parent.mkdir(parents=True, exist_ok=True)
        font.flavor = 'woff'
        font.save(target)
        artifacts.append(config['output'])
    if 'models' in tasks:
        for source in sorted(list((ROOT / 'models').glob('*.task')) + list((ROOT / 'vendor/wasm').glob('*.wasm'))):
            relative = str(source.relative_to(ROOT)) + '.gz'
            target = output / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(gzip.compress(source.read_bytes(), compresslevel=9, mtime=0))
            assert gzip.decompress(target.read_bytes()) == source.read_bytes()
            artifacts.append(relative)
    for relative in artifacts:
        path = output / relative
        report['artifacts'].append({'path': relative, 'bytes': path.stat().st_size, 'sha256': sha256(path)})
    (output / 'build-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    if args.install:
        for relative in artifacts:
            shutil.copy2(output / relative, ROOT / relative)
        if 'models' in tasks:
            sizes = {name: (ROOT / name).stat().st_size for name in artifacts if name.endswith('.gz')}
            source = ROOT / 'asset-delivery.js'
            source.write_text(re.sub(r'export const PACKED_ASSET_BYTES=\{[^}]+\};',
                'export const PACKED_ASSET_BYTES=' + json.dumps(sizes, separators=(',', ':')) + ';', source.read_text()))
        for flower in manifest['flowers']:
            for key in ['video', 'poster']:
                flower[key + 'Sha256'] = sha256(ROOT / flower[key])
        (ROOT / 'docs/materials.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
        if 'posters' in tasks:
            import base64
            poster = base64.b64encode((ROOT / manifest['flowers'][0]['poster']).read_bytes()).decode('ascii')
            html = ROOT / 'index.html'
            html.write_text(re.sub(r'(id="flower-preview"[^>]*src=")data:image/jpeg;base64,[^"]+',
                lambda match: match[1] + 'data:image/jpeg;base64,' + poster, html.read_text()))
        print('Installed assets. Run verify-assets.py --update, npm test, then verify:assets before committing.')
    print('Build report:', output / 'build-report.json')


if __name__ == '__main__':
    main()
