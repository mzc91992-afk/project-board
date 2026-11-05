#!/usr/bin/env node
/* 演示模式冒烟测试（可选的开发自检，使用模板不需要装任何依赖）
   依赖：npm install jsdom
   运行：node scripts/demo-smoke.js
   验证：占位配置自动进入演示模式、免登录渲染示例数据、CRUD 可用、
        刷新后数据仍在、全程不产生对外请求、?live=1 不进演示模式。 */
"use strict";

const fs = require("fs");
const path = require("path");

let JSDOM, VirtualConsole;
try {
  ({ JSDOM, VirtualConsole } = require("jsdom"));
} catch (e) {
  console.error("缺少 jsdom：请先运行  npm install jsdom  （仅开发自检需要）");
  process.exit(2);
}

const HTML = fs.readFileSync(
  path.resolve(__dirname, "../assets/strategy-board/index.html"), "utf8");
const wait = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
function T(name, ok, extra) {
  if (ok) { pass++; console.log("  PASS " + name); }
  else { fail++; console.log("  FAIL " + name + (extra !== undefined ? "  << " + extra : "")); }
}

function makeDom(url, seedStorage) {
  const requests = [];
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", e => errors.push(String(e && (e.message || e))));
  const dom = new JSDOM(HTML, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    url: url || "http://localhost/index.html",
    virtualConsole: vc,
    beforeParse(w) {
      Object.defineProperty(w.navigator, "userAgent",
        { value: "Mozilla/5.0 Chrome/130", configurable: true });
      w.fetch = async u => {
        requests.push(String(u));
        return { ok: true, status: 200, text: async () => "[]", json: async () => [] };
      };
      w.document.elementFromPoint = () => null;
      if (w.URL) {
        w.URL.createObjectURL = () => "blob:demo";
        w.URL.revokeObjectURL = () => {};
      }
      w.alert = () => {};
      if (seedStorage) {
        for (const k of Object.keys(seedStorage)) w.localStorage.setItem(k, seedStorage[k]);
      }
    }
  });
  return { dom, w: dom.window, requests, errors };
}

(async () => {
  console.log("=== 1. 占位配置 → 自动进入演示模式 ===");
  const a = makeDom();
  await wait(900);
  const w = a.w, doc = w.document;
  T("SB_DEMO 已开启", w.SB_DEMO === true, w.SB_DEMO);
  T("跳过登录页", doc.getElementById("loginView").classList.contains("hide"));
  T("主界面已显示", !doc.getElementById("appView").classList.contains("hide"));
  T("演示提示卡出现", !!doc.getElementById("sbDemoBar"));
  const bodyText = doc.body.textContent || "";
  T("渲染出虚构示例项目", bodyText.includes("示例园区"), bodyText.slice(0, 80));

  let stored = null;
  try { stored = JSON.parse(w.localStorage.getItem("sb_demo_db_v1")); } catch (e) {}
  T("数据已落本机", !!stored && Array.isArray(stored.projects));
  T("示例项目数 = 10", stored && stored.projects.length === 10,
    stored && stored.projects.length);
  T("未产生任何对外请求", a.requests.length === 0, a.requests.slice(0, 3));
  T("没有未捕获的脚本错误", a.errors.length === 0, a.errors.slice(0, 2));

  console.log("\n=== 2. 增删改查与视图 ===");
  const inserted = await w.eval(`(async function(){
    var r = await cloud.database.from("projects").insert([
      { name: "冒烟测试项目", category: "新业务", horizon: "short",
        status: "active", importance: 5, urgency: 5, amount_plan: 0 }
    ]);
    return r && !r.error && r.data && r.data.length === 1 ? r.data[0].id : 0;
  })()`);
  T("新建项目返回自增 id", Number(inserted) > 0, inserted);
  await w.eval("refresh()");
  await wait(250);
  T("新项目出现在界面", (doc.body.textContent || "").includes("冒烟测试项目"));

  const upd = await w.eval(`(async function(){
    var r = await cloud.database.from("projects")
      .update({ summary: "已改" }).eq("id", ${Number(inserted)}).select();
    return r && !r.error && r.data && r.data[0] && r.data[0].summary;
  })()`);
  T("更新项目生效", upd === "已改", upd);

  const filtered = await w.eval(`(async function(){
    var r = await cloud.database.from("projects").select("*").eq("id", ${Number(inserted)});
    return r.data.length;
  })()`);
  T("条件查询生效", filtered === 1, filtered);

  const del = await w.eval(`(async function(){
    var r = await cloud.database.from("projects").delete().eq("id", ${Number(inserted)});
    return r.data.length;
  })()`);
  T("删除项目生效", del === 1, del);

  const viewOk = await w.eval(`(function(){
    try { S.view = "quad"; render(); S.view = "table"; render(); S.view = "cats"; render(); return true; }
    catch (e) { return String(e && e.message || e); }
  })()`);
  T("四象限 / 明细表 / 首页三视图可渲染", viewOk === true, viewOk);

  const dbSnapshot = w.localStorage.getItem("sb_demo_db_v1");
  a.dom.window.close();

  console.log("\n=== 3. 刷新后数据仍在（本机持久化）===");
  const b = makeDom("http://localhost/index.html", { sb_demo_db_v1: dbSnapshot });
  await wait(900);
  const cnt = await b.w.eval("S.projects.length");
  T("刷新后项目数仍为 10", cnt === 10, cnt);
  T("刷新后仍无对外请求", b.requests.length === 0, b.requests.slice(0, 3));
  b.dom.window.close();

  console.log("\n=== 4. ?live=1 不进入演示模式 ===");
  const c = makeDom("http://localhost/index.html?live=1");
  await wait(500);
  T("SB_DEMO 关闭", c.w.SB_DEMO === false, c.w.SB_DEMO);
  c.dom.window.close();

  console.log(`\n结果: ${pass} 项通过 / ${fail} 项失败`);
  process.exit(fail ? 1 : 0);
})().catch(e => {
  console.error("测试异常:", e && (e.stack || e));
  process.exit(1);
});
