# Relatório de Segurança — OWASP Top 10

> Auditoria OWASP Top 10 (2021) sobre o OpsBoard. App client-only: dados em `localStorage`, zero backend, zero rede no fluxo do usuário (ver `e2e/minimize.spec.ts`). Última auditoria: ago/2026.

## Resumo

| OWASP | Categoria | Status | Evidência |
|---|---|---|---|
| A01 | Broken Access Control | N/A — sem servidor/multiusuário | dados ficam no navegador do dono |
| A02 | Cryptographic Failures | Passa | CSP estrito; sem dados sensíveis; HSTS em produção |
| A03 | Injection | N/A — sem SQL/NoSQL/OS | input tratado como texto (XSS abaixo) |
| A04 | Insecure Design | Passa | arquitetura local-first (LGPD: dados nunca saem do navegador) |
| A05 | Security Misconfiguration | Passa | headers de segurança; `X-Powered-By` removido |
| A06 | Vulnerable Components | Passa | Dependabot semanal + `npm audit --audit-level=high` no CI |
| A07 | Authentication Failures | N/A — sem autenticação | nada autenticável no cliente |
| A08 | Software/Data Integrity | Passa | import validado (schema + limites + IDs únicos), persist versionado |
| A09 | Logging/Monitoring | Parcial | sem backend p/ logar; erros visíveis no console do navegador |
| A10 | SSRF | N/A — sem fetch server-side | nenhuma requisição externa existe no app |

## Verificação prática (Playwright probe)

- **Headers reais** (`/` e `/privacidade`): CSP `default-src 'self'` com `frame-ancestors 'none'` e `object-src 'none'`; `Strict-Transport-Security: max-age=63072000; includeSubDomains`; `X-Content-Type-Options: nosniff`; `X-Frame-Options: DENY`; `Referrer-Policy: no-referrer`; `Permissions-Policy` desliga câmera/mic/geo/pagamento/usb; sem `X-Powered-By`.
- **CSP runtime**: zero violações e zero erros de console no fluxo principal (`e2e/security.spec.ts`).
- **XSS persistido (tamper no localStorage)**: título e tarefa com `<img onerror>` / `<svg onload>` renderizam inertes; `window.__xss` nunca dispara (`e2e/xss.spec.ts` + probe manual).
- **Integridade do estado (tamper)**: `opsboard.v1` corrompido ou com `version` desconhecido não derruba o app — migração zera/ignora e segue (ver `src/lib/store.ts`).
- **Rede**: 100% same-origin (`e2e/minimize.spec.ts`); nada é enviado a terceiros.
- **Import de backup**: arquivos gigantes (>2 MB), estruturas inválidas, IDs duplicados e prioridades fora de 1–3 são rejeitados com mensagem clara (`src/lib/io.ts`).

## Notas e limites

- `script-src 'unsafe-inline'` é necessário ao ThemeScript (antiflash do next-themes) e `style-src 'unsafe-inline'` ao transform inline do dnd-kit; sem origens externas em ambos — comentado em `next.config.ts`.
- A09: sem backend não há log server-side. O que existe: estado versionado em `localStorage` (tratamento de dados rastreável por versão de schema, ver `docs/lgpd.md`) e erros no console do navegador.
- HSTS é emitido sempre, mas browsers só o aplicam sobre HTTPS; em produção (Vercel) cobre o domínio.
- A auditoria é manual + automatizada (e2e); não substitui teste de terceiros em ambiente real.
