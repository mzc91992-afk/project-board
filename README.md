# Strategy Board Skill · 战略项目动态看板

一套可复用的 **WorkBuddy Skill**：把「项目台账 → 优先级排序 → 时间线留痕 → 一键汇报」沉淀为模板、脚本与口径文档。核心产物是一份零构建、单文件的 HTML 看板，开箱即用。

> **隐私声明**：本仓库**不含任何真实业务数据**。项目记录、客户与合作伙伴名称、人员姓名、金额、内部部署地址、应用 ID、发布密钥、品牌 Logo 均已清除；仓库内所有示例数据（含 `DEMO` 数组与 `sample-data.json`）均为纯虚构内容。

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

## 目录结构

```
.
├── SKILL.md                          WorkBuddy 技能入口（含触发条件与工作流）
├── README.md / LICENSE / .gitignore
├── assets/
│   ├── strategy-board/index.html     单文件看板模板（已脱敏）
│   └── sample-data.json             虚构示例数据
├── references/
│   ├── setup.md                     配置、建表、部署
│   ├── data-model.md                数据结构与字段口径
│   └── reporting.md                 盘点与汇报口径
└── scripts/
    ├── check_secrets.py             发布前敏感信息自检
    └── verify_template.js           模板完整性静态校验
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

1. 复制 `assets/strategy-board/index.html` 到你的项目。
2. 编辑文件顶部的 `PUBLIC_CONFIG`：

   ```js
   const PUBLIC_CONFIG = {
     endpoint: "https://your-board.example.com",        // 改成实际部署地址（同源）
     oauthRelayBaseUrl: "https://www.workbuddy.cn/v2/as/genie-baas/oauth",
     publishableKey: "REPLACE_WITH_YOUR_PUBLISHABLE_KEY" // 换成自己的发布密钥
   };
   ```

3. 按 [`references/setup.md`](references/setup.md) 建表并配置权限。
4. 把 `ROSTER_DEF` / `LEAD_OWNERS` 换成团队成员，清空 `DEMO` 示例数据。
5. 发布前自检：

   ```bash
   python3 scripts/check_secrets.py .
   node scripts/verify_template.js
   ```

## 依赖与限制

- 模板内联了云服务 SDK，数据层按 **WorkBuddy 云应用 / PostgREST 风格接口**设计。脱离该平台使用时，需要自行替换 `cloud.database.from(...)`、`cloud.auth` 与对象存储调用。
- Office 文档预览依赖微软 Office Online 公共服务，内网环境需自行替换预览方案。
- 模板不含任何后端业务代码，权限边界依赖数据库的行级安全策略（RLS），部署前务必配置。
- 登录密码的「记住 30 天」是浏览器本地行为；公开部署请评估是否关闭该功能。

## 贡献

欢迎提交 Issue / PR。提交前请务必运行 `scripts/check_secrets.py`，确保未夹带任何真实业务数据或凭证。

## 许可证

[MIT](LICENSE)
