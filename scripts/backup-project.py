#!/usr/bin/env python3
"""Create an external, checksummed archive without changing the source projects."""
import argparse
import hashlib
import json
import subprocess
import tarfile
from datetime import datetime, timezone
from pathlib import Path

SEQUENCES = ['视频 1_全部帧', '淡黄色玫瑰_4019_全部帧', '花束绽放_4394_全部帧',
             '牡丹', '淡黄玫瑰_40帧_原始黑底', '视频 1_均匀抽帧40张', '视频1_40帧_透明PNG_去黑边']
REPOSITORIES = ['peony-interactive', 'flower-garden-public', 'peony-publish', 'peony-svg', 'a-bloom-for-you-public']


def sha256(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def git(repo, *args):
    return subprocess.check_output(['git', '-C', str(repo), *args], text=True).strip()


def archive(output, entries):
    inventory = []
    with tarfile.open(output, 'w:gz', compresslevel=1) as tar:
        for source, name in entries:
            tar.add(source, arcname=name, recursive=False)
            inventory.append({'path': name, 'bytes': source.stat().st_size, 'sha256': sha256(source)})
    return inventory


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-root', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    root, output = args.source_root.resolve(), args.output.resolve()
    project = Path(__file__).resolve().parent.parent
    if output == project or project in output.parents:
        parser.error('Backups must be outside this Git repository.')
    output.mkdir(parents=True, exist_ok=False)
    inventory = {'createdAt': datetime.now(timezone.utc).isoformat(), 'archives': {}, 'repositories': []}
    entries = []
    for directory in SEQUENCES:
        folder = root / directory
        if not folder.is_dir():
            raise FileNotFoundError(folder)
        entries.extend((p, directory + '/' + str(p.relative_to(folder)))
                       for p in sorted(folder.rglob('*')) if p.is_file() and p.name != '.DS_Store')
    print('Archiving original image sequences…', flush=True)
    inventory['archives']['raw-sequences.tar.gz'] = archive(output / 'raw-sequences.tar.gz', entries)
    entries = []
    for name in ['peony', 'rose', 'spring-letter']:
        source = root / 'peony-interactive/dist/assets/video' / (name + '.mp4')
        if not source.is_file():
            raise FileNotFoundError(source)
        entries.append((source, name + '.mp4'))
    inventory['archives']['source-videos.tar.gz'] = archive(output / 'source-videos.tar.gz', entries)
    (output / 'git').mkdir()
    git_entries = []
    for name in REPOSITORIES:
        repo = root / name
        if not (repo / '.git').is_dir():
            raise FileNotFoundError(repo / '.git')
        print('Bundling Git history:', name, flush=True)
        bundle = output / 'git' / (name + '.bundle')
        subprocess.run(['git', '-C', str(repo), 'bundle', 'create', str(bundle), '--all'], check=True)
        subprocess.run(['git', '-C', str(repo), 'bundle', 'verify', str(bundle)], check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        inventory['repositories'].append({'name': name, 'head': git(repo, 'rev-parse', 'HEAD'),
            'commits': int(git(repo, 'rev-list', '--all', '--count')),
            'refs': git(repo, 'show-ref').splitlines(), 'status': git(repo, 'status', '--porcelain'),
            'bundle': 'git/' + name + '.bundle'})
        # Keep reflogs, config and unreachable objects too; bundles alone only include reachable history.
        for path in sorted((repo / '.git').rglob('*')):
            if path.is_file() and not path.name.endswith('.lock'):
                git_entries.append((path, name + '/.git/' + str(path.relative_to(repo / '.git'))))
    print('Archiving complete Git metadata…', flush=True)
    inventory['archives']['git-metadata.tar.gz'] = archive(output / 'git-metadata.tar.gz', git_entries)
    (output / 'inventory.json').write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + '\n')
    (output / 'RESTORE.md').write_text('''# 恢复备份

先运行新仓库的 `python3 scripts/verify-backup.py --backup <此目录>` 校验全部文件。

在新的空目录解压 `raw-sequences.tar.gz`，再用新仓库的素材构建脚本读取这些目录。
`source-videos.tar.gz` 保存三段早期高分辨率视频，不是网站运行依赖。

可用 `git clone git/<仓库名>.bundle <新目录>` 恢复可达的分支和标签历史。
需要 reflog、配置或不可达对象时，在独立目录解压 `git-metadata.tar.gz`，
进入对应仓库后运行 `git reset --hard HEAD` 恢复工作树。只在新建的恢复目录执行。

归档不会收录未提交的普通工作区文件；其状态记录在 inventory.json。
Git 元数据可能包含本机配置，本归档仅供本地保管，不要上传到公开仓库。
''')
    files = sorted(p for p in output.rglob('*') if p.is_file())
    (output / 'SHA256SUMS').write_text(''.join(sha256(p) + '  ' + str(p.relative_to(output)) + '\n' for p in files))
    print('Backup complete:', output, flush=True)


if __name__ == '__main__':
    main()
