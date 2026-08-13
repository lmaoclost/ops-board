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
npm run build      # produção
```

A versão clássica (HTML/CSS/JS vanilla) vive em `legacy/` como referência de paridade durante a migração.

## Privacidade (LGPD)

- Sem seed, sem telemetria, sem terceiros processando dados
- Export exporta tudo; Reset apaga tudo (direitos do titular)
- Ver `docs/` (a partir dos issues de conformidade)

## Licença

MIT — veja [LICENSE](LICENSE).