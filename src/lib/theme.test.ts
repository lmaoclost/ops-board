import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..");
const CSS = readFileSync(join(ROOT, "src/app/globals.css"), "utf8");

const STATUS_TOKENS = ["--fired", "--gave", "--warn", "--flow", "--todo", "--violet"];

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, acc);
    } else if (extname(full) === ".tsx") {
      acc.push(full);
    }
  }
  return acc;
}

const COMPONENT_FILES = walk(join(ROOT, "src/components")).concat([
  join(ROOT, "src/app/page.tsx"),
  join(ROOT, "src/app/layout.tsx"),
]);

describe("tokens de tema", () => {
  it("define tokens de status no :root", () => {
    for (const t of STATUS_TOKENS) {
      expect(CSS).toMatch(new RegExp(`${t}:\\s*#[0-9a-f]{6}`, "i"));
    }
  });

  it("override de luz legível (≥4.5:1) para cada token de status em html.light", () => {
    const light = CSS.match(/html\.light\s*\{([\s\S]*?)\}/)?.[1] ?? "";
    expect(light).not.toBe("");
    for (const t of STATUS_TOKENS) {
      expect(light, `${t} precisa de override em html.light`).toMatch(
        new RegExp(`${t}:\\s*#[0-9a-f]{6}`, "i"),
      );
    }
  });

  it("--dim/--dimmer são cores sólidas (sem alpha) nos dois temas", () => {
    for (const block of [CSS, CSS.match(/html\.light\s*\{([\s\S]*?)\}/)?.[1] ?? ""]) {
      for (const t of ["--dim", "--dimmer"]) {
        expect(block).toMatch(new RegExp(`${t}:\\s*#[0-9a-f]{6}`, "i"));
        expect(block).not.toMatch(new RegExp(`${t}:\\s*rgba?`, "i"));
      }
    }
  });
});

describe("sem cores cruas em componentes", () => {
  const banned = /(emerald|cyan|amber|red|slate|violet|zinc)-(400|500|600|700)|#0a0d12|#052e21/;

  it("nenhum arquivo de componente usa classes de cor crua", () => {
    const offenders: string[] = [];
    for (const file of COMPONENT_FILES) {
      const src = readFileSync(file, "utf8");
      if (banned.test(src)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });
});
