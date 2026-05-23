(() => {
	const STORAGE_KEY = "forkurl-site-language";
	const SUPPORTED_LANGUAGES = ["zh", "en"];

	const messages = {
		zh: {
			"language.label": "语言",
			"nav.primaryLabel": "主导航",
			"nav.features": "功能",
			"nav.rules": "默认规则",
			"nav.install": "安装",
			"nav.releases": "版本",
			"footer.label": "页脚",
			"footer.tagline": "开源 URL 工具跳转扩展。",
			"footer.privacy": "隐私",
			"footer.issues": "问题反馈",
			"footer.releases": "版本记录",

			"home.title": "ForkURL - 开源 URL 工具跳转扩展",
			"home.metaDescription": "ForkURL 是一个浏览器扩展，可在 GitHub、npm、GitLab 等页面把当前 URL 匹配为 Pages、Raw、IDE、CDN 等下一步工具入口。",
			"home.hero.eyebrow": "URL 工具跳转扩展",
			"home.hero.title": "把当前 URL 变成下一步工具入口。",
			"home.hero.summary": "打开仓库、包页面或代码资源时，ForkURL 会在工具栏显示可用跳转数量。点开图标即可前往 Pages、Raw、github.dev、CDN、依赖分析等相关工具。",
			"home.hero.download": "下载 v2.1.1",
			"home.hero.installOptions": "查看安装方式",
			"home.hero.releaseLabel": "当前版本信息",
			"home.hero.current": "当前版本：v2.1.1",
			"home.hero.remoteRules": "支持远程规则",
			"home.product.alt": "ForkURL 弹窗展示 GitHub 仓库页面可用的 Pages、在线 IDE、沙箱、CDN 和发布入口。",
			"home.product.caption": "匹配当前页面后，工具栏弹窗只展示可用跳转。",
			"home.install.eyebrow": "安装",
			"home.install.title": "先从 GitHub 发布包安装。",
			"home.install.summary": "当前公开版本通过 GitHub Releases 分发。Chrome 和 Edge 可加载解压后的扩展目录；商店入口准备好后会在这里更新。",
			"home.install.gridLabel": "安装渠道",
			"home.install.release.title": "GitHub 发布包",
			"home.install.release.description": "下载最新 zip 包",
			"home.install.chrome.title": "Chrome 应用商店",
			"home.install.chrome.description": "Chrome 官方商店",
			"home.install.edge.title": "Edge 加载项",
			"home.install.edge.description": "Microsoft Edge 商店",
			"home.install.firefox.title": "Firefox 扩展",
			"home.install.firefox.description": "Firefox 版本评估中",
			"home.install.source.title": "源代码",
			"home.install.source.description": "查看源码和问题反馈",
			"home.badges.available": "可用",
			"home.badges.planned": "规划中",
			"home.badges.open": "打开",
			"home.features.eyebrow": "功能",
			"home.features.title": "围绕 URL 匹配、跳转和规则维护设计。",
			"home.features.badge.title": "工具栏徽标",
			"home.features.badge.description": "匹配页面时显示可用跳转数量。不向页面注入浮层，页面 DOM 保持干净。",
			"home.features.rules.title": "远程规则源",
			"home.features.rules.description": "默认规则可随版本打包，也可从公开 JSON 地址定时同步，适合快速补充新站点。",
			"home.features.editor.title": "可视化编辑器",
			"home.features.editor.description": "自定义组、规则和链接都能在设置页维护，并可用示例 URL 验证生成结果。",
			"home.features.icons.title": "图标选择器",
			"home.features.icons.description": "内置 Simple Icons 与 Lucide 图标，默认启用 Iconify 缓存缺失图标，也可在线搜索并缓存到本地。",
			"home.workflow.eyebrow": "使用流程",
			"home.workflow.title": "识别页面，展开候选项，再打开目标工具。",
			"home.workflow.summary": "ForkURL 只把当前 URL 用于本地规则匹配。匿名遥测只统计安装、每日活跃和入口使用，不记录页面 URL、域名、跳转目标或自定义规则。",
			"home.workflow.match.title": "匹配当前页",
			"home.workflow.match.description": "打开 GitHub 仓库、npm 包或 GitLab 项目等页面后，徽标显示可用跳转数量。",
			"home.workflow.choose.title": "选择跳转",
			"home.workflow.choose.description": "点开弹窗，只看到当前页面能用的工具入口。",
			"home.workflow.tune.title": "维护规则",
			"home.workflow.tune.description": "在设置页启停规则、配置远程源，或提交新规则到官方源。",

			"rules.title": "ForkURL 默认跳转目标",
			"rules.metaDescription": "ForkURL 默认规则表：查看 GitHub、npm、GitLab、PyPI、Rust、Go、Maven、Docker 等页面已经内置的跳转目标。",
			"rules.eyebrow": "默认规则",
			"rules.heading": "ForkURL 已内置这些跳转目标。",
			"rules.intro": "打开匹配页面时，ForkURL 会只展示当前页面可用的目标。下面是公开默认规则快照，帮助你快速判断哪些页面已经有现成入口。",
			"rules.table.eyebrow": "目标表",
			"rules.table.heading": "按页面类型查看默认跳转。",
			"rules.custom.eyebrow": "自定义",
			"rules.custom.heading": "默认规则之外，你可以继续扩展。",
			"rules.custom.summary": "内置规则只是常用入口。你可以在扩展设置页新增自己的组、正则和跳转链接，也可以配置远程规则源，让团队共享同一份规则 JSON。",
			"rules.custom.local.title": "本地自定义",
			"rules.custom.local.description": "用设置页的可视化编辑器添加规则，并用示例 URL 验证生成结果。",
			"rules.custom.remote.title": "远程规则源",
			"rules.custom.remote.description": "把规则 JSON 放在公开地址，ForkURL 可定时同步，适合团队维护。",
			"rules.custom.submit.title": "提交到官方源",
			"rules.custom.submit.description": "通过 GitHub Issue 表单提交规则，审核合并后会自动更新默认规则文档。",

			"privacy.title": "ForkURL 隐私说明 - 开源 URL 工具跳转扩展",
			"privacy.metaDescription": "ForkURL 隐私说明：扩展如何处理当前页面 URL、自定义规则、Iconify 搜索和匿名使用统计。",
			"privacy.eyebrow": "隐私",
			"privacy.heading": "ForkURL 隐私说明",
			"privacy.intro": "ForkURL 用于把当前页面 URL 匹配为相关工具入口。扩展会在浏览器本地读取当前标签页 URL、规则配置和启停状态来生成跳转列表，但不会把这些内容发送到 ForkURL 的遥测服务。",
			"privacy.local.heading": "本地处理",
			"privacy.local.summary": "当前页面 URL 只用于本地正则匹配；自定义规则、远程规则地址、禁用状态和图标缓存保存在浏览器本地存储。启用远程规则源时，浏览器会向你配置的公开 URL 请求规则 JSON。",
			"privacy.telemetry.heading": "匿名使用统计",
			"privacy.telemetry.summary": "匿名使用统计默认开启，可在扩展设置页关闭。统计用于了解活跃安装量、版本分布和核心入口使用情况。",
			"privacy.sent.heading": "会发送的信息：",
			"privacy.sent.installId.title": "匿名安装 ID",
			"privacy.sent.installId.description": "随机生成，仅用于区分安装，不包含账号或设备身份；服务端只保存不可逆哈希用于去重统计。",
			"privacy.sent.version.title": "扩展版本",
			"privacy.sent.version.description": "例如 2.0.1，用于判断版本分布。",
			"privacy.sent.event.title": "事件类型",
			"privacy.sent.event.description": "install、update、daily_active、popup_open、jump_open、options_open、rules_refresh。",
			"privacy.sent.environment.title": "粗粒度环境",
			"privacy.sent.environment.description": "扩展语言、浏览器大类、操作系统大类。",
			"privacy.sent.country.title": "粗粒度来源",
			"privacy.sent.country.description": "Cloudflare 提供的国家/地区码；不保存 IP、URL、域名或 referrer。",
			"privacy.sent.date.title": "日期",
			"privacy.sent.date.description": "按 UTC 日期聚合，客户端会限频发送。",
			"privacy.notSent.heading": "不会发送的信息：",
			"privacy.notSent.page.title": "页面 URL",
			"privacy.notSent.page.description": "不会上传当前页面 URL、域名、路径、查询参数或 referrer。",
			"privacy.notSent.rules.title": "规则与跳转目标",
			"privacy.notSent.rules.description": "不会上传匹配到的规则、生成的目标 URL、自定义规则或禁用状态。",
			"privacy.notSent.config.title": "用户配置内容",
			"privacy.notSent.config.description": "不会上传导入导出的配置文件、远程规则地址或图标缓存内容。",
			"privacy.iconify.heading": "Iconify 在线图标搜索",
			"privacy.iconify.summary": "Iconify 图标缓存默认开启。规则使用未内置的 Simple Icons / Lucide 图标时，扩展会向 Iconify 请求对应 SVG 并缓存在本地；图标选择器也会向 Iconify 请求搜索结果。可在设置页关闭，ForkURL 遥测不会记录图标搜索词。",
			"privacy.optOut.heading": "关闭方式",
			"privacy.optOut.summary": "打开 ForkURL 设置页，关闭“发送匿名使用统计”。关闭后扩展不会继续发送遥测请求，并会清理本地遥测 ID 与发送记录。",
			"privacy.chrome.heading": "Chrome Web Store 用户数据政策",
			"privacy.chrome.summary": "通过 Google API 获得的信息会遵守 Chrome Web Store 用户数据政策，包括 Limited Use 要求。",
			"privacy.feedback.heading": "反馈",
			"privacy.feedback.prefix": "反馈问题请使用",
			"privacy.feedback.suffix": "。提交问题时请先脱敏示例 URL 和配置。"
		},
		en: {
			"language.label": "Language",
			"nav.primaryLabel": "Primary navigation",
			"nav.features": "Features",
			"nav.rules": "Default rules",
			"nav.install": "Install",
			"nav.releases": "Releases",
			"footer.label": "Footer",
			"footer.tagline": "Open-source URL tool launcher extension.",
			"footer.privacy": "Privacy",
			"footer.issues": "Issues",
			"footer.releases": "Release notes",

			"home.title": "ForkURL - Open-source URL tool launcher extension",
			"home.metaDescription": "ForkURL is a browser extension that turns GitHub, npm, GitLab and similar pages into contextual shortcuts for Pages, Raw, IDEs, CDNs and analysis tools.",
			"home.hero.eyebrow": "URL tool launcher",
			"home.hero.title": "Turn the current URL into the next tool to open.",
			"home.hero.summary": "When a repository, package page or code resource matches your rules, ForkURL shows the available shortcut count in the toolbar. Open the popup to jump to Pages, Raw, github.dev, CDNs, dependency analysis and related tools.",
			"home.hero.download": "Download v2.1.1",
			"home.hero.installOptions": "Install options",
			"home.hero.releaseLabel": "Current release details",
			"home.hero.current": "Current: v2.1.1",
			"home.hero.remoteRules": "Remote rules supported",
			"home.product.alt": "ForkURL popup showing available Pages, web IDE, sandbox, CDN and release shortcuts for a GitHub repository page.",
			"home.product.caption": "After a page matches, the toolbar popup shows only usable shortcuts.",
			"home.install.eyebrow": "Install",
			"home.install.title": "Install from GitHub Releases first.",
			"home.install.summary": "The public build is distributed through GitHub Releases. Chrome and Edge can load the unpacked extension today; store links will be updated here when ready.",
			"home.install.gridLabel": "Install channels",
			"home.install.release.title": "GitHub Release",
			"home.install.release.description": "Download the latest zip",
			"home.install.chrome.title": "Chrome Web Store",
			"home.install.chrome.description": "Official Chrome listing",
			"home.install.edge.title": "Edge Add-ons",
			"home.install.edge.description": "Microsoft Edge listing",
			"home.install.firefox.title": "Firefox Add-ons",
			"home.install.firefox.description": "Firefox build under review",
			"home.install.source.title": "Source code",
			"home.install.source.description": "Browse source and issues",
			"home.badges.available": "Available",
			"home.badges.planned": "Planned",
			"home.badges.open": "Open",
			"home.features.eyebrow": "Features",
			"home.features.title": "Built around URL matching, launching and rule maintenance.",
			"home.features.badge.title": "Toolbar badge",
			"home.features.badge.description": "Matching pages show the available shortcut count. ForkURL does not inject floating UI into the page DOM.",
			"home.features.rules.title": "Remote rule source",
			"home.features.rules.description": "Default rules ship with the release, while public JSON rule sources can be synced on a schedule for new sites.",
			"home.features.editor.title": "Visual editor",
			"home.features.editor.description": "Custom groups, rules and links can be maintained in settings and tested with sample URLs.",
			"home.features.icons.title": "Icon picker",
			"home.features.icons.description": "Use bundled Simple Icons and Lucide icons, with Iconify enabled by default to cache missing icons locally.",
			"home.workflow.eyebrow": "Workflow",
			"home.workflow.title": "Recognize the page, choose a candidate, open the target tool.",
			"home.workflow.summary": "ForkURL uses the current URL only for local rule matching. Anonymous telemetry counts installs, daily activity and entry usage without recording page URLs, domains, target URLs or custom rules.",
			"home.workflow.match.title": "Match page",
			"home.workflow.match.description": "Open a GitHub repository, npm package or GitLab project page and the badge shows how many shortcuts are available.",
			"home.workflow.choose.title": "Choose shortcut",
			"home.workflow.choose.description": "Open the popup and see only the tools that apply to the current page.",
			"home.workflow.tune.title": "Maintain rules",
			"home.workflow.tune.description": "Enable or disable rules, configure a remote source, or submit a new rule to the official source.",

			"rules.title": "ForkURL Default Shortcut Targets",
			"rules.metaDescription": "ForkURL default rules table: see the built-in shortcut targets for GitHub, npm, GitLab, PyPI, Rust, Go, Maven, Docker and more.",
			"rules.eyebrow": "Default rules",
			"rules.heading": "ForkURL already includes these shortcut targets.",
			"rules.intro": "When the current page matches, ForkURL shows only the targets that apply to that page. This public default snapshot helps you see which pages already have ready-made shortcuts.",
			"rules.table.eyebrow": "Target table",
			"rules.table.heading": "Browse default shortcuts by page type.",
			"rules.custom.eyebrow": "Customize",
			"rules.custom.heading": "You can extend ForkURL beyond the defaults.",
			"rules.custom.summary": "Built-in rules cover common entry points. You can add your own groups, regular expressions and target links in settings, or configure a remote rule source so a team can share one JSON file.",
			"rules.custom.local.title": "Local custom rules",
			"rules.custom.local.description": "Add rules with the visual editor in settings and verify output with sample URLs.",
			"rules.custom.remote.title": "Remote rule source",
			"rules.custom.remote.description": "Host rule JSON at a public URL and let ForkURL sync it on a schedule for team use.",
			"rules.custom.submit.title": "Submit to the official source",
			"rules.custom.submit.description": "Submit rules through the GitHub Issue form. After review and merge, default-rule documentation updates automatically.",

			"privacy.title": "ForkURL Privacy Policy - Open-source URL tool launcher extension",
			"privacy.metaDescription": "ForkURL privacy policy: how the extension handles current page URLs, custom rules, Iconify search and anonymous usage statistics.",
			"privacy.eyebrow": "Privacy",
			"privacy.heading": "ForkURL Privacy Policy",
			"privacy.intro": "ForkURL turns the current page URL into contextual tool shortcuts. The extension reads the active tab URL, rule configuration and enabled states locally to build the shortcut list, but does not send that content to ForkURL telemetry services.",
			"privacy.local.heading": "Local processing",
			"privacy.local.summary": "The current page URL is used only for local regular-expression matching. Custom rules, remote rule source URLs, disabled states and icon cache are stored in browser local storage. If you enable a remote rule source, the browser requests rule JSON from the public URL you configured.",
			"privacy.telemetry.heading": "Anonymous Usage Statistics",
			"privacy.telemetry.summary": "Anonymous usage statistics are enabled by default and can be disabled in extension settings. They help estimate active installs, version distribution and core entry-point usage.",
			"privacy.sent.heading": "Information sent:",
			"privacy.sent.installId.title": "Anonymous installation ID",
			"privacy.sent.installId.description": "Randomly generated to distinguish installs. It does not include account or device identity; the server stores only an irreversible hash for deduplication.",
			"privacy.sent.version.title": "Extension version",
			"privacy.sent.version.description": "For example, 2.0.1, used to understand version distribution.",
			"privacy.sent.event.title": "Event type",
			"privacy.sent.event.description": "install, update, daily_active, popup_open, jump_open, options_open, rules_refresh.",
			"privacy.sent.environment.title": "Coarse environment",
			"privacy.sent.environment.description": "Extension locale, browser family and operating-system family.",
			"privacy.sent.country.title": "Coarse location",
			"privacy.sent.country.description": "Country or region code from Cloudflare request metadata; IP, URL, domain and referrer are not stored.",
			"privacy.sent.date.title": "Date",
			"privacy.sent.date.description": "Aggregated by UTC day. The client rate-limits telemetry sends.",
			"privacy.notSent.heading": "Information not sent:",
			"privacy.notSent.page.title": "Page URL",
			"privacy.notSent.page.description": "Current page URLs, domains, paths, query parameters and referrers are not uploaded.",
			"privacy.notSent.rules.title": "Rules and target URLs",
			"privacy.notSent.rules.description": "Matched rules, generated target URLs, custom rules and disabled states are not uploaded.",
			"privacy.notSent.config.title": "User configuration content",
			"privacy.notSent.config.description": "Imported or exported configuration files, remote rule source URLs and icon cache contents are not uploaded.",
			"privacy.iconify.heading": "Iconify online icon search",
			"privacy.iconify.summary": "Iconify icon caching is on by default. When a rule uses a Simple Icons or Lucide icon that is not bundled, the extension requests that SVG from Iconify and caches it locally; the icon picker also requests search results from Iconify. You can turn this off in settings. ForkURL telemetry does not record icon search terms.",
			"privacy.optOut.heading": "Opt out",
			"privacy.optOut.summary": "Open ForkURL settings and turn off “Share anonymous usage statistics”. After that, the extension stops sending telemetry requests and clears the local telemetry ID and send records.",
			"privacy.chrome.heading": "Chrome Web Store User Data Policy",
			"privacy.chrome.summary": "Information received from Google APIs will adhere to the Chrome Web Store User Data Policy, including the Limited Use requirements.",
			"privacy.feedback.heading": "Feedback",
			"privacy.feedback.prefix": "Please report issues through ",
			"privacy.feedback.suffix": ". Sanitize sample URLs and configuration before posting."
		}
	};

	if (globalThis.__FORKURL_SITE_I18N_TEST__) {
		globalThis.__forkurlSiteMessages = messages;
		return;
	}

	const readSavedLanguage = () => {
		try {
			const value = window.localStorage.getItem(STORAGE_KEY);
			return SUPPORTED_LANGUAGES.includes(value) ? value : null;
		} catch {
			return null;
		}
	};

	const writeSavedLanguage = (language) => {
		try {
			window.localStorage.setItem(STORAGE_KEY, language);
		} catch {
			// Storage may be blocked in private contexts; the page still switches for this session.
		}
	};

	const detectLanguage = () => {
		const saved = readSavedLanguage();
		if (saved) {
			return saved;
		}

		const browserLanguages = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
		return browserLanguages.some((language) => String(language).toLowerCase().startsWith("zh")) ? "zh" : "en";
	};

	const applyLanguage = (language, shouldPersist = false) => {
		const dictionary = messages[language] || messages.zh;
		document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
		document.documentElement.dataset.language = language;

		document.querySelectorAll("[data-i18n]").forEach((element) => {
			const key = element.getAttribute("data-i18n");
			if (dictionary[key]) {
				element.textContent = dictionary[key];
			}
		});

		document.querySelectorAll("[data-i18n-attr]").forEach((element) => {
			const pairs = element.getAttribute("data-i18n-attr").split(";");
			pairs.forEach((pair) => {
				const [attribute, key] = pair.split(":").map((item) => item.trim());
				if (attribute && key && dictionary[key]) {
					element.setAttribute(attribute, dictionary[key]);
				}
			});
		});

		document.querySelectorAll("[data-lang-option]").forEach((button) => {
			const isActive = button.getAttribute("data-lang-option") === language;
			button.setAttribute("aria-pressed", String(isActive));
		});

		if (shouldPersist) {
			writeSavedLanguage(language);
		}
	};

	document.addEventListener("click", (event) => {
		const button = event.target.closest("[data-lang-option]");
		if (!button) {
			return;
		}

		const language = button.getAttribute("data-lang-option");
		if (SUPPORTED_LANGUAGES.includes(language)) {
			applyLanguage(language, true);
		}
	});

	applyLanguage(detectLanguage());
})();
