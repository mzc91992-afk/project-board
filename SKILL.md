---
name: strategy-board-skill
description: 搭建、定制与维护「战略项目动态看板」，以及基于看板数据生成项目盘点与汇报。适用于需要为团队建立项目台账、四象限优先级看板、时间线动态、进度周报，或需要按统一口径汇总在手项目、识别逾期与零进展项目的场景。内含一份单文件看板模板（占位配置自动进入零配置演示模式，双击即用）、数据表结构说明、发布前脱敏自检脚本与汇报口径指南。触发词：战略看板、项目看板、项目台账、优先级象限、项目周报、项目盘点、进展汇总、四象限、看板搭建、演示模式。This skill should be used when a user wants to create or customize a strategy project board, or produce a project status report from board data.
agent_created: true
---

# 战略项目动态看板

## 概述

把「项目台账 → 优先级排序 → 时间线留痕 → 一键汇报」这一整套工作流沉淀为可复用资产。核心是一份零依赖的单文件 HTML 看板模板：内置登录、云端数据读写、看板/四象限/明细表/分类导航四种视图、时间线与批注、附件预览、Excel 与 Markdown 导出。模板中所有业务数据均已清除，示例数据为纯虚构内容。

模板内置**零配置演示模式**：`publishableKey` 保持占位值时自动启用本地数据层，免登录、免建表、免服务器，浏览器直接打开即可完整试用；填入真实密钥后自动切回云端。

## 何时使用

- 只想快速看一眼看板长什么样、能不能满足需求（直接演示模式，无需任何配置）
- 从零搭建一套团队项目看板，或把现有台账迁移到看板视图
- 定制字段、视图、人员名单、分类与周期口径
- 按统一口径生成项目盘点、周报、逾期事项清单
- 在公开/开源之前检查看板是否夹带内部数据或凭证

## 工作流决策树

| 意图 | 动作 |
| --- | --- |
| 零配置试用 / 给用户演示 | 直接用浏览器打开 `assets/strategy-board/index.html`，无需任何步骤 |
| 搭一套新看板 | 复制 `assets/strategy-board/index.html`，按 `references/setup.md` 完成配置与建表 |
| 改字段 / 加视图 / 换人员名单 | 查 `references/data-model.md`，定位模板中的 `ROSTER_DEF`、`LEAD_OWNERS`、`TBL_HEADS`、`STAGES` |
| 生成盘点或周报 | 按 `references/reporting.md` 的口径与结构输出，不虚构金额与日期 |
| 发布或开源前自检 | 运行 `scripts/check_secrets.py` 与 `scripts/verify_template.js` |
| 验证演示模式确实能跑 | 运行 `scripts/demo-smoke.js`（可选，需 jsdom） |

## 零配置体验

1. 把 `assets/strategy-board/index.html` 交给用户，让其在浏览器中直接打开（本地文件亦可）。
2. 页面自动进入演示模式，载入 10 条纯虚构示例项目；四种视图、增删改、拖放、导出均可操作。
3. 数据存本机 `localStorage`，刷新不丢；右下角提示卡可「重置演示数据」。
4. 地址栏参数：`?demo=1` 强制演示、`?reset=demo` 清空本机数据、`?live=1` 强制走云端。

演示模式不产生任何对外请求；附件限 1 MB，且不支持多设备同步与多人在线。

## 搭建步骤（接入真实云端）

1. 读取 `references/setup.md`，确认目标环境的数据服务与登录方式。
2. 复制 `assets/strategy-board/index.html` 到目标目录，替换 `PUBLIC_CONFIG` 中的 `endpoint` 与 `publishableKey` 占位值——**这一步同时关闭了演示模式**。
3. 按 `references/setup.md` 的建表脚本创建数据表，并配置行级权限。
4. 把 `ROSTER_DEF` 与 `LEAD_OWNERS` 替换为团队实际成员；把首页标题、导出文件名改成自己的品牌。
5. 删除或替换 `DEMO` 数组中的虚构示例；正式环境建议将 `DEMO` 置空并隐藏「载入示例项目」按钮。
6. 部署为静态站点，令 `endpoint` 与站点同源；运行两个自检脚本后再对外发布。

## 汇报步骤

1. 从数据源重新读取全部字段，**不得沿用上一版取值**（重要度、紧急度、金额、落地月份尤其如此）。
2. 按 `references/reporting.md` 的口径清洗：金额单位统一、空值写「待定/未定」、`deleted_at` 非空排除、状态按枚举归一。
3. 输出「本期变化 → 在手盘面 → 逾期事项 → 需决策事项 → 资源冲突提示」五段式结构。
4. 严格区分「数据未回填」「形式/薄回填」「进展为零」三种状态，不混为一谈。

## 硬约束

- 金额未填写或为 0 时一律写「待定」，禁止估算；落地月份为空写「未定」，禁止推测。
- 新版本整体覆盖旧版本，不保留历史差异表，除非用户明确要求对比。
- 模板中的 `DEMO` 为虚构示例，绝不可当作真实项目引用；**演示模式里用户自己录入的数据也只在本机，不是正式台账**。
- 对外发布前必须运行脱敏自检；任何真实凭证、内部域名、客户名称、人员姓名都不得出现在交付物中。
- 仓库内的模板永远保持占位配置，真实密钥只写在本地 `index.local.html`（已 gitignore）。

## 资源索引

| 路径 | 用途 |
| --- | --- |
| `assets/strategy-board/index.html` | 单文件看板模板（已脱敏，内置零配置演示模式） |
| `assets/sample-data.json` | 3 条虚构示例记录，用于验证导入格式 |
| `references/setup.md` | 配置、建表、部署与发布步骤 |
| `references/data-model.md` | 数据表结构与字段口径 |
| `references/reporting.md` | 汇报口径、状态区分、五段式模板 |
| `scripts/check_secrets.py` | 发布前敏感信息自检 |
| `scripts/verify_template.js` | 模板完整性、占位符与演示模式静态校验 |
| `scripts/demo-smoke.js` | 演示模式冒烟测试（可选，需 jsdom） |
