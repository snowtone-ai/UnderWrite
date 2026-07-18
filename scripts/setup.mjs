#!/usr/bin/env node
// scripts/setup.mjs — UnderWrite initial setup check.
// Confirms toolchain + env template presence. Safe to run repeatedly.
import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const ok = (m) => console.log(`  ✓ ${m}`);
const warn = (m) => console.log(`  ! ${m}`);
let problems = 0;

console.log("UnderWrite setup check\n");

// 1. Toolchain
for (const [name, cmd] of [
  ["node", "node --version"],
  ["pnpm", "pnpm --version"],
  ["git", "git --version"],
]) {
  try {
    const v = execSync(cmd, { encoding: "utf8" }).trim();
    ok(`${name}: ${v}`);
  } catch {
    warn(`${name} not found`);
    problems++;
  }
}

// 2. Env template + local env presence
if (existsSync(".env.example")) ok(".env.example present");
else {
  warn(".env.example missing");
  problems++;
}
if (existsSync(".env.local")) {
  ok(".env.local present");
} else {
  warn(".env.local missing — copy from .env.example and fill values");
}

// 3. Required env keys declared in template
if (existsSync(".env.example")) {
  const required = ["AI_PROVIDER", "GEMINI_API_KEY", "NEXT_PUBLIC_SUPABASE_URL"];
  const tpl = readFileSync(".env.example", "utf8");
  for (const key of required) {
    if (tpl.includes(`${key}=`)) ok(`env template declares ${key}`);
    else {
      warn(`env template missing ${key}`);
      problems++;
    }
  }
}

console.log(`\n${problems === 0 ? "Setup check passed." : `Setup check: ${problems} problem(s).`}`);
process.exit(problems === 0 ? 0 : 1);
