# flux-dev MCP 服务器
[![smithery badge](https://smithery.ai/badge/@nicekate/flux-dev-mcp)](https://smithery.ai/server/@nicekate/flux-dev-mcp)


一个基于端脑云 Flux 模型 API 的 Model Context Protocol (MCP) 服务器实现。

本项目使用了端脑云的 API 服务，为用户提供强大的 AI 能力支持。

> 🎁 **福利时间**
> 
> 使用我的邀请链接 https://cephalon.cloud/share/register-landing?invite_id=X46Dzv 或邀请码 `X46Dzv` 注册端脑云，
> 可以获得专属注册奖励，额外免费赠送 5000 端脑值！

## 技术栈

- TypeScript
- Node.js
- 端脑云 API

## 快速开始

### 环境要求

- Node.js 16+
- npm 或 yarn
- Windows 或 MacOS 系统

### 安装依赖

```bash
# Windows/MacOS 通用命令
npm install
```

### 构建项目

```bash
# Windows/MacOS 通用命令
npm run build
```

### 开发模式

启动带有自动重新构建的开发模式：

```bash
# Windows/MacOS 通用命令
npm run watch
```

### 安装 Flux Dev
#### 使用 Smithery 安装

通过 [Smithery](https://smithery.ai/server/@nicekate/flux-dev-mcp) 自动安装到 Claude Desktop 的 Flux Dev：

```bash
npx -y @smithery/cli install @nicekate/flux-dev-mcp --client claude
```

## Claude Desktop 配置说明

要在 Claude Desktop 中使用本服务器，需要添加服务器配置。配置文件位置因操作系统而异：

### MacOS
配置文件路径：
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

### Windows
配置文件路径：
```
%APPDATA%\Claude\claude_desktop_config.json
```

配置内容示例：

Windows:
```json
{
  "mcpServers": {
    "flux-dev": {
      "command": "C:\\path\\to\\flux-dev\\build\\index.js"
    }
  }
}
```

MacOS:
```json
{
  "mcpServers": {
    "flux-dev": {
      "command": "/path/to/flux-dev/build/index.js"
    }
  }
}
```

注意：
- Windows 路径使用双反斜杠 `\\` 或单正斜杠 `/`
- MacOS 路径使用单正斜杠 `/`
- 请确保路径指向实际安装位置

## 调试指南

由于 MCP 服务器通过标准输入输出（stdio）通信，调试可能会比较困难。我们推荐使用 [MCP Inspector](https://github.com/modelcontextprotocol/inspector) 工具：

```bash
# Windows/MacOS 通用命令
npm run inspector
```

Inspector 将提供一个浏览器访问地址，用于访问调试工具。

### 常见问题

1. Windows 系统权限问题
   - 如果遇到权限相关错误，请尝试以管理员身份运行命令提示符或 PowerShell

2. MacOS 系统权限问题
   - 如果遇到 "Permission denied" 错误，请确保已正确设置执行权限：
     ```bash
     chmod +x build/index.js
     ```

## 许可证

本项目采用 MIT 许可证，详见 [LICENSE](./LICENSE) 文件。
