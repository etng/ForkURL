# ForkURL

一个 Chrome 扩展（Manifest V3），在 GitHub / npm / GitLab 等页面上一键跳转到相关工具：Pages、Raw、github.dev、vscode.dev、Gitpod、StackBlitz、CodeSandbox、unpkg、jsDelivr、Bundlephobia、Socket……

不再向页面注入浮动面板。匹配的页面会让工具栏图标出现数字 badge，点击图标弹出可用跳转列表（类似 Google 翻译的体验）。

## 特性

- **工具栏图标徽标**：匹配页面显示可用跳转数量，不再侵入页面 DOM
- **远程规则源**：从 GitHub raw 等公开 URL 同步规则 JSON，每 6 小时自动刷新
- **三层启停**：组 / 规则 / 单链接 任意粒度勾选启用或禁用
- **可视化自定义编辑器**：表单式添加自己的组、规则、链接，无需手写 JSON
- **可视化图标选择器**：内置 30 个图标（Simple Icons + Lucide），点按钮即可挑选 / 搜索 / 自定义 emoji
- **导入 / 导出**：把自己的配置保存成文件，迁移或备份

## 安装

1. clone 本仓库
2. 打开 `chrome://extensions`，开启「开发者模式」
3. 点击「加载已解压的扩展程序」，选择本仓库目录
4. 建议把扩展 pin 到工具栏（点击拼图图标 → 图钉），这样它就在地址栏右边

## 使用默认远程规则源

打开扩展设置页（点击图标 → 设置，或 `chrome://extensions` 找到本扩展点「扩展程序选项」），点「使用官方源」按钮即可填入：

```
https://raw.githubusercontent.com/etng/ForkURL/main/rules.json
```

点「立即更新」拉取最新规则。

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

## License

代码 MIT。打包的图标各自遵循其原始许可（Simple Icons CC0 / Lucide MIT）。
