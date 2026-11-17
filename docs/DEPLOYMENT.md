# 部署与模型备用线路

正式地址：https://q499439909.github.io/a-bloom-for-you/

维护仓库：https://github.com/q499439909/a-bloom-for-you

运行代码直接位于仓库根目录。GitHub Pages 使用 `main` 分支的 `/`，`.nojekyll` 确保按静态文件发布。
原图、完整历史和本地 Git 配置不放进网页分支；测试夹具和处理工具虽随源码保存，但不会被应用下载。

## 自包含资源

HTML、脚本、样式、视频、预览图、字体、识别模型、WASM 均在本仓库。复制这些运行文件到普通 HTTPS 静态服务即可运行。
备用 CDN 只是同一份模型资源的第二条下载线路，不是额外的模型供应方。

当前备用线路：

```text
https://cdn.jsdelivr.net/gh/q499439909/a-bloom-for-you@models-v1/
```

`models-v1` 是本仓库内固定的资源标签。首次迁移时应将包含模型与 gzip 文件的提交和该标签一起推送，确认备用资源可下载后再完成验收。
运行时不再引用旧的 `flower-bloom-garden-20261025` 仓库。

`DELIVERY_VERSION` 继续沿用 `delivery-v1` 缓存键，因为模型字节没有变化；它不是旧仓库地址。迁移不会故意使已有的有效模型缓存失效。

## 模型更新

1. 更新本仓库原始模型 / WASM，运行 `prepare-assets.py models --install` 生成 gzip 并更新字节预算。
2. 更新 `DELIVERY_VERSION`，选择新的固定标签（例如 `models-v2`），修改 `DELIVERY_MIRROR` 与对应测试。
3. 更新 Worker、客户端和页面的导入版本参数，避免浏览器继续使用旧配置。
4. 更新资源校验清单，运行测试和资源检查，再检查浏览器行为。
5. 提交后创建新标签，使用 `git push --atomic origin main models-v2` 一起发布代码与资源标签。
6. 核对 Pages 和 jsDelivr 下载内容的 SHA-256 与本地文件一致。

发布后可运行 `python3 scripts/verify-delivery.py` 检查两条线路；`--mirror-only` 只检查备用线路，在不读取主站的情况下下载并校验全部 4 个压缩资源。

已发布标签不要移动或覆盖；旧标签应保留供缓存中的旧版页面使用。

## 历史与回退

普通修改提交到 `main`。需要撤销时使用 `git revert <提交号>` 形成新的回退提交，再推送，保留可追溯历史。

旧网站与旧仓库仍保留，另有独立归档；维护新站不再需要从旧工作区同步文件。
