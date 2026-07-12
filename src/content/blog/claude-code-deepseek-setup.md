---
title: "Claude Code + DeepSeek：Windows 下的配置指南"
description: "从零开始，在 Windows 上配置 Claude Code CLI，配合 DeepSeek API 实现低成本 AI 编程。"
pubDate: "2026-07-12"
tags: ["技术", "AI", "Claude", "DeepSeek"]
category: "技术"
---

## 一、环境准备：Node.js

Claude Code CLI 使用 JavaScript/TypeScript 开发，Node.js 是它的运行环境。CLI 通过 Node.js 执行命令、读取项目文件、生成 diff、创建 PR——没有 Node.js，Claude 动不了。

为了让 Node.js 保持较新的版本，还需要 nvm（Node Version Manager）来管理版本。

**1. 下载 nvm-windows 1.2.2 安装包**

去 GitHub releases 页面下载。注意：如果有 GitHub 加速选项，不要点，会改变页面布局。

![nvm 下载页面](/images/claude-code-setup/nvm-download.png)

![nvm 下载页面 2](/images/claude-code-setup/nvm-download-2.png)

**2. 安装 nvm**

拿到安装包之后一路绿灯安装就行。

![nvm 安装程序](/images/claude-code-setup/nvm-installer.png)

**3. 使用 nvm 安装并切换到 Node.js 18**

```
nvm install 18
nvm use 18
```

Win + R 打开运行，输入 cmd，依次执行这两条命令。

![nvm 安装成功](/images/claude-code-setup/nvm-install-success.png)

**注意：** Windows 用户名必须全是英文。如果用户名是中文，会报下面这样的错误：

![nvm 中文用户名报错](/images/claude-code-setup/nvm-error.png)

![nvm 中文用户名报错 2](/images/claude-code-setup/nvm-error-2.png)

---

## 二、安装 Claude Code

找到镜像源安装路径（实测发现 macOS 的包容性比 Windows 强很多，Windows 装起来明显更麻烦）：

```
npm install -g @anthropic-ai/claude-code --registry=https://registry.npmmirror.com
```

![Claude Code 安装成功](/images/claude-code-setup/claude-install.png)

装完之后，Claude 的本体就就位了。

类比一下：现在我们有了一双巧手，还需要给手配个脑子。国外的 AI API 极贵，大多数人目前没有用工作流来消化这种成本的场景，所以我们配一下 DeepSeek 的 API 就行。

---

## 三、CC Switch——API 管理工具

CC Switch 是专为 AI 编程工具（Claude Code、Codex、Gemini CLI、OpenCode、OpenClaw 等）设计的**跨平台可视化管理工具**，支持 Windows、macOS、Linux。

它的核心作用是**集中管理各类 AI 接口配置**，包括 API Key、节点、代理、中转平台（MCP）、Skills 和 Prompt 模板等信息。

去 GitHub releases 页面下载安装包：

![CC Switch 下载](/images/claude-code-setup/cc-switch-download.png)

![CC Switch 下载 2](/images/claude-code-setup/cc-switch-download-2.png)

浏览器可能会提示不信任，允许运行即可：

![浏览器不信任提示](/images/claude-code-setup/browser-warning.png)

![浏览器不信任提示 2](/images/claude-code-setup/browser-warning-2.jpg)

![浏览器允许运行](/images/claude-code-setup/browser-allow.png)

---

## 四、DeepSeek API——性价比之选

去 [DeepSeek 官网](https://www.deepseek.com/) 注册账号：

![DeepSeek 官网](/images/claude-code-setup/deepseek-api.png)

进入 API Keys 页面创建一个 API Key，取个名字，保存好——API Key 只显示一次，记得立即保存。

![DeepSeek API Keys](/images/claude-code-setup/deepseek-key.png)

打开 CC Switch，右上角加号，创建一个 DeepSeek 配置，把 API Key 粘贴进去：

![CC Switch 添加配置](/images/claude-code-setup/cc-switch-config.png)

![CC Switch 配置完成](/images/claude-code-setup/cc-switch-config-2.png)

---

## 五、使用

完成上述工作之后，Claude 就能说话了。平时充值去 DeepSeek 官网就行。

使用方式：Win + R → 输入 `cmd` → 输入 `claude`。

召唤你的专属仆从。
