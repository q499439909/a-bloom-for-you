#!/usr/bin/env python3
"""Verify external archive contents and restore each Git bundle in a temporary directory."""
import argparse
import hashlib
import json
import subprocess
import tarfile
import tempfile
from pathlib import Path


def digest(stream):
    result = hashlib.sha256()
    for block in iter(lambda: stream.read(1024 * 1024), b''):
        result.update(block)
    return result.hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--backup', type=Path, required=True)
    args = parser.parse_args()
    root = args.backup.resolve()
    for line in (root / 'SHA256SUMS').read_text().splitlines():
        expected, name = line.split('  ', 1)
        with (root / name).open('rb') as stream:
            assert digest(stream) == expected, name
    manifest = root / 'inventory.json'
    if not manifest.is_file():
        manifest = root / 'ARCHIVE-MANIFEST.json'
    inventory = json.loads(manifest.read_text())
    for name, entries in inventory['archives'].items():
        expected = {entry['path']: entry for entry in entries}
        seen = set()
        with tarfile.open(root / name, 'r:gz') as tar:
            for member in tar:
                assert member.isfile() and member.name in expected, member.name
                entry = expected[member.name]
                assert member.size == entry['bytes'], member.name
                with tar.extractfile(member) as stream:
                    assert digest(stream) == entry['sha256'], member.name
                seen.add(member.name)
        assert seen == set(expected), name
        print('Verified archive:', name, len(seen), 'files', flush=True)
    with tempfile.TemporaryDirectory(prefix='bloom-restore-') as temp:
        for repo in inventory['repositories']:
            target = Path(temp) / repo['name']
            subprocess.run(['git', 'clone', '--mirror', str(root / repo['bundle']), str(target)],
                           check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            head = subprocess.check_output(['git', '-C', str(target), 'rev-parse', 'HEAD'], text=True).strip()
            count = int(subprocess.check_output(['git', '-C', str(target), 'rev-list', '--all', '--count'], text=True))
            assert head == repo['head'] and count == repo['commits'], repo['name']
            if 'refs' in repo:
                refs = subprocess.check_output(['git', '-C', str(target), 'show-ref'], text=True).splitlines()
                assert set(refs) == set(repo['refs']), 'Restored refs differ: ' + repo['name']
            subprocess.run(['git', '-C', str(target), 'fsck', '--full'], check=True,
                           stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            print('Restored Git history:', repo['name'], count, 'commits', flush=True)
    print('All backup checks passed.')


if __name__ == '__main__':
    main()
