# LSR Nova Defense (LSR 新星防御)

一款基于 React + Vite + Tailwind CSS 开发的高科技风格塔防游戏。

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone <你的仓库地址>
cd <项目目录>
```

### 2. 安装依赖
```bash
npm install
```

### 3. 本地开发
```bash
npm run dev
```

### 4. 构建生产版本
```bash
npm run build
```

## 🌐 部署到 Vercel

1. 将代码推送到 GitHub。
2. 在 Vercel 中导入此仓库。
3. 如果使用了 Gemini AI 功能，请在 Vercel 的项目设置中添加环境变量：
   - `GEMINI_API_KEY`: 您的 Google AI API 密钥。
4. 部署完成后，Vercel 会提供一个访问链接。

## 🎮 玩法介绍

- **防御目标**：保护底部的 6 座城市和 3 座防御炮台。
- **操作方式**：点击屏幕发射拦截导弹。导弹会在点击位置产生范围爆炸。
- **修复机制**：点击被摧毁的建筑可以启动修复。城市修复需 10 秒，炮台修复需 20 秒。
- **胜利条件**：得分达到 1000 分。
- **失败条件**：所有炮台均被摧毁。

## 🛠 技术栈

- **React 19**: UI 框架
- **Tailwind CSS 4**: 样式处理
- **Motion**: 动画效果
- **Lucide React**: 图标库
- **Canvas API**: 游戏核心渲染引擎
