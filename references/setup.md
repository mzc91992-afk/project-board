# 配置、建表与部署

## 三种运行方式

| 方式 | 怎么启动 | 需要什么 | 适用 |
| --- | --- | --- | --- |
| **演示模式（默认）** | 浏览器直接打开 `index.html` | 什么都没有 | 评估模板、给别人演示、试用全部交互 |
| 强制演示 | `index.html?demo=1` | 同上 | 已填好云端配置仍想试用本地数据 |
| 云端模式 | 填入真实 `publishableKey`（或 `?live=1`） | 数据服务、对象存储、登录、建表、部署 | 正式团队使用 |

模板靠 `PUBLIC_CONFIG.publishableKey` 是否为占位值 `REPLACE_WITH_YOUR_PUBLISHABLE_KEY` 自动判断，业务代码无需改动。演示模式把 `cloud` 换成本地数据层：数据存 `localStorage`（不可用时退内存）、免登录、自动载入虚构示例、全程不发对外请求；附件限 1 MB，不支持多设备同步与多人在线。

地址栏参数：`?demo=1` 强制演示、`?reset=demo` 清空本机演示数据、`?live=1` 强制云端。

> 只想看功能，到这一步就够了。下面是**接入真实云端**的步骤。

## 0. 前置条件

- 一个可托管静态 HTML 的站点（模板是单文件，无构建步骤）。
- 一套可提供 PostgREST 风格 REST 接口的数据服务、对象存储与邮箱验证码登录。
- 模板内联了 WorkBuddy 云服务 SDK；若使用其他后端，需要替换 `cloud.database.from(...)`、`cloud.auth` 与存储调用（见第 6 节）。

## 1. 配置 `PUBLIC_CONFIG`

打开 `assets/strategy-board/index.html`，找到文件前部的配置块：

```js
const PUBLIC_CONFIG = {
  endpoint: "https://your-board.example.com",
  oauthRelayBaseUrl: "https://www.workbuddy.cn/v2/as/genie-baas/oauth",
  publishableKey: "REPLACE_WITH_YOUR_PUBLISHABLE_KEY"
};
```

| 键 | 说明 |
| --- | --- |
| `endpoint` | **必改**。填实际部署站点地址，且与页面同源；模板用它做同源判断、数据请求基址和「修正访问地址」跳转 |
| `oauthRelayBaseUrl` | 平台公共 OAuth 中继地址；自建后端时替换成自己的授权端点 |
| `publishableKey` | **必改**。填自己的发布密钥。这是可公开的 publishable key，不是服务端私钥；私钥永远不要写进前端 |

**保持占位值 = 演示模式；填入真实值 = 自动关闭演示模式、连接云端。** 调试时可用 `?live=1` / `?demo=1` 临时覆盖。

> 安全提示：把改好配置的文件命名为 `index.local.html` 并加入 `.gitignore`，避免把真实配置推到公开仓库。仓库内的模板永远保持占位值。

## 2. 建表

按 [`data-model.md`](data-model.md) 的 SQL 骨架创建 `projects`、`project_notes`、`project_logs`、`project_nexts`、`project_files`，以及 `app_settings`、`presence`、`app_diag`、`runtime` 四张辅助表。

要点：

- 所有业务表启用 **RLS**，按登录用户隔离；附件表同时限制对象存储的读写前缀。
- `projects.deleted_at` 走软删除，回收站与「彻底删除」是两条不同路径，别用物理删除覆盖。
- 模板对「老表缺少 `updated_at` 等列」有降级兼容，但新部署建议一次建全。

## 3. 配置登录

- 模板支持邮箱 + 密码、邮箱验证码注册、微信授权（如平台支持）三种入口。
- 「记住登录 30 天」把凭据存在浏览器本地；面向公网部署时，建议评估是否关闭该能力。
- 登录态失效时模板会自动清理会话并尝试静默重登，失败则回到登录页并提示重新输入密码。

## 4. 定制品牌与人员

| 位置 | 作用 |
| --- | --- |
| `<title>` / `<h1>` / `.sub` | 页面标题与首页抬头 |
| `#brandLogo` | 品牌图：模板里是 1×1 透明占位，换成自己的 Logo（建议外链而非内联大 base64） |
| `ROSTER_DEF` | 负责人 / 批注人的可选名单 |
| `LEAD_OWNERS` | 首页「领导样例版式」的人员列 |
| `LEAD_COLS` / 分类导航配置 | 首页三列版式与分类标签 |
| `STAGES` / `STATUS` | 阶段与状态枚举 |
| `TBL_HEADS` | 明细表列头 |
| `DEMO` | 虚构示例数据，**正式环境置空 `[]`** 并隐藏 `#btnSeed` |
| 导出行 / 汇报模板 | `.xlsx` 与 `.md` 文件名前缀、汇报抬头 |

## 5. 部署与发布

1. 把配置好的 HTML 部署到静态站点，确保 `endpoint` 与站点同源（否则模板会弹出「访问地址不对」的修正提示）。
2. 用最小权限账号跑一遍冒烟：登录 → 新建项目 → 编辑自动保存 → 拖四象限 → 传附件 → 导出 Excel / Markdown → 回收站恢复。
3. 发布前执行：

   ```bash
   python3 scripts/check_secrets.py .
   node scripts/verify_template.js
   ```

4. 若要开源，只推送**占位配置版**模板，并在 README 中保留隐私声明。

## 6. 换后端

数据访问集中在 `q(...)` 与 `cloud.database.from(table)` 链上，认证集中在 `cloud.auth`，附件集中在 `cloud.storage`。替换步骤：

1. 实现同名的 `cloud` 门面（或批量改写调用点），保持 `select / insert / update / delete / eq / in / order / limit` 链式语义。
2. 实现 `getSession`、`signInWithPassword`、`signOut`、`onAuthStateChange`。
3. 实现附件的上传、签名下载与删除；预览可用任意在线文档预览服务或自建转换服务。
4. 保留 `app_diag` 的上报开关，便于线上排障；不需要时把 `diagPush` 改为空实现。

## 7. 常见问题

| 现象 | 排查 |
| --- | --- |
| 白屏 | 浏览器太老（模板对 Trident 有兜底）；或 `PUBLIC_CONFIG` 有语法错误，用 `node scripts/verify_template.js` 检查 |
| 一致提示「访问地址不对」 | `endpoint` 与当前站点不同源 |
| 数据读得到但传不了附件 | 存储桶权限 / 签名 URL 未配置，或跨源请求头被拦 |
| 登录后立刻掉线 | 会话令牌轮换；模板会清理本机失效凭据并要求重新登录 |
| 附件预览空白 | Office 在线预览服务在内网不可达，改用「新标签打开」或自建预览 |
