# Claude Code UI (人话版 & 深度定制版) 🚀

这是一个专为“避坑”而生的 Claude Code 网页端界面。

> [!IMPORTANT]
> **为什么要用这个版本？**
> 官方的 UI 在对接“套壳 API”或自定义中转（如：海洋湾/Kiro）时，经常会因为协议太严导致“一直 Thinking”。
> 我把底层的引擎改成了 **CLI 桥接模式**——只要你终端里 `claude` 命令能跑通，这个网页就能用！

---

## 🛠️ 一键部署（小白向）

我已经为您配置好了 systemd 服务，如果您是迁移过来的，直接看下面：

1. **进入项目目录**：
   ```bash
   cd /anti/claudeui
   ```

2. **环境变量配置**：
   直接在 `~/.bashrc` 里设置好你的 `ANTHROPIC_BASE_URL` 和 `ANTHROPIC_AUTH_TOKEN`。

3. **启动服务**：
   ```bash
   systemctl restart claudecodeui
   ```

---

## � 给其他人的通用安装指南 (General Setup)

如果你不是本项目的所有者，想在自己的机器上运行，请遵循以下步骤：

### 1. 前提条件 (Prerequisites)
*   **Node.js**: v18 或更高版本。
*   **Claude Code CLI**: 必须先安装官方 CLI 并确保它能运行。
    ```bash
    npm install -g @anthropic-ai/claude-code
    # 确保执行这步能看到回复：
    claude "hello"
    ```

### 2. 快速起步 (Getting Started)
1. **克隆仓库**：
   ```bash
   git clone https://github.com/1williamaoayers/claudeui.git
   cd claudeui
   ```
2. **安装依赖**：
   ```bash
   npm install
   ```
3. **配置环境变量**：创建 `.env` 文件。
   ```bash
   # 必填：你的 API 代理地址和 Key
   ANTHROPIC_BASE_URL=https://api.yourproxy.com
   ANTHROPIC_AUTH_TOKEN=sk-your-key
   
   # 可选：UI 允许访问的起始目录（默认是用户家目录）
   WORKSPACES_ROOT=/
   ```
4. **编译并启动**：
   ```bash
   npm run build
   npm start
   ```

---

## 📂 核心定制说明 (Technical Details)

*   **驱动文件**：`server/claude-cli-bridge.js`（核心逻辑：通过 `spawn('claude')` 桥接，解决所有非标 API 协议问题）。
*   **权限放开**：修改了 `server/routes/projects.js`，允许直接作为 `WORKSPACES_ROOT` 访问根目录 `/`。
*   **模型扩展**：在 `shared/modelConstants.js` 中添加了自定义后端常用的模型 ID。

---

## ⚠️ 避坑指南 (Common Pitfalls)

1.  **Thinking 挂起**：请第一时间确认你的终端 `claude` 命令是否正常。本 UI 原理是“终端的网页版马甲”。
2.  **权限限制**：如果网页无法创建项目，请检查运行 `node` 的用户是否有该目录的写入权限。
3.  **ANSI 乱码**：本驱动自带 ANSI 过滤，会自动清洗终端的颜色转义字符。

---

## 🧹 如何彻底删除 (Uninstall)

1. **停止服务**：`systemctl stop claudecodeui` (如果有)。
2. **删除目录**：`rm -rf /your/path/claudeui`。

---
**项目维护者**: Antigravity AI (基于 siteboon 原版深度定制)
