# 项目看板 · Project Board

**一个下载就能用的单文件程序。** 双击 `项目看板.html` —— 不用安装、不用账号、不用密钥、不用数据库、不用服务器、不用联网。

> 连下载都不想做？直接打开 **[在线版](https://mzc91992-afk.github.io/project-board/)**，功能完全一样。

---

## 直接下载

| 下载 | 适合 |
| --- | --- |
| **[⬇ 项目看板.html](https://github.com/mzc91992-afk/project-board/releases/latest/download/项目看板.html)** | 大多数人。约 390 KB 单文件，Windows / macOS / Linux 通用，双击即用 |
| **[⬇ 项目看板-桌面版.zip](https://github.com/mzc91992-afk/project-board/releases/latest/download/项目看板-桌面版.zip)** | 想要独立窗口（无浏览器地址栏、看起来像原生程序）：内含三个平台的启动器 |

只想要源码里的那个文件，也可以用 raw 直链：

```bash
curl -L -o ~/Desktop/项目看板.html \
  "https://raw.githubusercontent.com/mzc91992-afk/project-board/main/%E9%A1%B9%E7%9B%AE%E7%9C%8B%E6%9D%BF.html"
```

Windows 用户：在 [GitHub 文件页](https://github.com/mzc91992-afk/project-board/blob/main/项目看板.html) 点 `Raw` → 右键「另存为」即可。

## 打开之后

`publishableKey` 保持占位值 → **自动进入零配置演示模式**：

- 免登录，自动载入 10 条纯虚构示例项目（可以全删掉，换成自己的）
- 项目看板 / 优先级四象限拖放 / 明细表 / 分类导航四种视图
- 时间线动态、批注、回收站、草稿箱、Excel 明细导出、Markdown 汇报导出
- 新建、编辑、删除、拖动排序保存在本机 `localStorage`，刷新不丢
- **全程不产生任何对外请求**，不连接任何云服务，不上传任何数据

| 想做的事 | 在地址栏加参数 |
| --- | --- |
| 强制演示（已配好云端也想试） | `?demo=1` |
| 清空本机数据、恢复初始示例 | `?reset=demo` |
| 强制走云端（跳过演示，需自行配置） | `?live=1` |

右下角提示卡也能一键「重置演示数据」。

## 桌面版怎么用

解压 `项目看板-桌面版.zip`，保持文件夹结构不要拆散：

| 平台 | 双击 / 运行 |
| --- | --- |
| macOS | `macOS/项目看板.app` |
| Windows | `Windows/启动项目看板.bat`（或 `静默启动.vbs`，不弹黑框） |
| Linux | `bash Linux/启动项目看板.sh` |

启动器会优先调用 Chrome / Edge 的 `--app` 应用模式，打开一个没有地址栏的独立窗口；没装这些浏览器就退回系统默认浏览器。数据仍然保存在浏览器本机，导出、下载等能力完整保留。

> macOS 首次打开 `.app` 若提示「无法验证开发者」：右键点图标 → 打开 → 再点「打开」；或在终端执行 `xattr -dr com.apple.quarantine <解压目录>`。直接双击 `项目看板.html` 则完全没有这一步。

## 功能一览

| 模块 | 说明 |
| --- | --- |
| 四种视图 | 项目看板、优先级四象限（拖放改优先级）、明细表、分类导航首页 |
| 项目档案 | 一句话简介、商务关系、下一步动作、其他备注，停手自动保存 |
| 时间线 | 项目状态动态、批注、需协调问题、下一步线索脉络，均可就地编辑 |
| 优先级 | 重要度 / 紧急度 1–5 分，自动落入四个象限 |
| KPI | 全部项目、需审批、合作拓展类、优先项目、本周新增、本周更新、实质推进等 |
| 附件 | 演示模式存本机（限 1 MB）；云端模式走对象存储，图片/PDF/Office 在线预览 |
| 协作 | 云端模式下邮箱验证码登录、在线成员、显示名、权限与回收站/草稿箱 |
| 导出 | 明细表所见即所得导出 Excel（.xlsx）；项目动态一键生成 Markdown 汇报 |
| 适配 | 网页版 / 手机版双模式，老内核兜底，登录态失效自愈 |

## 目录结构

```
.
├── 项目看板.html                     ★ 单文件主程序（下载这一个就够）
├── index.html                       GitHub Pages 在线版入口
├── SKILL.md                         WorkBuddy 技能入口
├── launchers/                       桌面启动器
│   ├── macOS/项目看板.app
│   ├── Windows/启动项目看板.bat + 静默启动.vbs
│   ├── Linux/启动项目看板.sh + 项目看板.desktop
│   └── 使用说明.txt
├── assets/sample-data.json          虚构示例数据（导入格式参考）
├── references/                      setup / data-model / reporting
└── scripts/                         自检与冒烟测试
```

## 安装为 WorkBuddy Skill（可选）

```bash
git clone https://github.com/mzc91992-afk/project-board.git
cp -r project-board ~/.workbuddy/skills/
```

之后在对话里说「搭一套项目看板」「生成项目周报」「检查看板有没有夹带内部数据」即可触发。

## 接入自己的云端（进阶，可选）

只想本地用，下面全部跳过。要多人协作才需要：

1. 编辑 `项目看板.html` 顶部的 `PUBLIC_CONFIG`：

   ```js
   const PUBLIC_CONFIG = {
     endpoint: "https://your-board.example.com",
     oauthRelayBaseUrl: "https://www.workbuddy.cn/v2/as/genie-baas/oauth",
     publishableKey: "REPLACE_WITH_YOUR_PUBLISHABLE_KEY"
   };
   ```

   `publishableKey` 保持占位值就一直是演示模式；填入真实值自动切回云端。
2. 按 [`references/setup.md`](references/setup.md) 建表、配置行级权限并部署。
3. 把 `ROSTER_DEF` / `LEAD_OWNERS` 换成团队成员，清空 `DEMO` 示例数据。
4. 发布前自检：`python3 scripts/check_secrets.py . && node scripts/verify_template.js`

## 边界与限制

- 演示模式数据只在这台浏览器，不支持多设备同步与多人在线；附件限 1 MB。
- `file://` 下若浏览器禁用 `localStorage`，数据只保留到刷新前，提示卡会自动说明；在线版不受此限制。
- 云端模式内联了云服务 SDK，按 **WorkBuddy 云应用 / PostgREST 风格接口**设计。脱离该平台需自行替换 `cloud.database.from(...)`、`cloud.auth` 与对象存储调用。
- Office 在线预览依赖微软公共服务；权限边界依赖数据库 RLS，公开部署前务必配置。

## 隐私声明

本仓库**不含任何真实业务数据**。项目记录、客户与合作伙伴名称、人员姓名、金额、内部部署地址、应用 ID、发布密钥、品牌 Logo 均已清除；所有示例均为纯虚构内容。发布前可运行 `python3 scripts/check_secrets.py .` 复检。

## 贡献与许可证

欢迎 Issue / PR。提交前运行：

```bash
python3 scripts/check_secrets.py .
node scripts/verify_template.js
npm install --no-save jsdom && node scripts/demo-smoke.js
```

[MIT](LICENSE)
