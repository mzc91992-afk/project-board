#!/usr/bin/env python3
"""发布前敏感信息自检。

用法:
    python3 check_secrets.py <文件或目录> [--terms-file FILE] [--quiet]

默认扫描当前目录。可通过 --terms-file 传入自定义敏感词表（每行一个词，
# 开头为注释），用于检查组织内部的项目名、客户名、人员姓名等——
词表本身请不要提交到公开仓库。

退出码: 0 = 未发现可疑内容, 1 = 发现命中, 2 = 参数错误。
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

RULES: list[tuple[str, re.Pattern[str]]] = [
    ("云应用发布密钥", re.compile(r"wbpk_[A-Za-z0-9_]{20,}")),
    ("云应用 ID", re.compile(r"wbapp_[A-Za-z0-9]{16,}")),
    ("通用 API Token", re.compile(r"\b(?:sk|ghp|gho|ghu|ghs|glpat|AKIA|AIza)[-_][A-Za-z0-9]{16,}")),
    ("私钥块", re.compile(r"-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----")),
    ("托管部署域名", re.compile(r"\.app\.workbuddy\.host\b")),
    ("本机绝对路径", re.compile(r"(?:/Users/|/home/|[A-Z]:\\Users\\)[A-Za-z0-9_.-]+[/\\]")),
    ("非示例邮箱", re.compile(
        r"[A-Za-z0-9._%+-]+@(?!(?:example\.(?:com|org|net)|invalid|localhost|test))"
        r"[A-Za-z0-9.-]+\.[A-Za-z]{2,}")),
    ("内联大图", re.compile(r"data:image/[^;]+;base64,[A-Za-z0-9+/=]{500,}")),
    ("硬编码 Bearer 凭据", re.compile(r'Bearer\s+[A-Za-z0-9._-]{24,}')),
]

TEXT_SUFFIXES = {
    ".html", ".htm", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".json",
    ".md", ".markdown", ".txt", ".yml", ".yaml", ".toml", ".ini", ".cfg",
    ".py", ".sh", ".css", ".sql", ".xml", ".env", ".example",
}
SKIP_DIRS = {".git", "node_modules", "__pycache__", "dist", "build", ".venv", "venv"}
SKIP_FILES = {"package-lock.json", "yarn.lock", "pnpm-lock.yaml"}
MAX_BYTES = 3_000_000


def iter_files(target: Path):
    if target.is_file():
        yield target
        return
    for path in sorted(target.rglob("*")):
        if not path.is_file() or path.name in SKIP_FILES:
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.suffix.lower() in TEXT_SUFFIXES or path.name.startswith(".env"):
            yield path


def load_terms(path: Path | None) -> list[str]:
    if not path:
        return []
    if not path.is_file():
        raise FileNotFoundError(f"词表不存在: {path}")
    return [
        line.strip() for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    ]


def main() -> int:
    ap = argparse.ArgumentParser(description="发布前敏感信息自检")
    ap.add_argument("target", nargs="?", default=".", help="文件或目录，默认当前目录")
    ap.add_argument("--terms-file", type=Path, help="自定义敏感词表（每行一个词）")
    ap.add_argument("--quiet", action="store_true", help="只输出命中与结论")
    args = ap.parse_args()

    target = Path(args.target)
    if not target.exists():
        print(f"路径不存在: {target}", file=sys.stderr)
        return 2
    try:
        custom_terms = load_terms(args.terms_file)
    except (OSError, UnicodeDecodeError) as exc:
        print(f"读取词表失败: {exc}", file=sys.stderr)
        return 2

    findings: list[tuple[str, int, str, str]] = []
    scanned = 0
    for path in iter_files(target):
        try:
            if path.stat().st_size > MAX_BYTES:
                continue
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        scanned += 1
        for lineno, line in enumerate(text.splitlines(), 1):
            for label, pattern in RULES:
                if pattern.search(line):
                    snippet = line.strip()[:100]
                    findings.append((str(path), lineno, label, snippet))
            for term in custom_terms:
                if term in line:
                    findings.append((str(path), lineno, f"自定义词: {term}", line.strip()[:100]))

    if not args.quiet:
        print(f"扫描文件: {scanned} 个")
        if custom_terms:
            print(f"自定义敏感词: {len(custom_terms)} 个")
    if findings:
        print(f"\n发现 {len(findings)} 处可疑内容:")
        for path, lineno, label, snippet in findings[:60]:
            print(f"  {path}:{lineno}  [{label}]  {snippet}")
        if len(findings) > 60:
            print(f"  ... 另有 {len(findings) - 60} 处")
        print("\n结论: 未通过 ❌ 请清理后再发布")
        return 1
    print("结论: 未发现可疑内容 ✅")
    return 0


if __name__ == "__main__":
    sys.exit(main())
