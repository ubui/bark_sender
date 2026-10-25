# Bark Sender（原 Bark Pusher）

> 一个将网页内容推送到 Bark 的 Chrome 扩展。

> A Chrome extension to push content to iOS via Bark app.

---

## ⚠️ 维护状态

- **原项目 [`Mongkii/Bark-Pusher`](https://github.com/Mongkii/Bark-Pusher) 原作者已停止维护**（原 README 明确说明本人已很少用到 Bark，不再更新）。
- **本仓库（[`ubui/bark_sender`](https://github.com/ubui/bark_sender)）是由 AI 在 2026 年对原项目进行重构的版本。** 原作者 Mongkii 的版权与 MIT 许可保持不变，本仓库在其基础上完成了现代化迁移与优化。

### AI 重构的主要改动

| 改动 | 说明 |
|---|---|
| **迁移到 Manifest V3** | `browser_action` → `action`；`background.scripts + persistent` → `background.service_worker`；`*://*/*` 权限移入 `host_permissions` |
| **修复 MV3 致命问题** | service worker 中不存在 `alert()`，原代码会抛 `ReferenceError`，已改为 `console.error` |
| **推送链路存储优化** | `chrome.storage` 串行读取合并为批量读取，减少关键路径等待 |
| **fetch keepalive** | 防止 popup 关闭导致未完成的推送请求被中止丢失 |
| **popup 发送状态反馈** | 点击后显示「发送中 / 已发送 / 发送失败」，改善体感 |
| **构建 / 发布自动化** | 新增 GitHub Actions，打 `v*` 标签即可自动构建并发布 Release |

> 延迟说明：扩展自身的可控开销已压到极低，推送体感延迟主要取决于 Bark 服务器与 Apple APNs 的网络链路，不在扩展代码之内。

---

## 介绍

Bark 是一款开源的 iOS app，可以推送你自定义的消息到设备上。

- [Bark 下载地址](https://apps.apple.com/cn/app/id1403753865)
- [Bark 的 GitHub 页面](https://github.com/Finb/Bark)

本扩展的功能就是将网页中的信息，通过 Bark 推送到 iOS 端。

**功能：**

- 支持推送网址、选中文本、剪贴板、自定义文本等。
- 支持多设备推送。

---

## 安装

### 在线安装（原项目，可能已不再更新）

- 原项目在 [Chrome 应用商店](https://chromewebstore.google.com/detail/bark-sender/nkafiiklocomjnjdigkojieghpplofcm) 的版本仍为旧版（MV2），且作者已停止维护。

### 本地安装（推荐，本仓库）

1. 到本仓库 [Release 页面](https://github.com/ubui/bark_sender/releases) 下载 `bark_sender-<version>.zip` 并解压。
2. 打开 Chrome 的「扩展程序」页面（`chrome://extensions`），启用**开发者模式**。
3. 点击「加载已解压的扩展程序」，选择解压后的文件夹。
4. 如需 `.crx` 文件，可在开发者模式下点击「打包扩展程序」自行生成。

### 从源码构建

```bash
npm install                       # 国内可先 npm config set registry https://registry.npmmirror.com
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install   # 若安装受阻，跳过 playwright 浏览器下载
npm run build                     # 产物输出到 dist/，zip 在 releases/
```

> 注：CI 已自动化上述流程。打 `vX.Y.Z` 标签并推送即可自动发布 Release：
> ```bash
> git tag v0.02 && git push origin v0.02
> ```

---

## 使用

### 使用前的准备

1. 确认已在 iOS 端的 Bark 上注册了推送 URL。
2. 在扩展的设置页面输入推送 URL，添加设备。

### 右键菜单

- 在链接上右击，可将该链接推送至默认设备。
- 选中文字后右击，将选择的文字推送至默认设备。
- 其他情况下，推送当前页面网址至默认设备。

_\* 默认设备可在扩展的设置页面切换_

### 菜单栏图标

- 点击图标进入推送界面。支持推送当前页面网址、剪贴板内容和自定义文字。
- 有多个设备时，可在界面最上方选择推送目标设备。
- 点击界面最下方的「设置」按钮进入设置界面。

---

## 致谢

- 原项目作者 **Mongkii**，在 MIT 许可下发布。
- 本扩展图标中所使用的 Bark 元素，已得到 Bark 作者授权。
- 项目使用的 iconfont 来自[阿里巴巴矢量图标库](https://www.iconfont.cn)中的「淘票票官方图标库」和「千牛图标库」。
