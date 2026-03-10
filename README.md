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

## 🎮 如何使用

1. **打开网页**：浏览器访问 `http://你的IP:3001`
2. **选择模型**：在左下角模型列表中，我已经为您添加了 `Sonnet 4.6 (Kiro)` 等专属选项。
3. **管理项目**：点击 **Projects** -> **Create New Project**，你可以直接输入 `/` 或者 `/anti/phone`。
   *   **注意**：我已经解除了 UI 对系统根目录的封锁，你可以管理全盘文件。

---

## ⚠️ 避坑指南（必看）

1.  **为什么还是 Thinking？**：
    *   检查终端输入 `claude "hello"` 是否有反应。
    *   如果终端有反应但 UI 没反应，尝试刷新网页或清除浏览器缓存。
2.  **权限报错**：
    *   虽然 UI 放开了根目录权限，但底层的 Node.js 进程仍受系统 Linux 用户权限限制。建议以 `root` 或具备相应读写权限的用户运行服务。
3.  **不要乱加参数**：
    *   在 `server/claude-cli-bridge.js` 中不要随意添加 `claude` 命令不支持的参数（如 `--print-config`），否则进程会报错退出。

---

## 🧹 如何彻底删除

如果你不想用了，按以下步骤清理：

1. **停止并禁用服务**：
   ```bash
   systemctl stop claudecodeui
   ```
2. **删除服务文件**：
   ```bash
   rm /etc/systemd/system/claudecodeui.service
   systemctl daemon-reload
   ```
3. **删除代码目录**：
   ```bash
   rm -rf /anti/claudeui
   ```

---

## 📂 核心定制说明

*   **驱动文件**：`server/claude-cli-bridge.js`（网页对接终端的核心）。
*   **权限文件**：`server/routes/projects.js`（放开 / 根目录访问）。
*   **模型文件**：`shared/modelConstants.js`（自定义模型下拉菜单）。

---
**项目地址**: [1williamaoayers/claudeui](https://github.com/1williamaoayers/claudeui)
**复盘记录**: [Claude-Code-UI技术复盘.md](file:///anti/linkopenclaw/Claude-Code-UI技术复盘.md)
