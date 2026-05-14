// Auto-generated from rules.json by scripts/sync-default-rules.mjs.
// Do not edit by hand — edit rules.json or submit a regular issue, then run:
//   node scripts/sync-default-rules.mjs

// Schema: { version, groups: [{ id, name, rules: [{ id, name, patterns: [regex], links: [{ id, label, icon, url, desc }] }] }] }
// URL templates use {1}, {2}, ... to reference regex capture groups.
// Icons can be: a library ref like "simple:github" / "lucide:globe", an emoji, or any text fallback.

export const DEFAULT_RULES = {
  "version": 1,
  "groups": [
    {
      "id": "github",
      "name": "GitHub",
      "rules": [
        {
          "id": "github-repo",
          "name": "GitHub 仓库主页",
          "patterns": [
            "^https://github\\.com/([^/]+)/([^/]+)/?(?:\\?.*)?$",
            "^https://github\\.com/([^/]+)/([^/]+)/tree/.*"
          ],
          "links": [
            {
              "id": "pages",
              "label": "Pages",
              "icon": "lucide:globe",
              "url": "https://{1}.github.io/{2}",
              "desc": "GitHub Pages 站点"
            },
            {
              "id": "github-dev",
              "label": "github.dev",
              "icon": "simple:github",
              "url": "https://github.dev/{1}/{2}",
              "desc": "在浏览器中用 VS Code 编辑"
            },
            {
              "id": "github1s",
              "label": "github1s",
              "icon": "lucide:eye",
              "url": "https://github1s.com/{1}/{2}",
              "desc": "只读 VS Code 查看器"
            },
            {
              "id": "vscode-dev",
              "label": "vscode.dev",
              "icon": "lucide:code",
              "url": "https://vscode.dev/github/{1}/{2}",
              "desc": "vscode.dev 官方在线编辑器"
            },
            {
              "id": "gitpod",
              "label": "Gitpod",
              "icon": "simple:gitpod",
              "url": "https://gitpod.io/#https://github.com/{1}/{2}",
              "desc": "完整云端开发环境"
            },
            {
              "id": "stackblitz",
              "label": "StackBlitz",
              "icon": "simple:stackblitz",
              "url": "https://stackblitz.com/github/{1}/{2}",
              "desc": "StackBlitz 在线运行"
            },
            {
              "id": "codesandbox",
              "label": "CodeSandbox",
              "icon": "simple:codesandbox",
              "url": "https://codesandbox.io/p/github/{1}/{2}",
              "desc": "CodeSandbox 在线沙箱"
            },
            {
              "id": "pkg-size",
              "label": "pkg-size",
              "icon": "lucide:scale",
              "url": "https://pkg-size.dev/{1}/{2}",
              "desc": "查看打包后体积"
            },
            {
              "id": "jsdelivr-gh",
              "label": "jsDelivr GH",
              "icon": "simple:jsdelivr",
              "url": "https://www.jsdelivr.com/package/gh/{1}/{2}",
              "desc": "GitHub 仓库的 jsDelivr CDN 页面"
            },
            {
              "id": "releases",
              "label": "Releases",
              "icon": "lucide:download",
              "url": "https://github.com/{1}/{2}/releases",
              "desc": "查看项目发布版本"
            }
          ]
        },
        {
          "id": "github-file",
          "name": "GitHub 文件 (blob)",
          "patterns": [
            "^https://github\\.com/([^/]+)/([^/]+)/blob/([^?#]+)(?:[?#].*)?$"
          ],
          "links": [
            {
              "id": "raw",
              "label": "Raw",
              "icon": "lucide:file-text",
              "url": "https://raw.githubusercontent.com/{1}/{2}/{3}",
              "desc": "直接获取文件原始内容"
            },
            {
              "id": "github1s",
              "label": "github1s",
              "icon": "lucide:eye",
              "url": "https://github1s.com/{1}/{2}/blob/{3}",
              "desc": "在 VS Code 中查看此文件"
            },
            {
              "id": "github-dev",
              "label": "github.dev",
              "icon": "simple:github",
              "url": "https://github.dev/{1}/{2}/blob/{3}",
              "desc": "在 github.dev 中打开"
            },
            {
              "id": "raw-githack",
              "label": "RawGitHack",
              "icon": "lucide:globe",
              "url": "https://raw.githack.com/{1}/{2}/{3}",
              "desc": "预览仓库里的 HTML/CSS/JS 文件"
            },
            {
              "id": "htmlpreview",
              "label": "HTMLPreview",
              "icon": "lucide:eye",
              "url": "https://htmlpreview.github.io/?https://github.com/{1}/{2}/blob/{3}",
              "desc": "用 htmlpreview 预览 HTML 文件"
            }
          ]
        },
        {
          "id": "github-pr",
          "name": "GitHub Pull Request",
          "patterns": [
            "^https://github\\.com/([^/]+)/([^/]+)/pull/(\\d+).*"
          ],
          "links": [
            {
              "id": "github-dev",
              "label": "github.dev",
              "icon": "simple:github",
              "url": "https://github.dev/{1}/{2}/pull/{3}",
              "desc": "在 VS Code 中审查这个 PR"
            },
            {
              "id": "reviewnb",
              "label": "ReviewNB",
              "icon": "simple:jupyter",
              "url": "https://app.reviewnb.com/{1}/{2}/pull/{3}",
              "desc": "Jupyter Notebook diff 审查"
            },
            {
              "id": "patch",
              "label": "Patch",
              "icon": "lucide:file-text",
              "url": "https://github.com/{1}/{2}/pull/{3}.patch",
              "desc": "PR patch 原始文本"
            },
            {
              "id": "diff",
              "label": "Diff",
              "icon": "lucide:code",
              "url": "https://github.com/{1}/{2}/pull/{3}.diff",
              "desc": "PR diff 原始文本"
            }
          ]
        },
        {
          "id": "github-commit",
          "name": "GitHub Commit",
          "patterns": [
            "^https://github\\.com/([^/]+)/([^/]+)/commit/([a-f0-9]+).*"
          ],
          "links": [
            {
              "id": "patch",
              "label": "Patch",
              "icon": "lucide:file-text",
              "url": "https://github.com/{1}/{2}/commit/{3}.patch",
              "desc": "Commit patch 原始文本"
            },
            {
              "id": "diff",
              "label": "Diff",
              "icon": "lucide:code",
              "url": "https://github.com/{1}/{2}/commit/{3}.diff",
              "desc": "Commit diff 原始文本"
            }
          ]
        },
        {
          "id": "github-release-tag",
          "name": "GitHub Release Tag",
          "patterns": [
            "^https://github\\.com/([^/]+)/([^/]+)/releases/tag/([^/?#]+).*"
          ],
          "links": [
            {
              "id": "zip",
              "label": "Tag ZIP",
              "icon": "lucide:download",
              "url": "https://github.com/{1}/{2}/archive/refs/tags/{3}.zip",
              "desc": "下载此 tag 的源码 zip"
            },
            {
              "id": "tarball",
              "label": "Tag tar.gz",
              "icon": "lucide:archive",
              "url": "https://github.com/{1}/{2}/archive/refs/tags/{3}.tar.gz",
              "desc": "下载此 tag 的源码 tarball"
            }
          ]
        },
        {
          "id": "gist",
          "name": "GitHub Gist",
          "patterns": [
            "^https://gist\\.github\\.com/([^/]+)/([a-f0-9]+).*"
          ],
          "links": [
            {
              "id": "raw",
              "label": "Raw",
              "icon": "lucide:file-text",
              "url": "https://gist.githubusercontent.com/{1}/{2}/raw",
              "desc": "Gist 原始内容"
            },
            {
              "id": "blocks",
              "label": "Blocks",
              "icon": "lucide:layers",
              "url": "https://bl.ocks.org/{1}/{2}",
              "desc": "用 D3 Blocks 预览"
            }
          ]
        }
      ]
    },
    {
      "id": "npm",
      "name": "npm",
      "rules": [
        {
          "id": "npm-package",
          "name": "npm 包页面",
          "patterns": [
            "^https://www\\.npmjs\\.com/package/(@[^/]+/[^/?#]+|[^/?#]+).*"
          ],
          "links": [
            {
              "id": "unpkg",
              "label": "unpkg",
              "icon": "simple:unpkg",
              "url": "https://unpkg.com/{1}/",
              "desc": "unpkg CDN 文件浏览器"
            },
            {
              "id": "jsdelivr",
              "label": "jsDelivr",
              "icon": "simple:jsdelivr",
              "url": "https://www.jsdelivr.com/package/npm/{1}",
              "desc": "jsDelivr CDN 页面"
            },
            {
              "id": "bundlephobia",
              "label": "Bundlephobia",
              "icon": "lucide:scale",
              "url": "https://bundlephobia.com/package/{1}",
              "desc": "查看 bundle 体积和 tree-shaking 情况"
            },
            {
              "id": "packagephobia",
              "label": "Packagephobia",
              "icon": "lucide:package",
              "url": "https://packagephobia.com/result?p={1}",
              "desc": "查看安装体积 vs 发布体积"
            },
            {
              "id": "pkg-size",
              "label": "pkg-size",
              "icon": "lucide:scale",
              "url": "https://pkg-size.dev/{1}",
              "desc": "更详细的包体积分析"
            },
            {
              "id": "npmgraph",
              "label": "npmgraph",
              "icon": "lucide:network",
              "url": "https://npmgraph.js.org/?q={1}",
              "desc": "依赖关系图谱"
            },
            {
              "id": "runkit",
              "label": "RunKit",
              "icon": "lucide:play",
              "url": "https://runkit.com/npm/{1}",
              "desc": "在浏览器中直接运行这个包"
            },
            {
              "id": "socket",
              "label": "Socket",
              "icon": "simple:socketdotdev",
              "url": "https://socket.dev/npm/package/{1}",
              "desc": "安全风险扫描"
            },
            {
              "id": "deps-dev",
              "label": "deps.dev",
              "icon": "lucide:network",
              "url": "https://deps.dev/npm/{1}",
              "desc": "Google Open Source Insights 依赖视图"
            },
            {
              "id": "registry",
              "label": "Registry JSON",
              "icon": "lucide:database",
              "url": "https://registry.npmjs.org/{1}",
              "desc": "npm registry 元数据 JSON"
            },
            {
              "id": "unpkg-meta",
              "label": "unpkg meta",
              "icon": "lucide:database",
              "url": "https://unpkg.com/{1}/?meta",
              "desc": "unpkg 文件元数据 JSON"
            },
            {
              "id": "jsdelivr-cdn",
              "label": "jsDelivr CDN",
              "icon": "simple:jsdelivr",
              "url": "https://cdn.jsdelivr.net/npm/{1}/",
              "desc": "jsDelivr npm CDN 入口"
            },
            {
              "id": "esm-sh",
              "label": "esm.sh",
              "icon": "simple:javascript",
              "url": "https://esm.sh/{1}",
              "desc": "ESM CDN 入口"
            },
            {
              "id": "bundlejs",
              "label": "bundlejs",
              "icon": "lucide:scale",
              "url": "https://bundlejs.com/?q={1}&bundle",
              "desc": "在线估算 bundle 输出"
            },
            {
              "id": "publint",
              "label": "publint",
              "icon": "lucide:check",
              "url": "https://publint.dev/{1}",
              "desc": "检查 npm 包发布质量"
            },
            {
              "id": "npmtrends",
              "label": "npm trends",
              "icon": "lucide:chart-bar",
              "url": "https://npmtrends.com/{1}",
              "desc": "下载趋势对比"
            },
            {
              "id": "snyk",
              "label": "Snyk Advisor",
              "icon": "lucide:shield",
              "url": "https://snyk.io/advisor/npm-package/{1}",
              "desc": "npm 包安全与维护评分"
            }
          ]
        }
      ]
    },
    {
      "id": "gitlab",
      "name": "GitLab",
      "rules": [
        {
          "id": "gitlab-repo",
          "name": "GitLab 仓库",
          "patterns": [
            "^https://gitlab\\.com/([^/]+)/([^/?#]+)/?(?:\\?.*)?$",
            "^https://gitlab\\.com/([^/]+)/([^/]+)/-/tree/.*"
          ],
          "links": [
            {
              "id": "pages",
              "label": "Pages",
              "icon": "lucide:globe",
              "url": "https://{1}.gitlab.io/{2}",
              "desc": "GitLab Pages 站点"
            },
            {
              "id": "gitpod",
              "label": "Gitpod",
              "icon": "simple:gitpod",
              "url": "https://gitpod.io/#https://gitlab.com/{1}/{2}",
              "desc": "Gitpod 云端开发环境"
            }
          ]
        },
        {
          "id": "gitlab-file",
          "name": "GitLab 文件 (blob)",
          "patterns": [
            "^https://gitlab\\.com/(.+?)/-/blob/([^?#]+)(?:[?#].*)?$"
          ],
          "links": [
            {
              "id": "raw",
              "label": "Raw",
              "icon": "lucide:file-text",
              "url": "https://gitlab.com/{1}/-/raw/{2}",
              "desc": "直接获取 GitLab 文件原始内容"
            }
          ]
        }
      ]
    },
    {
      "id": "bitbucket",
      "name": "Bitbucket",
      "rules": [
        {
          "id": "bitbucket-repo",
          "name": "Bitbucket 仓库",
          "patterns": [
            "^https://bitbucket\\.org/([^/]+)/([^/?#]+)/?(?:\\?.*)?$"
          ],
          "links": [
            {
              "id": "source",
              "label": "Source",
              "icon": "lucide:code",
              "url": "https://bitbucket.org/{1}/{2}/src",
              "desc": "打开 Bitbucket 源码视图"
            },
            {
              "id": "gitpod",
              "label": "Gitpod",
              "icon": "simple:gitpod",
              "url": "https://gitpod.io/#https://bitbucket.org/{1}/{2}",
              "desc": "Gitpod 云端开发环境"
            }
          ]
        },
        {
          "id": "bitbucket-file",
          "name": "Bitbucket 文件",
          "patterns": [
            "^https://bitbucket\\.org/([^/]+)/([^/]+)/src/([^/?#]+)/([^?#]+)(?:[?#].*)?$"
          ],
          "links": [
            {
              "id": "raw",
              "label": "Raw",
              "icon": "lucide:file-text",
              "url": "https://bitbucket.org/{1}/{2}/raw/{3}/{4}",
              "desc": "直接获取 Bitbucket 文件原始内容"
            }
          ]
        }
      ]
    },
    {
      "id": "pypi",
      "name": "PyPI",
      "rules": [
        {
          "id": "pypi-project",
          "name": "PyPI 项目页",
          "patterns": [
            "^https://pypi\\.org/project/([^/?#]+)/?.*"
          ],
          "links": [
            {
              "id": "json-api",
              "label": "JSON API",
              "icon": "lucide:database",
              "url": "https://pypi.org/pypi/{1}/json",
              "desc": "PyPI 项目级 JSON 元数据"
            },
            {
              "id": "deps-dev",
              "label": "deps.dev",
              "icon": "lucide:network",
              "url": "https://deps.dev/pypi/{1}",
              "desc": "依赖与版本洞察"
            },
            {
              "id": "libraries",
              "label": "Libraries.io",
              "icon": "lucide:book-open",
              "url": "https://libraries.io/pypi/{1}",
              "desc": "包生态、依赖与维护信息"
            },
            {
              "id": "snyk",
              "label": "Snyk Advisor",
              "icon": "lucide:shield",
              "url": "https://snyk.io/advisor/python/{1}",
              "desc": "Python 包安全与维护评分"
            },
            {
              "id": "piwheels",
              "label": "piwheels",
              "icon": "lucide:package",
              "url": "https://www.piwheels.org/project/{1}/",
              "desc": "Raspberry Pi wheel 构建信息"
            }
          ]
        }
      ]
    },
    {
      "id": "crates",
      "name": "Rust crates",
      "rules": [
        {
          "id": "crate",
          "name": "crates.io 包页面",
          "patterns": [
            "^https://crates\\.io/crates/([^/?#]+).*"
          ],
          "links": [
            {
              "id": "docs-rs",
              "label": "docs.rs",
              "icon": "lucide:book-open",
              "url": "https://docs.rs/{1}",
              "desc": "Rust API 文档"
            },
            {
              "id": "docs-rs-meta",
              "label": "docs.rs JSON",
              "icon": "lucide:database",
              "url": "https://docs.rs/crate/{1}/latest/json",
              "desc": "docs.rs crate 元数据 JSON"
            },
            {
              "id": "deps-rs",
              "label": "deps.rs",
              "icon": "lucide:network",
              "url": "https://deps.rs/crate/{1}",
              "desc": "Rust 依赖健康状态"
            },
            {
              "id": "deps-dev",
              "label": "deps.dev",
              "icon": "lucide:network",
              "url": "https://deps.dev/cargo/{1}",
              "desc": "Google Open Source Insights 依赖视图"
            },
            {
              "id": "crates-api",
              "label": "crates API",
              "icon": "lucide:database",
              "url": "https://crates.io/api/v1/crates/{1}",
              "desc": "crates.io 元数据 API"
            }
          ]
        }
      ]
    },
    {
      "id": "go",
      "name": "Go",
      "rules": [
        {
          "id": "pkg-go-dev",
          "name": "pkg.go.dev 模块页",
          "patterns": [
            "^https://pkg\\.go\\.dev/([^?#]+)(?:[?#].*)?$"
          ],
          "links": [
            {
              "id": "deps-dev",
              "label": "deps.dev",
              "icon": "lucide:network",
              "url": "https://deps.dev/go/{1}",
              "desc": "Go 模块依赖与版本洞察"
            },
            {
              "id": "godocs",
              "label": "GoDocs",
              "icon": "lucide:book-open",
              "url": "https://godocs.io/{1}",
              "desc": "Go 文档镜像"
            },
            {
              "id": "proxy-latest",
              "label": "Proxy latest",
              "icon": "lucide:database",
              "url": "https://proxy.golang.org/{1}/@latest",
              "desc": "Go module proxy latest 元数据"
            }
          ]
        }
      ]
    },
    {
      "id": "maven",
      "name": "Maven",
      "rules": [
        {
          "id": "central-artifact",
          "name": "Maven Central Artifact",
          "patterns": [
            "^https://central\\.sonatype\\.com/artifact/([^/]+)/([^/?#]+).*",
            "^https://mvnrepository\\.com/artifact/([^/]+)/([^/?#]+).*"
          ],
          "links": [
            {
              "id": "central",
              "label": "Central",
              "icon": "lucide:package",
              "url": "https://central.sonatype.com/artifact/{1}/{2}",
              "desc": "Maven Central Portal artifact 页面"
            },
            {
              "id": "deps-dev",
              "label": "deps.dev",
              "icon": "lucide:network",
              "url": "https://deps.dev/maven/{1}/{2}",
              "desc": "Maven 依赖与版本洞察"
            }
          ]
        }
      ]
    },
    {
      "id": "rubygems",
      "name": "RubyGems",
      "rules": [
        {
          "id": "rubygem",
          "name": "RubyGems 包页面",
          "patterns": [
            "^https://rubygems\\.org/gems/([^/?#]+).*"
          ],
          "links": [
            {
              "id": "deps-dev",
              "label": "deps.dev",
              "icon": "lucide:network",
              "url": "https://deps.dev/rubygems/{1}",
              "desc": "RubyGems 依赖与版本洞察"
            },
            {
              "id": "libraries",
              "label": "Libraries.io",
              "icon": "lucide:book-open",
              "url": "https://libraries.io/rubygems/{1}",
              "desc": "包生态、依赖与维护信息"
            },
            {
              "id": "gemdocs",
              "label": "Gemdocs",
              "icon": "lucide:book-open",
              "url": "https://gemdocs.org/gems/{1}/",
              "desc": "Gem 文档"
            },
            {
              "id": "bestgems",
              "label": "BestGems",
              "icon": "lucide:chart-bar",
              "url": "https://bestgems.org/gems/{1}",
              "desc": "RubyGems 下载排行与趋势"
            }
          ]
        }
      ]
    },
    {
      "id": "packagist",
      "name": "Packagist",
      "rules": [
        {
          "id": "packagist-package",
          "name": "Packagist 包页面",
          "patterns": [
            "^https://packagist\\.org/packages/([^/?#]+/[^/?#]+).*"
          ],
          "links": [
            {
              "id": "metadata",
              "label": "Metadata JSON",
              "icon": "lucide:database",
              "url": "https://repo.packagist.org/p2/{1}.json",
              "desc": "Packagist p2 元数据 JSON"
            }
          ]
        }
      ]
    },
    {
      "id": "vscode",
      "name": "VS Code Marketplace",
      "rules": [
        {
          "id": "vscode-extension",
          "name": "VS Code 扩展",
          "patterns": [
            "^https://marketplace\\.visualstudio\\.com/items\\?itemName=([^.#&]+)\\.([^&#]+).*"
          ],
          "links": [
            {
              "id": "open-vsx",
              "label": "Open VSX",
              "icon": "lucide:external-link",
              "url": "https://open-vsx.org/extension/{1}/{2}",
              "desc": "在 Open VSX Registry 查看同名扩展"
            }
          ]
        }
      ]
    },
    {
      "id": "docker",
      "name": "Docker Hub",
      "rules": [
        {
          "id": "docker-official-image",
          "name": "Docker 官方镜像",
          "patterns": [
            "^https://hub\\.docker\\.com/_/([^/?#]+).*"
          ],
          "links": [
            {
              "id": "library-repo",
              "label": "library repo",
              "icon": "simple:docker",
              "url": "https://hub.docker.com/r/library/{1}",
              "desc": "Docker Hub library 命名空间页面"
            },
            {
              "id": "oci-explorer",
              "label": "OCI Explorer",
              "icon": "lucide:layers",
              "url": "https://explore.ggcr.dev/?image={1}",
              "desc": "查看远程镜像 manifest 与 layer"
            },
            {
              "id": "deps-dev",
              "label": "deps.dev",
              "icon": "lucide:network",
              "url": "https://deps.dev/container/docker.io/library/{1}",
              "desc": "容器镜像依赖洞察"
            }
          ]
        },
        {
          "id": "docker-namespace-image",
          "name": "Docker 命名空间镜像",
          "patterns": [
            "^https://hub\\.docker\\.com/r/([^/]+)/([^/?#]+).*"
          ],
          "links": [
            {
              "id": "oci-explorer",
              "label": "OCI Explorer",
              "icon": "lucide:layers",
              "url": "https://explore.ggcr.dev/?image={1}/{2}",
              "desc": "查看远程镜像 manifest 与 layer"
            },
            {
              "id": "deps-dev",
              "label": "deps.dev",
              "icon": "lucide:network",
              "url": "https://deps.dev/container/docker.io/{1}/{2}",
              "desc": "容器镜像依赖洞察"
            }
          ]
        }
      ]
    },
    {
      "id": "group-qnx2k",
      "name": "特强三辫完",
      "rules": [
        {
          "id": "rule-el9xp",
          "name": "情报站",
          "patterns": [
            "http://([^/]+)/admin/\\?n=fc\\.fca\\.aws\\..*"
          ],
          "links": [
            {
              "id": "link-1",
              "label": "查看数据库",
              "icon": "lucide:database",
              "url": "http://{1}/admin/?n=fc.fca.aws.fdb",
              "desc": "DbFilter"
            }
          ]
        }
      ]
    }
  ]
}
