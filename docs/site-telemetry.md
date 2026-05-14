# ForkURL 官网与遥测说明

## 具体改法

- 公开仓库新增 `site/` 静态官网，包含首页、隐私说明、双语 i18n、独立配色和产品弹窗截图。
- `manifest.json` 新增 `homepage_url` 指向 `https://forkurl.0o666.xyz/`。
- 扩展新增 `telemetry.js`，向 `https://forkurl.0o666.xyz/api/telemetry` 发送最小匿名事件。
- 设置页新增“匿名使用统计”开关。默认开启；关闭后会停止发送，并清理本地遥测安装 ID 和发送记录。
- 私有伴生仓库 `ForkURL-docs` 保存 Cloudflare Worker、D1 schema、管理页、部署说明和验证记录。

## 遥测数据边界

客户端只发送：

- `schemaVersion`、`product`
- 事件名：`install`、`update`、`daily_active`、`popup_open`、`jump_open`、`options_open`、`rules_refresh`
- UTC 日期、扩展版本、匿名安装 ID
- 扩展语言、浏览器大类、操作系统大类
- 更新事件的上一版本号

服务端只额外使用 Cloudflare 请求元数据里的国家/地区码。服务端不保存匿名安装 ID 明文，只保存 HMAC 后的不可逆安装哈希。

不会发送或保存：

- 当前页面 URL、域名、路径、query 或 referrer
- 匹配到的规则、生成的跳转目标 URL
- 自定义规则、禁用状态、远程规则地址、导入导出配置
- Iconify 搜索词或图标缓存内容

## 可能受影响的调用面

- `background.js`：安装/更新、启动、定时远程同步、手动远程同步、设置变更监听和 popup 消息处理。
- `popup.js`：打开弹窗和点击跳转入口时增加匿名事件发送。
- `options.js` / `options.html`：设置页初始化、遥测开关、隐私说明入口。
- `rules-engine.js`：扩展状态新增 `telemetryEnabled`，默认值为开启。
- `scripts/build-extension.sh`：发布包包含 `telemetry.js`。
- `site/`：Cloudflare Worker 会把静态官网作为 Workers Assets 托管。

## 验证与结果快照

2026-05-14 已执行：

```sh
node --check telemetry.js
node --check background.js
node --check popup.js
node --check options.js
node --check site/i18n.js
node scripts/validate-site.mjs
node scripts/capture-site-asset.mjs
bash scripts/build-extension.sh
git diff --check
```

结果：

- `site/i18n.js` 语法通过。
- `scripts/validate-site.mjs` 检查 `111` 个 i18n key，`zh` / `en` 都有定义。
- `site/assets/forkurl-popup.png` 已生成，尺寸为 `1120 x 700`。
- 扩展打包成功：`dist/forkurl-v2.0.1.zip`，`60K`，`17` 个文件。
- `git diff --check` 无输出。

本地静态服务验证：

```sh
cd site
python3 -m http.server 4173 --bind 127.0.0.1
curl -sS http://127.0.0.1:4173/ | rg 'data-lang-option|i18n.js|ForkURL|forkurl-popup.png'
curl -sSI http://127.0.0.1:4173/assets/forkurl-popup.png
curl -sS http://127.0.0.1:4173/privacy.html | rg 'data-lang-option|ForkURL 隐私说明|i18n.js'
```

结果：

- 首页 HTML 包含语言切换、`i18n.js` 和产品截图。
- 产品截图资源返回 `200`。
- 隐私页 HTML 包含语言切换、中文 fallback 和 `i18n.js`。

Playwright CLI + 系统 Chrome 验证：

```sh
npx --yes playwright screenshot --channel=chrome --lang=zh-CN --viewport-size=1440,1300 --full-page --wait-for-selector=.workflow-list file:///Users/y10n/Downloads/url-switcher-extension/site/index.html output/playwright/forkurl-home-blue-zh.png
npx --yes playwright screenshot --channel=chrome --lang=zh-CN --viewport-size=390,1100 --full-page --wait-for-selector=.workflow-list file:///Users/y10n/Downloads/url-switcher-extension/site/index.html output/playwright/forkurl-home-blue-mobile.png
npx --yes playwright screenshot --channel=chrome --lang=zh-CN --viewport-size=1440,900 --wait-for-selector=.rules-table-wrap file:///Users/y10n/Downloads/url-switcher-extension/site/index.html#rules output/playwright/forkurl-rules-blue-zh.png
```

结果：

- `zh-CN` 首页默认中文。
- `en-US` 首页默认英文。
- `en-US` 隐私页默认英文。
- 手动切换到英文后，`localStorage.forkurl-site-language = "en"`，刷新后仍保持英文。
- 桌面和 `390 x 844` 移动视口 `overflowX = 0`。
- 补充 `site/assets/favicon.png` 后，Playwright 控制台错误为 `0`。
