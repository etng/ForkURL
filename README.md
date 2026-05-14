# ForkURL

一个 Chrome 扩展（Manifest V3），在 GitHub / npm / GitLab / PyPI / crates.io / pkg.go.dev / Docker Hub 等页面上一键跳转到相关工具：Pages、Raw、github.dev、CDN、包元数据、依赖分析、安全评分、在线 IDE……

不再向页面注入浮动面板。匹配的页面会让工具栏图标出现数字 badge，点击图标弹出可用跳转列表（类似 Google 翻译的体验）。

## 特性

- **工具栏图标徽标**：匹配页面显示可用跳转数量，不再侵入页面 DOM
- **远程规则源**：从 GitHub raw 等公开 URL 同步规则 JSON，每 6 小时自动刷新
- **三层启停**：组 / 规则 / 单链接 任意粒度勾选启用或禁用
- **可视化自定义编辑器**：表单式添加自己的组、规则、链接，无需手写 JSON
- **可视化图标选择器**：内置 71 个图标（Simple Icons + Lucide），可选启用 Iconify 在线搜索 200,000+ 图标，选中后自动缓存离线可用
- **导入 / 导出**：把自己的配置保存成文件，迁移或备份

## 默认跳转目标

<!-- DEFAULT_RULES_TABLE_START -->

当前公开默认规则包含 **12** 个规则组、**20** 条页面匹配规则、**74** 个跳转目标。完整快照见 [docs/default-rules.md](docs/default-rules.md)，官网首页 `#rules` 段落也会展示同一张表。

| 规则组 | 匹配页面 | 默认跳转目标 | 数量 |
| --- | --- | --- | ---: |
| GitHub | GitHub 仓库主页 | Pages, github.dev, github1s, vscode.dev, Gitpod, StackBlitz, CodeSandbox, pkg-size, jsDelivr GH, Releases | 10 |
| GitHub | GitHub 文件 (blob) | Raw, github1s, github.dev, RawGitHack, HTMLPreview | 5 |
| GitHub | GitHub Pull Request | github.dev, ReviewNB, Patch, Diff | 4 |
| GitHub | GitHub Commit | Patch, Diff | 2 |
| GitHub | GitHub Release Tag | Tag ZIP, Tag tar.gz | 2 |
| GitHub | GitHub Gist | Raw, Blocks | 2 |
| npm | npm 包页面 | unpkg, jsDelivr, Bundlephobia, Packagephobia, pkg-size, npmgraph, RunKit, Socket, deps.dev, Registry JSON, unpkg meta, jsDelivr CDN, esm.sh, bundlejs, publint, npm trends, Snyk Advisor | 17 |
| GitLab | GitLab 仓库 | Pages, Gitpod | 2 |
| GitLab | GitLab 文件 (blob) | Raw | 1 |
| Bitbucket | Bitbucket 仓库 | Source, Gitpod | 2 |
| Bitbucket | Bitbucket 文件 | Raw | 1 |
| PyPI | PyPI 项目页 | JSON API, deps.dev, Libraries.io, Snyk Advisor, piwheels | 5 |
| Rust crates | crates.io 包页面 | docs.rs, docs.rs JSON, deps.rs, deps.dev, crates API | 5 |
| Go | pkg.go.dev 模块页 | deps.dev, GoDocs, Proxy latest | 3 |
| Maven | Maven Central Artifact | Central, deps.dev | 2 |
| RubyGems | RubyGems 包页面 | deps.dev, Libraries.io, Gemdocs, BestGems | 4 |
| Packagist | Packagist 包页面 | Metadata JSON | 1 |
| VS Code Marketplace | VS Code 扩展 | Open VSX | 1 |
| Docker Hub | Docker 官方镜像 | library repo, OCI Explorer, deps.dev | 3 |
| Docker Hub | Docker 命名空间镜像 | OCI Explorer, deps.dev | 2 |

> 这张表由 `scripts/sync-rule-docs.mjs` 从 `rules.json` 生成。合并规则提交后，CI 会同步更新 README、官网首页规则段落和 `docs/default-rules.md`。

默认规则只是起点。你可以在扩展设置页新增自己的规则组、正则和跳转链接，也可以配置远程规则源同步团队规则；提交到官方源的规则审核合并后会进入这张表。

<!-- DEFAULT_RULES_TABLE_END -->

## 安装

**方式一：下载发布版**（推荐普通用户）

