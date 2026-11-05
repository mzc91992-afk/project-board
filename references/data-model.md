# 数据结构与字段口径

> 字段清单从 `assets/strategy-board/index.html` 的读写代码推断，用于建表与二次开发。模板对部分列做了「老表缺列就退一步」的兼容处理，因此字段可按需增删，但**枚举值与空值语义必须保持一致**。

## 表清单

| 表 | 作用 | 关键关联 |
| --- | --- | --- |
| `projects` | 项目主表，一行一个项目 | 主键 `id` |
| `project_notes` | 项目状态动态、领导批注、需协调问题（用 `track` 区分） | `project_id` |
| `project_logs` | 进展记录 / 时间线流水 | `project_id` |
| `project_nexts` | 「下一步线索脉络」，提交式留痕 | `project_id` |
| `project_files` | 附件元数据（文件体在对象存储） | `project_id`, `path` |
| `app_settings` | 显示名、周期定义、列宽/行高、KPI 配置等 | 按 `key` 存取 |
| `presence` | 在线成员心跳（最近 5 分钟） | 用户 id |
| `app_diag` | 前端诊断上报，排查登录/同步问题 | — |
| `runtime` | 运行时对象存储路径解析 | — |

## projects 核心字段

| 字段 | 类型 | 含义 / 口径 |
| --- | --- | --- |
| `id` | bigint | 主键 |
| `name` | text | 项目名称，必填 |
| `category` | text | 项目类型，自由文本（如工程总包 / 运营服务 / 战略合作 / 新业务） |
| `horizon` | text | 周期：`short` / `mid` / `long`，支持自定义周期键 |
| `status` | text | `active` 进行中 / `paused` 暂缓 / `closed` 已关闭 / `draft` 草稿 |
| `stage` | text | 阶段，默认枚举见模板 `STAGES` |
| `counterparty` | text | 业主 / 合作方 |
| `contact_label` | text | 关键联系人 |
| `owner_label` | text | 负责人，多选时以分隔符拼接，**第一个为主要负责人** |
| `importance` / `urgency` | int 1–5 | 重要度 / 紧急度，决定四象限归属 |
| `amount_plan` / `amount_ytd` | numeric | 预计金额 / 今年已落地，单位统一为万元 |
| `landing_month` | text | 预计落地月份，格式 `YYYY-MM`；为空表示未定 |
| `summary` | text | 一句话简介 |
| `business_relation` | text | 商务关系整段说明 |
| `next_action` | text | 下一步动作 |
| `other_remark` | text | 其他备注 |
| `track` / `nav_col` | text | 业务主线 / 首页分类导航列 |
| `order_key` / `sort_key` | int | 拖动排序位次 |
| `next_action_at` | timestamptz | 下一步最近提交时间 |
| `boss_*` | text | 董事长关注 / 批注 / 审批 / 意见四类字段 |
| `created_at` / `updated_at` | timestamptz | 创建 / 最近更新 |
| `deleted_at` | timestamptz | 软删除标记，**非空不计入在手项目** |

## 时间线三类记录

- `project_notes`：用 `track` 区分「项目状态动态」「领导批注」「需协调问题」；`subst` 标记是否属于实质性推进；`author` 记录写入人；支持就地编辑并保留「已编辑」标记。
- `project_logs`：`content` + `owner_label`，按 `created_at` 倒序，是项目档案里的进展流水。
- `project_nexts`：打字不入库，**点提交才写入**，因此每条都带提交时间，用于「下一步线索脉络」。

## 口径约定（必须遵守）

1. 金额单位统一为万元；`amount_plan` 为 `NULL` 或 `0` 时展示「待定」，禁止估算。
2. `landing_month` 为空写「未定」，禁止按上下文推测。
3. `status = 'active'` 计为推进中，`paused` 计为暂缓；`deleted_at` 非空一律排除。
4. `importance` / `urgency` 每版从数据源重新读取，不得沿用上一版缓存值。
5. 只有本周在「项目状态动态」里写过内容才算「本周更新」；新建项目单独统计。
6. KPI 的「较上周」对比必须基于同一口径的上一周期快照，缺失时写 `±0` 并标注无基线。

## 建表骨架（PostgreSQL）

```sql
create table projects (
  id            bigint generated always as identity primary key,
  name          text not null,
  category      text,
  horizon       text default 'short',
  status        text default 'active',
  stage         text,
  counterparty  text,
  contact_label text,
  owner_label   text,
  importance    int  check (importance between 1 and 5),
  urgency       int  check (urgency between 1 and 5),
  amount_plan   numeric,
  amount_ytd    numeric,
  landing_month text,
  summary       text,
  business_relation text,
  next_action   text,
  other_remark  text,
  track         text,
  nav_col       text,
  order_key     int,
  sort_key      int,
  boss_note     text,
  boss_opinion  text,
  boss_approval text,
  boss_reply    text,
  next_action_at timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  deleted_at    timestamptz
);

create table project_notes (
  id         bigint generated always as identity primary key,
  project_id bigint not null references projects(id) on delete cascade,
  track      text,           -- status / note / coord
  content    text,
  author     text,
  subst      boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table project_logs (
  id         bigint generated always as identity primary key,
  project_id bigint not null references projects(id) on delete cascade,
  content    text,
  owner_label text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table project_nexts (
  id         bigint generated always as identity primary key,
  project_id bigint not null references projects(id) on delete cascade,
  content    text,
  author     text,
  created_at timestamptz default now()
);

create table project_files (
  id         bigint generated always as identity primary key,
  project_id bigint not null references projects(id) on delete cascade,
  name       text,
  path       text not null,
  size       bigint,
  created_at timestamptz default now()
);

create index on project_notes (project_id, created_at desc);
create index on project_logs  (project_id, created_at desc);
create index on project_files (project_id);
create index on projects (deleted_at, status);
```

`app_settings` / `presence` / `app_diag` / `runtime` 为辅助表，按模板中的读写字段创建即可；正式环境务必为所有表启用行级安全（RLS）并按登录用户隔离。
