# Strategy Board Skill · 战略项目动态看板

一套可复用的 **WorkBuddy Skill**：把「项目台账 → 优先级排序 → 时间线留痕 → 一键汇报」沉淀为模板、脚本与口径文档。核心产物是一份零构建的单文件 HTML 看板——**双击就能用，不需要账号、密钥、数据库或 npm**。

> **隐私声明**：本仓库**不含任何真实业务数据**。项目记录、客户与合作伙伴名称、人员姓名、金额、内部部署地址、应用 ID、发布密钥、品牌 Logo 均已清除；仓库内所有示例数据（含 `DEMO` 数组与 `sample-data.json`）均为纯虚构内容。

## 30 秒上手：零配置演示模式

**方式 A · 最省事，只要 1 个文件**：下载 [index.html](https://github.com/mzc91992-afk/strategy-board-skill/blob/main/assets/strategy-board/index.html)（点 `Raw` → 右键「另存为」，或直接用 [raw 直链](https://raw.githubusercontent.com/mzc91992-afk/strategy-board-skill/main/assets/strategy-board/index.html)），**双击打开**。整套看板就在这一个文件里，不用装任何东西、不用 clone 整个仓库。

**方式 B · 想同时装成 WorkBuddy Skill**：

```bash
git clone https://github.com/mzc91992-afk/strategy-board-skill.git
cd strategy-board-skill
open assets/strategy-board/index.html       # macOS
# Windows：双击该文件；Linux：xdg-open assets/strategy-board/index.html
```

`publishableKey` 保持占位值时，模板**自动进入演示模式**：

- 免登录，自动载入 10 条纯虚构示例项目
- 看板 / 四象限拖放 / 明细表 / 分类导航四种视图、时间线、批注、回收站、草稿箱、Excel 与 Markdown 导出全部可用
- 新建、编辑、删除、拖动排序保存在本机 `localStorage`，刷新不丢
- **全程不产生任何对外请求**，也不连接任何云服务
- 右下角提示卡可一键「重置演示数据」

| 想做的事 | 在地址栏加参数 |
| --- | --- |
| 强制演示（已配好云端也想试） | `?demo=1` |
| 清空本机数据、恢复示例 | `?reset=demo` |
| 强制走云端（跳过演示） | `?live=1` |

演示模式的边界：附件限 1 MB（以 dataURL 存本机）、不支持多设备同步与多人在线；`file://` 下若浏览器禁用 localStorage，数据只保留到刷新前，提示卡会自动说明。

想接真实数据，继续看下面的「快速开始」。

## 功能一览

| 模块 | 说明 |
| --- | --- |
| 四种视图 | 项目看板、优先级四象限（拖放改优先级）、明细表、分类导航首页 |
| 项目档案 | 一句话简介、商务关系、下一步动作、其他备注，停手自动保存 |
| 时间线 | 项目状态动态、领导批注、需协调问题、下一步线索脉络，均可就地编辑 |
| 优先级 | 重要度 / 紧急度 1–5 分，自动落入四个象限 |
| KPI | 全部项目、需审批、战略合作类、优先项目、本周新增、本周更新、实质推进等 |
| 附件 | 上传至对象存储，图片/PDF/Office 在线预览，独立可拖拽预览窗 |
| 协作 | 邮箱验证码注册登录、在线成员、显示名、权限与回收站/草稿箱 |
| 导出 | 明细表所见即所得导出 Excel（.xlsx）；项目动态一键生成 Markdown 汇报 |
| 适配 | 网页版 / 手机版双模式，老内核兜底，登录态失效自愈 |
| 演示模式 | 占位配置自动启用，本地数据层 + 免登录 + 虚构示例，零依赖零请求 |

## 目录结构

```
.
├── SKILL.md                          WorkBuddy 技能入口（含触发条件与工作流）
├── README.md / LICENSE / .gitignore
├── assets/
│   ├── strategy-board/index.html     单文件看板模板（已脱敏，内置演示模式）
│   └── sample-data.json             虚构示例数据
├── references/
│   ├── setup.md                     配置、建表、部署
│   ├── data-model.md                数据结构与字段口径
│   └── reporting.md                 盘点与汇报口径
└── scripts/
    ├── check_secrets.py             发布前敏感信息自检
    ├── verify_template.js           模板完整性静态校验
    └── demo-smoke.js                演示模式冒烟测试（可选，需 jsdom）
```

## 安装为 WorkBuddy Skill

```bash
# 用户级（所有项目可用）
cp -r strategy-board-skill ~/.workbuddy/skills/

# 或项目级（随仓库共享给团队）
cp -r strategy-board-skill <your-project>/.workbuddy/skills/
```

安装后，在对话中提到「搭一套战略项目看板」「生成项目周报」「检查看板有没有夹带内部数据」等即可触发。

## 快速开始

> 只想体验功能的话，上面的「30 秒上手」不需要做下面任何一步。本节讲的是**接入自己的云端**。

1. 复制 `assets/strategy-board/index.html` 到你的项目。
2. 编辑文件顶部的 `PUBLIC_CONFIG`：

   ```js
   const PUBLIC_CONFIG = {
     endpoint: "https://your-board.example.com",        // 改成实际部署地址（同源）
     oauthRelayBaseUrl: "https://www.workbuddy.cn/v2/as/genie-baas/oauth",
     publishableKey: "REPLACE_WITH_YOUR_PUBLISHABLE_KEY" // 换成自己的发布密钥
   };
   ```

   **只要 `publishableKey` 还是占位值，就一直是演示模式；填入真实值即自动切换回云端。** 可用 `?live=1` 强制云端、`?demo=1` 强制演示。

3. 按 [`references/setup.md`](references/setup.md) 建表并配置权限。
4. 把 `ROSTER_DEF` / `LEAD_OWNERS` 换成团队成员，清空 `DEMO` 示例数据。
5. 发布前自检：

   ```bash
   python3 scripts/check_secrets.py .
   node scripts/verify_template.js
   ```

## 依赖与限制

- **使用模板不需要任何依赖**：演示模式是内置的，浏览器打开即用。
- 云端模式内联了云服务 SDK，数据层按 **WorkBuddy 云应用 / PostgREST 风格接口**设计。脱离该平台时，需自行替换 `cloud.database.from(...)`、`cloud.auth` 与对象存储调用（见 [`setup.md`](references/setup.md) 第 6 节）。
- Office 文档预览依赖微软 Office Online 公共服务，内网环境需自行替换预览方案。
- 云端模式不含后端业务代码，权限边界依赖数据库的行级安全策略（RLS），部署前务必配置。
- 登录密码的「记住 30 天」是浏览器本地行为；公开部署请评估是否关闭该功能。

## 贡献

欢迎提交 Issue / PR。提交前请运行：

```bash
python3 scripts/check_secrets.py .
node scripts/verify_template.js
npm install --no-save jsdom && node scripts/demo-smoke.js
```

确保未夹带任何真实业务数据或凭证。

## 许可证

[MIT](LICENSE)
