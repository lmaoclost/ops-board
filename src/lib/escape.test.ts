import { describe, expect, it } from "vitest";
import { esc, linkify } from "./escape";

describe("esc", () => {
  it("escapa HTML e aspas", () => {
    expect(esc(`<script>alert(1)</script>`)).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(esc(`"aspas" 'simples'`)).toBe("&quot;aspas&quot; &#39;simples&#39;");
    expect(esc("a & b")).toBe("a &amp; b");
  });

  it("trata null/undefined como string vazia", () => {
    expect(esc(null)).toBe("");
    expect(esc(undefined)).toBe("");
  });
});

describe("linkify", () => {
  it("transforma http/https em link com rel seguro", () => {
    const out = linkify("veja https://exemplo.com/x e http://a.b");
    expect(out).toContain('<a href="https://exemplo.com/x" target="_blank" rel="noopener noreferrer">https://exemplo.com/x</a>');
    expect(out).toContain('<a href="http://a.b" target="_blank" rel="noopener noreferrer">http://a.b</a>');
  });

  it("não vira link para protocolos perigosos", () => {
    expect(linkify("javascript:alert(1)")).not.toContain("<a ");
    expect(linkify("data:text/html,<b>x</b>")).not.toContain("<a ");
    expect(linkify("vbscript:x")).not.toContain("<a ");
  });

  it("escapa HTML ao redor da URL", () => {
    const out = linkify(`<img src=x onerror=alert(1)> https://ok.com`);
    expect(out).not.toContain("<img");
    expect(out).not.toContain("<script");
    expect(out).toContain("<a href=\"https://ok.com\"");
  });

  it("URL com aspas não quebra o atributo href", () => {
    const out = linkify('https://exemplo.com/" onmouseover="alert(1)');
    expect(out).not.toContain('onmouseover="');
  });
});