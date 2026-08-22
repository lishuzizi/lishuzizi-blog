#!/bin/bash
# 推送代码并部署到 Vercel 生产环境
cd /Users/overtanlented/Desktop/lishuzizi-blog

echo "📤 推送到 GitHub..."
git push

echo "🚀 部署到 Vercel..."
npx vercel deploy --prod --yes 2>&1 | grep -E "Aliased|Ready|Error|Build"

echo "✅ 完成！访问 https://lishuzizi.com"
