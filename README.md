# A Bloom for You · 予你花开

用指尖或微笑，让花为你绽放。

**[在线体验 →](https://q499439909.github.io/a-bloom-for-you/)**

一个将情感表达与实时动作结合的轻量互动祝福网页。用户可以通过微笑或手指开合控制花朵，从含苞到盛放，亲手揭晓对应的祝福。

## 界面与扫码体验

<table>
  <tr><th>桌面界面 · 完全盛放后揭晓祝福</th><th>手机扫码体验</th></tr>
  <tr>
    <td width="72%" align="center"><img src="docs/images/interface-desktop.jpg" width="640" alt="A Bloom for You 桌面界面：牡丹盛放与祝福揭晓"></td>
    <td width="28%" align="center"><a href="https://q499439909.github.io/a-bloom-for-you/"><img src="docs/images/experience-qr.png" width="200" alt="扫描二维码体验 A Bloom for You"></a><br>扫码后用手机浏览器打开</td>
  </tr>
</table>

默认使用微笑控制。允许摄像头后即可互动，也可以先点击「播放花开」观看。

## 可以怎样体验

- **微笑开花**：默认模式。自然表情时花朵闭合，笑容越明显，花朵越盛放。
- **指尖开花**：切换到「指尖」，用拇指与食指的捏合、分开控制花朵开合。
- **挥手换花**：张开手掌，等待镜头内的就绪提示，再左右挥动；也可以点击底部花种或箭头。
- **无需摄像头也能观看**：点击「播放花开」，观看完整过程。
- **盛放时揭晓祝福**：接近完全盛放并保持片刻，画面补齐到最后一帧，呈现柔光与祝愿；盛放约停留两秒后恢复控制。祝福会保留供阅读。

### 指尖模式的双手分工

1. 先单独伸入一只手，这只手负责控制花开，不限定左手或右手。
2. 再伸入另一只手，张掌挥动切花。
3. 两只手都放下、离开画面后，下一次先举起的手重新成为花开手。

微笑模式由表情控制开花，伸入一只手即可挥掌切花。切到新花时会从闭合开始，先放松表情或捏合两指，再开始新一轮互动。

识别不合适时可以点击「校准微笑 / 校准手势」。校准弹窗提供实时镜头预览。右下角的镜头可以收起；收起只是隐藏预览，点击「关闭摄像头」才会停止摄像头。

## 三份花语

| 花朵 | 名称 | 英文名 | 花语 | 序列帧数 |
| --- | --- | --- | --- | --- |
| 牡丹 | 锦绣年华 | Blooming Splendor | 圆满 · 繁盛 | 169 |
| 淡黄玫瑰 | 暖阳予你 | A Little Sunshine | 温暖 · 陪伴 | 169 |
| 花束 | 春日来信 | Letters from Spring | 希望 · 新启 | 95 |

三组共 **433 帧**，以完整帧 H.264 视频交付，并非只用少量关键图片代替。花朵下方的百分比反映当前实际显示帧的位置，不是识别置信度。

## 本仓库包含什么

本仓库现在同时包含**运行代码、完整自动测试、素材处理脚本和维护文档**，是项目独立维护的入口。HTML、CSS、JavaScript、花朵视频、首屏预览、字体、识别模型及 WebAssembly 引擎均已包含，可以克隆后独立运行、测试或重新部署。

原始图片与旧 Git 历史以 [独立归档附件](https://github.com/q499439909/a-bloom-for-you/releases/tag/archive-2026-11-17) 保存于本仓库的 Release，不放进网页分支。包括 7 组 593 张 PNG、3 段高分辨率源视频和 5 份历史仓库 bundle。网页运行与自动测试不需要下载这些大文件；重新生成素材时按 [归档恢复说明](docs/ARCHIVES.md) 下载。完整本机 Git 元数据另有本地备份，旧仓库没有删除。

```text
.
├── index.html                  # 页面结构、首屏静态预览与弹窗
├── style.css                   # 桌面 / 手机布局、字体与光效
├── app.js                      # 页面交互、模式切换、校准与绘制
├── video-sequence.js           # 视频解码、逐帧定位与播放
├── bloom-experience.js         # 盛放、停留、祝福揭晓的状态管理
├── bloom-feedback.js           # 光晕与绽放百分比反馈
├── tracking.js                 # 指尖距离计算与关节点绘制
├── hand-roles.js                # 按入镜顺序分配双手
├── swipe.js                    # 张掌准备与左右挥动识别
├── camera-launch.js            # 摄像头授权启动流程
├── vision-client.js            # 主线程与识别 Worker 通信
├── vision-worker.js            # 手部与面部识别
├── asset-delivery.js           # 模型下载、压缩解码与缓存
├── assets/
│   ├── video/                  # 三组完整花开视频
│   ├── posters/                # 花朵静态预览
│   └── fonts/                  # 数字艺术字体及 OFL 许可
├── models/                     # 手部、面部识别模型与 gzip 版本
├── vendor/                     # MediaPipe 与 WASM 运行文件
├── tests/                      # 自动测试、自带 PNG 夹具与解码辅助模块
├── scripts/                    # 素材重建、校验及归档恢复工具
├── tools/fonts/                # 字体源文件及许可
├── docs/                       # 开发、部署、素材清单与备份说明
└── .github/workflows/tests.yml # GitHub Actions 自动检查
```

`paper-mask.js` 和 `sequence-cache.js` 为保留的旧实现模块；当前展示走视频解码流程。

## 本地运行

无需 Node.js、npm 安装或后端服务。使用 Git 克隆，并通过任意静态 HTTP 服务打开即可。例如，已安装 Python 3 时：

```bash
git clone https://github.com/q499439909/a-bloom-for-you.git
cd a-bloom-for-you
python3 -m http.server 8080 --bind 127.0.0.1
```

然后打开 **[http://127.0.0.1:8080/](http://127.0.0.1:8080/)**。

请通过 `localhost` 或 HTTPS 使用摄像头，不要直接双击 HTML 以 `file://` 打开。手机体验请使用上方的线上 HTTPS 地址，并在浏览器中允许摄像头访问。

## 实现与加载

- 原生 JavaScript、HTML 和 CSS；Canvas 2D 绘制花朵与跟踪标记。
- MediaPipe Hand Landmarker / Face Landmarker 在 Web Worker 中识别手部关节点和面部表情。
- 浏览器解码 MP4，再根据动作定位到对应帧；自动播放跟随实际媒体进度，缓冲时不虚增进度。
- 三段视频分别约 509KB、376KB、490KB，总计约 **1.37MB**，保留 800×600 / 600×800 分辨率及全部帧。
- 首屏内嵌静态预览；优先准备第一朵花的首帧，再后台准备识别，识别就绪后预载其他花种。
- 模型与 WASM 使用 gzip 资源及浏览器缓存；不支持解压接口时回退到随仓库提供的原始文件。

模型下载以本站为主，固定版本的 jsDelivr 备用线路也已迁入本仓库：`a-bloom-for-you@models-v1`。本站和备用线路使用同一份模型，不再依赖旧仓库。模型未变化，因此保留原缓存键，详见 [部署说明](docs/DEPLOYMENT.md)。

## 摄像头与隐私

摄像头需要用户授权。手部、表情及摄像头画面在当前浏览器内处理，不上传、不录制，也不请求麦克风。页面仍会发起下载视频、模型和引擎文件的网络请求，首次访问的等待时间取决于网络与设备。

## 部署与维护

当前托管为 **GitHub Pages**：`main` 分支、仓库根目录 `/`。

自行部署时，把本仓库全部运行文件上传到支持静态文件与 HTTPS 的服务即可。使用 GitHub Pages 时，在仓库的 **Settings → Pages** 选择 `Deploy from a branch`、`main`、`/ (root)`。

以后直接在本仓库修改、测试、提交和部署，不再需要旧开发目录。安装 Node.js 20+ 后运行：

```bash
npm test
npm run verify:assets
```

无需 `npm install`；测试使用 Node 内置模块，资源检查使用 Python 3 标准库。GitHub Actions 会在推送与 Pull Request 时执行同样的检查。

需要从原图重新编码时，按 [开发说明](docs/DEVELOPMENT.md) 安装 `requirements-dev.txt`，运行 `scripts/prepare-assets.py`。脚本覆盖视频、预览图、首屏预览、字体和模型 gzip，并提供输出报告、显式安装与校验流程。源帧文件名、哈希、帧数及编码参数见 [素材清单](docs/materials.json)。

模型资源变更时，需要同时更新压缩文件、下载字节校验和备用线路版本，相关入口为 `asset-delivery.js`。花朵资源配置、文案及帧数位于 `app.js`。

正式分享地址始终使用：**[https://q499439909.github.io/a-bloom-for-you/](https://q499439909.github.io/a-bloom-for-you/)**。无需添加 `?v=…` 或 `#bloom`；页面内部资源自己的版本参数用于缓存更新。

旧版体验地址仍保留：[旧版花园](https://q499439909.github.io/flower-bloom-garden-20261025/)。

字体使用 Bodoni Moda 数字子集，许可见 [BodoniModa-OFL.txt](assets/fonts/BodoniModa-OFL.txt)。

本次独立化迁移的验证记录见 [迁移验收](docs/VALIDATION-2026-11-17.md)。