1. 到 [Releases](https://github.com/etng/ForkURL/releases) 下载最新 `forkurl-vX.Y.Z.zip`，解压
2. 打开 `chrome://extensions`，开启「开发者模式」
3. 点「加载已解压的扩展程序」，选择解压后的目录

**方式二：从源码加载**（开发者）

1. clone 本仓库
2. 同样在 `chrome://extensions` 加载已解压的扩展程序，选仓库根目录

建议把扩展 pin 到工具栏（点击拼图图标 → 图钉），这样它就在地址栏右边。

## 使用默认远程规则源

打开扩展设置页（点击图标 → 设置，或 `chrome://extensions` 找到本扩展点「扩展程序选项」），点「使用官方源」按钮即可填入：

```
https://raw.githubusercontent.com/etng/ForkURL/main/rules.json
```

点「立即更新」拉取最新规则。

## 官网与隐私

- 官网：<https://forkurl.0o666.xyz/>
- 隐私说明：<https://forkurl.0o666.xyz/privacy.html>

ForkURL 会在浏览器本地读取当前标签页 URL，用来匹配规则并生成跳转列表。匿名使用统计默认开启，可在设置页关闭；关闭后会清理本地遥测 ID 和发送记录。

匿名统计只包含安装/更新/每日活跃/弹窗打开/跳转点击/设置页打开/规则刷新这类事件，以及扩展版本、语言、浏览器大类和系统大类。不会发送页面 URL、域名、跳转目标、自定义规则、远程规则地址或导入导出的配置内容。

## 规则 JSON Schema

```json
{
  "version": 1,
  "groups": [
    {
      "id": "github",
      "name": "GitHub",
      "rules": [
        {
          "id": "github-repo",
          "name": "GitHub 仓库",
          "patterns": [
            "^https://github\\.com/([^/]+)/([^/]+)/?$"
          ],
          "links": [
            {
              "id": "pages",
              "label": "Pages",
              "icon": "🌐",
              "url": "https://{1}.github.io/{2}",
              "desc": "GitHub Pages 站点"
            }
          ]
        }
      ]
    }
  ]
}
```

- `patterns`：正则数组，命中任一即匹配
- URL 模板里 `{1}`、`{2}` 引用对应的捕获组

## 数据合并优先级

默认内置规则 → 远程规则（按 group.id 覆盖同名组）→ 自定义规则（追加）→ 用户禁用集合作最后过滤。

## 图标值的三种形式

`icon` 字段接受任意字符串，渲染时按优先级匹配：

1. `simple:<slug>` —— [Simple Icons](https://simpleicons.org/)（CC0），如 `simple:github`、`simple:gitpod`
2. `lucide:<slug>` —— [Lucide](https://lucide.dev/)（MIT），如 `lucide:globe`、`lucide:shield`
3. 其他任何文本 —— 当作 emoji 或纯文本字面渲染（`🌐`、`↗`……）

设置页里点链接前面的图标按钮会弹出可视化选择器，带搜索和分类。

## 贡献规则

不用 fork 仓库 / 写代码也能贡献新规则。**最简方式**：

1. 在扩展设置页 → 自定义规则里编好你的规则
2. 点这条规则旁的「🔍 验证」按钮，输入示例 URL 验证生成的目标地址正确无误
3. 点「📤 提交」按钮 —— 自动跳转到 GitHub Issue 表单，所有字段已预填
4. 直接点 Submit 提交即可

**提交后的流程**：

- 机器人自动校验，回复「✅ 校验通过」或具体错误
- 仓库维护者评论 `/approve` 后，GitHub Action 会自动写入 `rules.json`、关闭 Issue
- 全体用户最多 6 小时后自动收到更新

**链接列表格式**（一行一条，`|` 分隔）：

```
显示名 | 图标 | URL 模板 | 说明（可选）
Pages | lucide:globe | https://{1}.github.io/{2} | GitHub Pages 站点
```

校验和合并逻辑见 [`.github/scripts/apply-submission.mjs`](.github/scripts/apply-submission.mjs)。

## 重新构建图标库

如果想给内置图标库加 / 减图标，编辑 [`scripts/build-icon-library.sh`](scripts/build-icon-library.sh) 顶部的 `SIMPLE_ICONS` / `LUCIDE_ICONS` 数组，然后：

```bash
bash scripts/build-icon-library.sh
```

会从上游下载 SVG、规范化（`1em` + `currentColor`）、生成 `icon-library.js`。

## 版本与发布

- 版本号定义在 `manifest.json` 的 `version` 字段，遵循语义化版本（MAJOR.MINOR.PATCH）
  - **MAJOR**：破坏性变更（manifest schema、规则数据结构、设置项不兼容等）
  - **MINOR**：新功能（新规则组、UI 组件、图标库等）
  - **PATCH**：bug 修复、默认规则微调、文案调整等
- `rules.json` 的更新（通过 Issue 审批合并）**不会**自动发版；它通过运行时远程同步推给所有启用了远程源的用户。但每次合并时 CI 会自动同步重新生成 `default-rules.js`、README 默认规则表、官网首页 `#rules` 段落和 `docs/default-rules.md`，让文档快照保持最新

### 发布流程

```bash
# 1. 在 main 上把 manifest.json 的 version 改成 2.1.0
# 2. 提交并打 tag
git commit -am "release 2.1.0"
git tag v2.1.0
git push && git push --tags
# 3. CI 自动校验、打包、创建 GitHub Release 上传 zip
```

工作流定义见 [`.github/workflows/release.yml`](.github/workflows/release.yml)，本地预演：

```bash
bash scripts/build-extension.sh                   # 仅打包，输出到 dist/
bash scripts/build-extension.sh --check-version v2.1.0  # 同时校验 manifest 版本
```

## License

代码 MIT。打包的图标各自遵循其原始许可（Simple Icons CC0 / Lucide MIT）。
