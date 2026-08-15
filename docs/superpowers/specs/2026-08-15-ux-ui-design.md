# OpsBoard — UX/UI: Refino de identidade + fundação a11y (programa de 4 issues)

Data: 2026-08-15 · Escopo: programa em 4 issues sequenciais (A→D), cada uma com PR próprio, TDD (unit vitest + e2e Playwright), CI gate `check`, merge squash após aprovação do usuário.

## Contexto

Auditoria dual-agent (impeccable critique + audit técnico): Health 13/20, Nielsen 27/40. Identidade terminal executada com coerência (manter). Problemas: tema claro quebra contraste (1.5–2.8:1), sem undo/confirmação em dados, confete no momento errado, atalho "n" morto, kanban é beco sem saída, `--dim/--dimmer` ilegíveis, console errors base-ui.

## Issue A — Fundação visual/a11y

**Tokens de status por tema** (novos `--todo`, `--violet`; overrides em `html.light`):

| Token | dark | light |
|-------|------|-------|
| `--fired` (done) | `#34d399` (10.12:1) | `#047857` (4.98) |
| `--flow` (doing) | `#22d3ee` | `#0e7490` (4.86) |
| `--warn` (waiting) | `#fbbf24` | `#b45309` (4.56) |
| `--gave` (blocked) | `#f87171` | `#b91c1c` (5.87) |
| `--todo` | `#94a3b8` | `#475569` (6.88) |
| `--violet` (arquivados) | `#a78bfa` | `#7c3aed` (5.17) |

**`--dim/--dimmer` sólidos** (hierarquia preservada, interativo ≥4.5:1): dark `#7d8a9c`/`#707c8c`; light `#5b6572`/`#64707f`.

**Migrações**:
- Cores cruas → tokens: FilterChips (cls chips, violet), Stats (pendentes/concluídas/hoje/prio), TaskRow (LED, prio, due), Kanban (colunas), Section (outline drag), Topbar (`##`, `>`).
- `bg-red-500 hover:bg-red-600` (page.tsx "apagar tudo") → variant destrutiva; `text-[#0a0d12]` (Board CTA) → `text-primary-foreground`; `border-zinc-600`/`decoration-zinc-700` → tokens.
- Console errors base-ui: `render={<Link/>}` com `nativeButton={false}` (Topbar.tsx privacidade, PrivacyNotice).

**Hierarquia**: task text 12.5→13px, badges 10→11px, LED com hit-area ≥24px (wrapper com padding, dot 8px), touch targets xs≥28px onde viável.

## Issue B — Prevenção de perda de dados

- **Undo**: middleware de snapshot no store (zustand), stack sessão-only (~50), push antes de mutações de dados (add/rename/delete/move/toggle/import), `undo()` + `canUndo`. Atalho `Ctrl+Z`/`⌘Z` com guard: não interceptar quando foco em input/textarea. Toast "desfeito".
- **Import**: dialog de confirmação (padrão do wipe-all): "importar substitui os N projetos atuais? exporte um backup antes".
- **Delete tarefa/seção/projeto**: protegidos por undo; remover `window.confirm` do projeto (consistência).

## Issue C — Feedback e ajuda

- **Confete**: disparar na transição was→done dentro de `toggleTask`/`setTaskStatus` (via wrapper nas taskActions da página, olhando o estado antes), remover useEffect derivado de `stats.done` (page.tsx:67-70).
- **Atalho "n"**: foca o primeiro input `aria-label="nova tarefa"` visível (+ scrollIntoView).
- **Ajuda**: "?" abre Modal persistente com tabela de atalhos e dicas de drag (substitui toast 1.6s).
- **Hints corretos**: "status-dock" → descrever o que existe (lista: arraste entre seções/projetos; kanban: arraste entre colunas).
- **Toasts**: `role="status"` + `aria-live="polite"`, duração 2.5s, sem sobrepor footer (posição acima).

## Issue D — Fluxos que travam

- **Kanban rico**: cards mostram prio (P1–P3 com cor), due (overdue/duesoon destacados), blocked glyph, indicador de nota; clique no card abre o Modal de edição (mesmos campos do list). Kanban recebe prop de edit.
- **Empty state de filtro**: "nada casa com o filtro." ganha CTA "✕ limpar filtros" (Board recebe `onClear`).
- **Drag em lista**: droppable no fim da seção → `resolveDrop` append no final (hoje só insere antes de overTid ou index 0).
- **Section header**: `role="button"` div → `<button>` nativo com `aria-expanded`; `stopPropagation` também no keydown do dropdown trigger (Enter não colapsa a seção).

## Fora de escopo (registrar, não fazer)

- Command palette, undo persistido entre sessões, milestone diário de confete, merge por ID no import, redesenho visual (identidade mantida).

## Critérios de aceite

- Contrastes da tabela ≥4.5:1 (texto) / ≥3:1 (UI) nos dois temas.
- Nenhum console error no dev server (base-ui nativeButton, CSP worker).
- Suites verdes: vitest + e2e (count atual: 180 unit / 35 e2e, cresce a cada issue).
- 4 PRs fechando 4 issues; zero issues abertas ao final.
