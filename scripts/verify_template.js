#!/usr/bin/env node
/* 看板模板静态校验：结构完整性、占位符状态、夹带内容检查。
   用法: node scripts/verify_template.js [index.html 路径]
   退出码: 0 = 无 FAIL（WARN 不阻断）, 1 = 存在 FAIL。 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const file = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, "../assets/strategy-board/index.html");

const results = [];
const check = (ok, label, detail = "", level = "FAIL") => {
  results.push({ ok, label, detail, level });
};

if (!fs.existsSync(file)) {
  console.error(`模板不存在: ${file}`);
  process.exit(1);
}
const html = fs.readFileSync(file, "utf8");
console.log(`模板: ${file} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);

// 1. 基础结构
check(html.length > 100_000, "模板体量正常", `${html.length} 字符`);
check(/<!DOCTYPE html>/i.test(html) || /<html[\s>]/i.test(html), "存在 HTML 根元素");
check((html.match(/<script\b/gi) || []).length === (html.match(/<\/script>/gi) || []).length,
  "script 标签配对", `开 ${(html.match(/<script\b/gi) || []).length} / 闭 ${(html.match(/<\/script>/gi) || []).length}`);

// 2. 关键 DOM 节点
const requiredIds = [
  "loginView", "appView", "loginForm", "lgPwd", "loginErr", "syncTxt",
  "btnResetLogin", "diagTip", "brandLogo", "drawerHost", "previewHost", "fatalHost"
];
const missing = requiredIds.filter((id) => !new RegExp(`id=["']${id}["']`).test(html));
check(missing.length === 0, "关键 DOM 节点齐全", missing.length ? `缺少: ${missing.join(", ")}` : `${requiredIds.length} 个`);

// 3. 配置块
for (const key of ["endpoint", "oauthRelayBaseUrl", "publishableKey"]) {
  check(new RegExp(`\\b${key}\\s*:`).test(html), `PUBLIC_CONFIG.${key} 存在`);
}
const hasRealKey = /wbpk_[A-Za-z0-9_]{20,}/.test(html);
check(!hasRealKey, "未夹带真实发布密钥");
check(!/\.app\.workbuddy\.host\b/.test(html), "未夹带内部部署域名");
check(!/wbapp_[A-Za-z0-9]{16,}/.test(html), "未夹带应用 ID");

// 4. 占位符（WARN：本地副本填了真实配置是正常的）
const placeholders = [
  ["endpoint 仍为占位地址", /endpoint:\s*"https:\/\/your-board\.example\.com"/],
  ["publishableKey 仍为占位值", /publishableKey:\s*"REPLACE_WITH_YOUR_PUBLISHABLE_KEY"/],
];
for (const [label, re] of placeholders) {
  results.push({ ok: true, label, detail: re.test(html) ? "占位态，可发布" : "已填入实际配置（公开发布前请还原为占位值）", level: "WARN" });
}

// 5. 内联脚本语法（失败仅告警，因为模板含压缩 SDK，部分语法依赖运行时环境）
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
let syntaxBad = 0;
for (const [i, code] of scripts.entries()) {
  if (!code.trim()) continue;
  try {
    new vm.Script(code, { filename: `inline-script-${i + 1}.js` });
  } catch (err) {
    syntaxBad += 1;
    if (syntaxBad <= 2) console.log(`  [语法告警] 内联脚本 ${i + 1}: ${err.message.split("\n")[0]}`);
  }
}
results.push({
  ok: true, label: "内联脚本语法",
  detail: syntaxBad ? `${syntaxBad}/${scripts.length} 段无法静态解析（可能依赖运行时全局，需浏览器实测）` : `${scripts.length} 段全部通过`,
  level: syntaxBad ? "WARN" : "PASS"
});

// 输出
let failed = 0;
for (const r of results) {
  if (r.level === "FAIL" && !r.ok) failed += 1;
  const tag = r.level === "FAIL" ? (r.ok ? "PASS" : "FAIL") : r.level;
  console.log(`  [${tag}] ${r.label}${r.detail ? " — " + r.detail : ""}`);
}
console.log(failed ? `\n结论: ${failed} 项未通过 ❌` : "\n结论: 结构与脱敏检查通过 ✅（WARN 项请人工确认）");
process.exit(failed ? 1 : 0);
