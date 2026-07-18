#!/usr/bin/env node
// scripts/verify.mjs — UnderWrite one-shot verification.
// Runs the pnpm scripts that exist (lint, typecheck, test, build) in order.
// Gracefully skips scripts not yet defined (repo grows task by task).
import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const order = ["lint", "typecheck", "test", "build"];

if (!existsSync("package.json")) {
  console.log("verify: package.json not present yet — scaffold (T01) pending. Nothing to run.");
  process.exit(0);
}

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const scripts = pkg.scripts ?? {};
const toRun = order.filter((s) => scripts[s]);

if (toRun.length === 0) {
  console.log("verify: no lint/typecheck/test/build scripts defined yet. Nothing to run.");
  process.exit(0);
}

let failed = 0;
for (const s of toRun) {
  console.log(`\n=== pnpm ${s} ===`);
  try {
    execSync(`pnpm ${s}`, { stdio: "inherit" });
    console.log(`✓ ${s} passed`);
  } catch {
    console.log(`✗ ${s} failed`);
    failed++;
  }
}

console.log(`\n${failed === 0 ? "verify: ALL PASSED" : `verify: ${failed} step(s) FAILED`}`);
process.exit(failed === 0 ? 0 : 1);
