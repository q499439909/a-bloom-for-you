# 原始素材与历史备份

独立归档：[archive-2026-11-17](https://github.com/q499439909/a-bloom-for-you/releases/tag/archive-2026-11-17)。

这些附件位于新仓库的 Release 中，不进入网页分支，也不会在用户打开网页时下载。

| 附件 | 内容 |
| --- | --- |
| raw-sequences.tar.gz | 7 组、593 张原始 PNG，包含当前使用的 433 帧与历史 40 帧版本 |
| source-videos.tar.gz | 3 段早期高分辨率源视频 |
| peony-interactive.bundle | 旧开发仓库全部可达分支、标签与提交历史 |
| flower-garden-public.bundle | 旧发布仓库历史，包括原有其他演示 |
| peony-publish.bundle | 更早的发布历史 |
| peony-svg.bundle | 早期 SVG 方案历史 |
| a-bloom-for-you-public.bundle | 新站独立维护前的发布历史快照 |
| ARCHIVE-MANIFEST.json | 每张原图的字节数 / SHA-256、各仓库 HEAD 和提交数 |
| SHA256SUMS | 所有附件的校验值 |
| RESTORE.md | 恢复指引 |

## 恢复原图并重建

下载全部附件时，在同一目录执行 `shasum -a 256 -c SHA256SUMS`；只下载部分附件时，核对对应行即可。
全部附件下载后，也可以执行 `python3 scripts/verify-backup.py --backup <附件目录>`，逐文件校验归档并试恢复 Git 历史。

```bash
mkdir originals
tar -xzf raw-sequences.tar.gz -C originals
```

然后按 [开发说明](DEVELOPMENT.md) 安装工具，运行新仓库中的 `scripts/prepare-assets.py`。它会再次核对当前 433 个源帧的哈希。

## 恢复 Git 历史

```bash
git clone peony-interactive.bundle recovered-peony
git -C recovered-peony log --all --oneline
```

其他 bundle 使用相同方式恢复。bundle 不包含普通未提交工作区文件、reflog 或本机配置；每份历史的提交数和 HEAD 记录在附件清单中。

## 额外的本地完整备份

本次迁移还在独立本地归档中保存了 5 个仓库完整的 `.git` 元数据，包括 reflog、配置及不可达对象；该快照不公开上传。它与原图归档、源视频、bundle 及校验清单一起保管。

本地归档可运行：

```bash
python3 scripts/verify-backup.py --backup /path/to/local-archive
```

这会校验每个归档成员，并把所有 bundle 恢复到临时目录，比较提交数和 HEAD、运行 `git fsck --full`。

`scripts/backup-project.py` 是迁移归档工具：给定原工作区的 `--source-root` 和仓库外部的 `--output` 创建同样结构的备份，不会删除或改写源项目。它针对此次历史目录布局使用，不是网站或日常开发的依赖。

旧仓库和原始目录目前均保留，没有删除。
