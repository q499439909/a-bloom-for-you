# 开发与验证

本仓库现在是运行代码、测试与素材处理工具的唯一维护入口。无需旧的 `peony-interactive/dist/` 工作区。

## 运行网站

直接用 Python 3 启动静态服务：

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

打开 http://127.0.0.1:8080/ 。线上使用 HTTPS。应用没有后端、数据库或 API Key。

## 自动测试

安装 Node.js 20 或更新版本后，在仓库根目录运行：

```bash
npm test
npm run verify:assets
```

测试只使用 Node 内置模块，不需要 `npm install`、Python 图片库、摄像头、原始图片包或外部网络。
资源校验命令使用 Python 3 标准库，检查 37 个运行资源、字体源文件与测试夹具的 SHA-256、压缩模型还原一致性，以及视频的帧数、尺寸和 faststart 布局。

测试覆盖双手角色、捏合距离、挥动准备与切花、视频缓冲与定位、盛放停留与祝福、模型下载容错与缓存、初始化重试等。历史抠图测试使用 `tests/fixtures/` 中自带的 PNG，解码由测试辅助模块完成。

GitHub Actions 在推送和 Pull Request 时自动运行相同检查。浏览器摄像头、真机性能和公网访问效果仍需单独验证，不能用单元测试代替。

## 重建素材

仅在需要重新编码或更换素材时安装 Python 工具依赖；普通运行和 Node 测试不需要这些依赖：

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-dev.txt
```

从 [独立归档](https://github.com/q499439909/a-bloom-for-you/releases/tag/archive-2026-11-17) 下载 `raw-sequences.tar.gz` 并解压：

```bash
mkdir -p build/originals
tar -xzf /path/to/raw-sequences.tar.gz -C build/originals
python scripts/prepare-assets.py all --input-root build/originals
```

脚本从本仓库的 `docs/materials.json` 读取源目录、每帧 SHA-256、输出尺寸、帧数及编码参数。它会：

1. 校验全部 433 张当前源图片，拒绝遗漏、额外帧或内容变化。
2. 用 FFmpeg 生成三段完整 H.264 视频，并实际解码核对帧数。
3. 生成闭合状态预览图、Bodoni 数字子集及模型 gzip 文件。
4. 将结果写入 `build/generated/` 和 `build-report.json`，默认不覆盖发布素材。

FFmpeg 优先使用 `--ffmpeg /path/to/ffmpeg` 或 PATH 中的可执行文件；都没有时使用固定依赖 `imageio-ffmpeg` 自带的版本。
也可只运行 `videos`、`posters`、`font` 或 `models` 子任务。视频和预览图需要原图；字体和模型处理只需本仓库。

确认画质与体积后，再显式安装生成结果：

```bash
python scripts/prepare-assets.py all --input-root build/originals --install
python scripts/verify-assets.py --update
npm test
npm run verify:assets
```

`--install` 会同步模型压缩字节预算、素材清单中的视频 / 预览图哈希及首屏内嵌预览。重新编码不保证与历史视频逐字节一致；验证标准为源帧一致、帧数与画幅正确、资源预算通过及视觉检查通过。FFmpeg 版本和新产物哈希记录在构建报告中。

## 日常修改

- 页面、模式与花语：`index.html`、`style.css`、`app.js`。
- 花种输入 / 编码参数 / 原图校验值：`docs/materials.json`。
- 素材来源与历史说明：[MATERIALS.md](MATERIALS.md)。
- 模型备用线路与发布：[DEPLOYMENT.md](DEPLOYMENT.md)。
- 原图和历史归档的恢复：[ARCHIVES.md](ARCHIVES.md)。

修改运行文件后，检查变化，再运行 `python3 scripts/verify-assets.py --update` 更新清单；不要用更新清单来掩盖未经确认的文件变化。随后运行测试、检查浏览器并提交。网页资源内容变化时更新相应导入版本参数，分享地址本身不需要版本后缀。

## README 展示素材

界面截图与体验二维码位于 `docs/images/`，不参与网页运行资源下载。截图取自实际线上界面，保留完整布局。
二维码指向正式短链接，可在工具环境中运行 `python scripts/generate-readme-qr.py` 重新生成；改变体验地址时需同步 README 链接及脚本常量，并重新检查二维码能否解码。
