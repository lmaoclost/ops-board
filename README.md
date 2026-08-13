# OpsBoard

Visualizador de projetos e tarefas com visual em console: lista e kanban, drag & drop, prioridades, vencimentos, filtros, tema claro/escuro e backup JSON.

Todos os dados ficam **apenas no navegador** (localStorage). Nada é enviado a servidores.

## Rodar

Abra `index.html` direto no navegador, ou sirva a pasta:

```sh
python3 -m http.server 8080
# http://localhost:8080
```

## Funcionalidades

- Projetos → seções → tarefas (CRUD completo)
- Status: todo / em andamento / aguardando / concluída + bloqueada
- Prioridade P1–P3, vencimento com aviso de atraso
- Arrastar tarefa pra reordenar, mudar status ou coluna kanban
- Busca e filtros por status; estatísticas (total, pendentes, % concluída, feitas hoje)
- Export/import JSON (backup)
- Atalhos: `p` projeto · `n` tarefa · `1–5` filtro · `k` kanban · `t` tema · `?` ajuda

## Privacidade (LGPD)

- Sem seed, sem telemetria, sem terceiros processando dados
- Export exporta tudo; Reset apaga tudo (direitos do titular)
- Ver `docs/` (a partir dos issues de conformidade)

## Licença

MIT — veja [LICENSE](LICENSE).