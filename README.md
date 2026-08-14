# OpsBoard

Visualizador de projetos e tarefas com visual em console: lista e kanban, drag & drop, prioridades, vencimentos, filtros, tema claro/escuro e backup JSON.

Todos os dados ficam **apenas no navegador** (localStorage). Nada é enviado a servidores.

## Stack

Next.js (App Router) + TypeScript + Tailwind v4 + shadcn/ui

## Desenvolvimento

```sh
npm install
npm run dev        # http://localhost:3000
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # unit + componentes (vitest)
npm run e2e        # e2e (playwright, chromium; instala navegador na 1ª vez)
npm run build      # produção
```

PRs passam por CI (`.github/workflows/ci.yml`): lint, typecheck, testes e e2e precisam estar verdes para merge.

A versão clássica (HTML/CSS/JS vanilla) vive em `legacy/` como referência de paridade durante a migração.

## Privacidade (LGPD)

- Sem seed, sem telemetria, sem terceiros processando dados
- Export exporta tudo; `apagar todos os dados` (rodapé) apaga tudo (direitos do titular)
- Aviso de privacidade no primeiro acesso + política em `/privacidade`
- Lint bloqueia PII (e-mails, CPFs, telefones) em literais; CSP estrito; `npm audit` no CI
- Documento de conformidade completo em [`docs/lgpd.md`](docs/lgpd.md) (mapeamento art. 18, base legal, retenção, incidentes)

## Licença

MIT — veja [LICENSE](LICENSE).