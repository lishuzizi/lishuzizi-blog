#!/bin/bash
cd /Users/overtanlented/Desktop/lishuzizi-blog
echo "🚀 李树孳孳博客 - 启动中..."
npx astro dev &
sleep 3
open http://localhost:4321/
echo "✅ 浏览器已打开 http://localhost:4321/"
echo "按 Ctrl+C 停止服务"
wait
