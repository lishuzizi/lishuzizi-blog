---
title: "关于个人网站搭建的一些思考"
description: "聊聊为什么选择 Astro + Tailwind 这套技术栈来做个人博客。"
pubDate: "2024-02-20"
tags: ["技术", "前端", "Astro"]
category: "技术"
---

搭建个人网站时面临的最大问题不是技术选型，而是**你到底想做什么**。

### 为什么不是 WordPress

WordPress 很成熟，功能全面，但太重了。为了写几篇文章跑一个 PHP + MySQL 栈，还得操心安全更新、插件兼容、服务器维护——这些都不是我想花时间的事。

静态站点生成器才是正解。

### Astro 的优势

在众多 SSG 里选了 Astro，理由如下：

1. **零 JS 开销** — 页面默认不输出 JavaScript。只有你主动引入的交互组件才会有 JS。这意味首屏加载极快。
2. **Markdown 一等公民** — `src/content/blog/` 下放 .md 文件就能生成页面，frontmatter 支持自定义字段，配合 Zod schema 做类型校验。
3. **Islands 架构** — 需要交互的地方用框架组件（Vue/React/Svelte），不需要的地方纯 HTML，按需加载。
4. **构建速度快** — 小站秒出，大站也不慢。

### Tailwind CSS 的理由

以前写 CSS 总是陷入命名焦虑——这个 class 叫什么？BEM 还是 utility-first？

Tailwind 直接终结了这个问题。不命名，只组合。`px-4 py-2 bg-purple-500 text-white rounded-lg` — 看代码就知道样式，不用来回翻样式表。

配合 `dark:` 前缀做深色模式，几乎不用写一行自定义 CSS。

### 设计思路

颜色选了紫色系。不是跟风，是个人偏好。紫色在深色背景下显眼但不刺眼，在浅色背景下温柔但不软弱。

字体用了 Inter + 思源黑体。西文用 Inter，中文落到思源黑体，字号和字重对齐，混排时视觉统一。

保持克制。一页只做一件事。首页就是看文章列表，文章页就是读文章。没有弹窗，没有通知，没有侧边栏广告。
