---
title: "Markdown 语法指南"
description: "一份基础的 Markdown 语法示例，帮助你在 Astro 中撰写博客内容。"
pubDate: "2024-03-10"
tags: ["技术", "教程"]
category: "技术"
---

这是一份 Markdown 语法参考，方便写文章时查阅。

## 标题

```
# H1
## H2
### H3
#### H4
```

## 文本样式

- **加粗** `**加粗**`
- _斜体_ `_斜体_`
- ~~删除线~~ `~~删除线~~`
- `行内代码` `` `行内代码` ``

## 引用

> 这是一段引用文本。
>
> 可以跨多行。

## 列表

无序列表：

- 项目一
- 项目二
  - 子项目

有序列表：

1. 第一步
2. 第二步
3. 第三步

## 代码块

```python
def hello():
    print("Hello, World!")
```

## 分隔线

---

## 链接

[Astro 官网](https://astro.build)

## 图片

![alt text](/avatar.jpg)

## 表格

| 语法 | 效果 |
|------|------|
| `**文字**` | **文字** |
| `_文字_` | _文字_ |

Astro 内置了 `@tailwindcss/typography` 插件，文章内容直接用 `prose` 类就能获得良好的排版效果。具体使用时在包裹容器上加 `prose prose-lg prose-invert` 即可。
