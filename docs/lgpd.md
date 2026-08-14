# Conformidade LGPD — OpsBoard

Documento de governança de dados do OpsBoard. Última revisão: agosto de 2026.

## 1. Visão geral do tratamento

O OpsBoard é uma aplicação 100% client-side: o tratamento de dados ocorre
**exclusivamente no navegador do usuário**, sem envio a servidores, sem
processadores de dados (cloud, analytics, CDNs de runtime) e sem
compartilhamento com terceiros.

| Aspecto | Valor |
|---|---|
| Controlador | O próprio usuário (tratamento local/técnico) |
| Local de armazenamento | `localStorage` do navegador (chaves `opsboard.v1`, `opsboard.theme`, `opsboard.notice-v1`) |
| Envio a servidores | Nenhum (verificado por teste e2e de rede e CSP `connect-src 'self'`) |
| Coleta automática | Nenhuma (sem telemetria, sem analytics, sem erros de terceiros) |
| Dados de terceiros | Nenhum dado de terceiros é processado |

## 2. Mapeamento de direitos do titular (art. 18) × funcionalidades

| Direito (LGPD art. 18) | Funcionalidade no OpsBoard | Onde |
|---|---|---|
| I — Confirmação de existência / II — Acesso | Visualizar o quadro completo (lista/kanban) e exportar backup JSON | Botão `↓exportar` (topbar) |
| III — Correção | Editar projeto, seção e tarefa (texto, prioridade, status, vencimento, nota, bloqueio) | Ações de edição em cada item |
| IV — Anonimização / bloqueio / eliminação | `apagar todos os dados` (com confirmação explícita) e exclusão individual por item | Rodapé do quadro + ações por item |
| V — Portabilidade | Exportar JSON completo (100% do estado) e importar em outro navegador/dispositivo | `↓exportar` / `↑importar` |
| VI — Informação sobre compartilhamento | Política de privacidade pública; zero compartilhamento | `/privacidade` |
| VII — Revogação do consentimento | O consentimento é dado no aviso inicial (`opsboard.notice-v1`); apagar a chave + dados revoga | Aviso inicial + rodapé |

## 3. Decisões registradas

### 3.1 Base legal (art. 7º)

- **Art. 7º, inciso II (cumprimento de obrigação legal/técnica)**: o
  tratamento é estritamente local e necessário ao funcionamento da
  ferramenta; não há coleta nem transferência.
- **Consentimento** (art. 7º, I): manifestado no primeiro acesso pelo aviso
  de privacidade (`opsboard.notice-v1`); revogável apagando os dados.

### 3.2 Retenção (art. 15)

- Os dados ficam retidos **até a exclusão pelo usuário** (exclusão
  individual, `apagar todos os dados` ou limpeza do navegador).
- Sem retenção em servidores: nada persiste fora do dispositivo.

### 3.3 Incidentes de segurança (art. 48)

- **Risco residual**: baixo — dado local, sem rede, sem cópia externa.
- Superfície possível: XSS (mitigado por CSP estrito + sanitização
  `linkify`/escape + testes de vetor), import de arquivo malicioso
  (mitigado por validação de schema, tamanho e limites de nós), cadeia de
  dependências (mitigado por `npm audit` no CI + Dependabot).
- **Fluxo de reporte**: vulnerabilidades são reportadas pelas Issues do
  repositório público; correções seguem o fluxo normal de PR + CI + deploy.

### 3.4 Registro das operações de tratamento (art. 37)

Este documento é o registro de tratamento. O schema de dados versionado
(`SCHEMA_VERSION` em `src/lib/migrate.ts`, atualmente `2`) funciona como
registro de evolução do tratamento: cada migração (`src/lib/migrate.ts`)
documenta as transformações aplicadas a dados existentes.

## 4. Histórico de revisões

| Data | Mudança |
|---|---|
| 2026-08 | Criação (fases 6.1–6.4) |
