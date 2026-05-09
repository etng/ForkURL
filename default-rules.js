// Default rule set bundled with the extension.
// Schema: { version, groups: [{ id, name, rules: [{ id, name, patterns: [regex], links: [{ id, label, icon, url, desc }] }] }] }
// URL templates use {1}, {2}, ... to reference regex capture groups from the matched pattern.

export const DEFAULT_RULES = {
  version: 1,
  groups: [
    {
      id: 'github',
      name: 'GitHub',
      rules: [
        {
          id: 'github-repo',
          name: 'GitHub 仓库主页',
          patterns: [
            '^https://github\\.com/([^/]+)/([^/]+)/?(?:\\?.*)?$',
            '^https://github\\.com/([^/]+)/([^/]+)/tree/.*'
          ],
          links: [
            { id: 'pages', label: 'Pages', icon: '🌐', url: 'https://{1}.github.io/{2}', desc: 'GitHub Pages 站点' },
            { id: 'github-dev', label: 'github.dev', icon: '💻', url: 'https://github.dev/{1}/{2}', desc: '在浏览器中用 VS Code 编辑' },
            { id: 'github1s', label: 'github1s', icon: '👁', url: 'https://github1s.com/{1}/{2}', desc: '只读 VS Code 查看器' },
            { id: 'vscode-dev', label: 'vscode.dev', icon: '🔵', url: 'https://vscode.dev/github/{1}/{2}', desc: 'vscode.dev 官方在线编辑器' },
            { id: 'gitpod', label: 'Gitpod', icon: '☁️', url: 'https://gitpod.io/#https://github.com/{1}/{2}', desc: '完整云端开发环境' },
            { id: 'stackblitz', label: 'StackBlitz', icon: '⚡', url: 'https://stackblitz.com/github/{1}/{2}', desc: 'StackBlitz 在线运行' },
            { id: 'codesandbox', label: 'CodeSandbox', icon: '📦', url: 'https://codesandbox.io/p/github/{1}/{2}', desc: 'CodeSandbox 在线沙箱' },
            { id: 'pkg-size', label: 'pkg-size', icon: '📊', url: 'https://pkg-size.dev/{1}/{2}', desc: '查看打包后体积' }
          ]
        },
        {
          id: 'github-file',
          name: 'GitHub 文件 (blob)',
          patterns: ['^https://github\\.com/([^/]+)/([^/]+)/blob/(.+)$'],
          links: [
            { id: 'raw', label: 'Raw', icon: '📄', url: 'https://raw.githubusercontent.com/{1}/{2}/{3}', desc: '直接获取文件原始内容' },
            { id: 'github1s', label: 'github1s', icon: '👁', url: 'https://github1s.com/{1}/{2}/blob/{3}', desc: '在 VS Code 中查看此文件' },
            { id: 'github-dev', label: 'github.dev', icon: '💻', url: 'https://github.dev/{1}/{2}/blob/{3}', desc: '在 github.dev 中打开' }
          ]
        },
        {
          id: 'github-pr',
          name: 'GitHub Pull Request',
          patterns: ['^https://github\\.com/([^/]+)/([^/]+)/pull/(\\d+).*'],
          links: [
            { id: 'github-dev', label: 'github.dev', icon: '💻', url: 'https://github.dev/{1}/{2}/pull/{3}', desc: '在 VS Code 中审查这个 PR' },
            { id: 'reviewnb', label: 'ReviewNB', icon: '📓', url: 'https://app.reviewnb.com/{1}/{2}/pull/{3}', desc: 'Jupyter Notebook diff 审查' }
          ]
        },
        {
          id: 'gist',
          name: 'GitHub Gist',
          patterns: ['^https://gist\\.github\\.com/([^/]+)/([a-f0-9]+).*'],
          links: [
            { id: 'raw', label: 'Raw', icon: '📄', url: 'https://gist.githubusercontent.com/{1}/{2}/raw', desc: 'Gist 原始内容' },
            { id: 'blocks', label: 'Blocks', icon: '🧩', url: 'https://bl.ocks.org/{1}/{2}', desc: '用 D3 Blocks 预览' }
          ]
        }
      ]
    },
    {
      id: 'npm',
      name: 'npm',
      rules: [
        {
          id: 'npm-package',
          name: 'npm 包页面',
          patterns: ['^https://www\\.npmjs\\.com/package/(@[^/]+/[^/?#]+|[^/?#]+).*'],
          links: [
            { id: 'unpkg', label: 'unpkg', icon: '🚀', url: 'https://unpkg.com/{1}/', desc: 'unpkg CDN 文件浏览器' },
            { id: 'jsdelivr', label: 'jsDelivr', icon: '📡', url: 'https://www.jsdelivr.com/package/npm/{1}', desc: 'jsDelivr CDN 页面' },
            { id: 'bundlephobia', label: 'Bundlephobia', icon: '⚖️', url: 'https://bundlephobia.com/package/{1}', desc: '查看 bundle 体积和 tree-shaking 情况' },
            { id: 'packagephobia', label: 'Packagephobia', icon: '📦', url: 'https://packagephobia.com/result?p={1}', desc: '查看安装体积 vs 发布体积' },
            { id: 'pkg-size', label: 'pkg-size', icon: '📊', url: 'https://pkg-size.dev/{1}', desc: '更详细的包体积分析' },
            { id: 'npmgraph', label: 'npmgraph', icon: '🕸', url: 'https://npmgraph.js.org/?q={1}', desc: '依赖关系图谱' },
            { id: 'runkit', label: 'RunKit', icon: '▶️', url: 'https://runkit.com/npm/{1}', desc: '在浏览器中直接运行这个包' },
            { id: 'socket', label: 'Socket', icon: '🔐', url: 'https://socket.dev/npm/package/{1}', desc: '安全风险扫描' }
          ]
        }
      ]
    },
    {
      id: 'gitlab',
      name: 'GitLab',
      rules: [
        {
          id: 'gitlab-repo',
          name: 'GitLab 仓库',
          patterns: [
            '^https://gitlab\\.com/([^/]+)/([^/?#]+)/?(?:\\?.*)?$',
            '^https://gitlab\\.com/([^/]+)/([^/]+)/-/tree/.*'
          ],
          links: [
            { id: 'pages', label: 'Pages', icon: '🌐', url: 'https://{1}.gitlab.io/{2}', desc: 'GitLab Pages 站点' },
            { id: 'gitpod', label: 'Gitpod', icon: '☁️', url: 'https://gitpod.io/#https://gitlab.com/{1}/{2}', desc: 'Gitpod 云端开发环境' }
          ]
        }
      ]
    }
  ]
}
