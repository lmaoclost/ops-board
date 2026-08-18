<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

OpsBoard — visualizador de projetos e tarefas. Next.js 16.3 (App Router, breaking changes — ver bloco acima), React 19, TypeScript, Tailwind v4, componentes UI próprios sobre **@base-ui/react** (não radix), zustand com persist, vitest + Testing Library (unit), Playwright (e2e).

## Comandos
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — eslint **sem** `--max-warnings`: warnings não quebram CI (existem vários pré-existentes, não "consertar" todos)
- `npm test` — vitest (jsdom, globals, alias `@` → `src`), testes colados em `src/**/*.test.{ts,tsx}`
- `npm run e2e` — Playwright; `webServer` faz `npm run build && npm start` na porta 3000 (`reuseExistingServer` quando não-CI)
- CI (`.github/workflows/ci.yml`): npm ci → `npm audit --audit-level=high` → `npm ls` → lint → typecheck → unit → Playwright chromium. Job único `check` é obrigatório nos PRs; merge **squash** (nunca `--admin`)

## Workflow de trabalho (sessões anteriores estabeleceram)
- Cada feature = 1 issue + 1 PR com `Closes #N` no body; merge squash; remover worktree + branch após merge
- Trabalhar em worktree de `origin/main`: `git worktree add .worktrees/feat-XX -b feat/XX origin/main` + `npm install` nele (node_modules não é compartilhado)
- Antes de mergear: atualizar branch com `origin/main` e resolver conflitos localmente; depois `gh pr merge N --squash --delete-branch` (de main, sem worktree ativo na branch)
- e2e local: `setsid nohup npx playwright test <spec> > /tmp/opencode/x.log 2>&1 < /dev/null & disown`, aguardar ~110s, `tail`; matar servidor antes com `pkill -f "next[-]server"` (bracket trick evita auto-kill)

## Arquitetura
- `src/lib/` — lógica pura testável (store zustand único `store.ts`, migrate, filter, dnd, i18n, io/import-export); componentes ficam em `src/components/client/` (`board/`, `dnd/`)
- `src/lib/store.ts` — estado único, persist `localStorage` key `"opsboard.v1"`, `partialize` controla o que persiste; mutações têm **undo (Ctrl+Z)**; `SCHEMA_VERSION = 7` em `migrate.ts` (e2e `export-import.spec.ts` depende do valor — mudar schema exige atualizar o spec)
- **Lixeira TTL 7 dias**: `purgeExpired()` em `migrate.ts` remove tarefas com `deletedAt >= 7d` na reidratação — aplicado via opção **`merge`** do zustand persist (o `migrate` só roda quando a versão do schema muda; o `merge` roda sempre)
- `src/lib/subtasks.ts` — helpers recursivos imutáveis `mapSubs/removeSub/addSub/makeSub` (subs são `SubTask` completas: prio/due/status/note/blocked + `subs` aninhadas, recursão ilimitada)
- `store.ts` `reconcileSubs()` — regra recursiva: sub com filhas = todas `done` ? `done` : `todo`; pai idem (via `editTask`); `addTaskFull(pid, sid, input)` = criação completa em 1 commit de undo (status done seta `doneAt`)
- Componentes UI (Modal, Tooltip, Select, DropdownMenu…) são wrappers próprios de base-ui em `src/components/client/`; testids/aria-labels em **pt-BR** são contrato com e2e (`task-row`, `stat-total`, `combobox name="status"`)
- **SelectValue sem children mostra o value cru** (ex: "todo") — `label` do `SelectItem` no base-ui é só p/ keyboard nav; para o trigger exibir texto traduzido/amigável, passar children ao `SelectValue` (ex: `{status(task.status)}`)
- `privacidade/page.tsx` é client component — **não pode exportar `metadata`** (erro de build)

## i18n
- Padrão **pt-BR**; toggle EN no header; locale persistido no store
- Dicionário em `src/lib/i18n.ts` — chave nova entra nos blocos **pt E en**; `useT()` retorna `{ t, status }` (status = rótulos de status traduzidos)
- Teste de paridade pt/en aceita exceções onde pt==en: `["P3 — normal", "agenda", "app_name", "status", "stuck", "total"]`

## LGPD / segurança
- Regra eslint `no-restricted-syntax` bloqueia emails/CPFs/telefones BR literais no código — fixtures e e2e usam dados fictícios
- Não armazenar dados pessoais; import/export é localStorage

## DnD
- dnd-kit: `SortableTaskItem` (useSortable) + droppables de seção (`sec:`, `sec-end:`) para mover entre seções/projetos
- Drag na lista só reordena ao vivo se houver `SortableContext` + `verticalListSortingStrategy` por seção — sem ele o card só segue o cursor
- **Kanban: NÃO usar `useSortable`** (congela collision: transform null, over null fora do contêiner) — draggable puro + droppable por card (`task:`) + coluna (`k:`) com `smartCollision` (lib/dnd.ts): o menor rect que contém o pointer vence, senão rectIntersection
- Guard de 6px no sensor (click vs drag)
