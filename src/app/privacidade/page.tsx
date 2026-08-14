import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacidade — OpsBoard",
  description:
    "Política de privacidade do OpsBoard: onde os dados ficam, base legal, direitos do titular e como apagar tudo.",
};

const SECTIONS = [
  {
    title: "1. Finalidade do tratamento",
    body: "O OpsBoard é uma ferramenta de controle de tarefas pessoal. Os dados informados (títulos de projetos, tarefas, notas e prioridades) são usados exclusivamente para exibir e organizar o seu quadro no navegador. Não há coleta de dados para perfilamento, publicidade ou qualquer outro fim.",
  },
  {
    title: "2. Onde os dados ficam",
    body: "Todos os dados são armazenados exclusivamente no armazenamento local do seu navegador (localStorage), sob a chave opsboard.v1. Eles nunca são enviados a servidores, não saem do seu dispositivo e não são compartilhados com terceiros. O tema escolhido também é salvo localmente (opsboard.theme).",
  },
  {
    title: "3. Base legal",
    body: "Por não haver envio ou tratamento de dados pessoais por servidores de terceiros, o tratamento é local e técnico (Lei 13.709/2018 — LGPD, art. 7º, inciso II). O uso da ferramenta e o consentimento para esse tratamento são manifestados ao aceitar o aviso exibido no primeiro acesso.",
  },
  {
    title: "4. Direitos do titular (LGPD, art. 18)",
    body: "Como os dados estão apenas no seu navegador, você controla tudo diretamente: acesso (consulte o quadro), correção (edite projetos, seções e tarefas), portabilidade (use o botão exportar para baixar um backup JSON) e exclusão (apague projetos/tarefas na interface ou limpe os dados do site nas configurações do navegador).",
  },
  {
    title: "5. Como apagar todos os dados",
    body: "No rodapé do quadro há o botão 'apagar todos os dados' — ele pede confirmação explícita e remove todos os projetos do navegador. Para apagar um item específico, use os controles de exclusão do próprio projeto/seção/tarefa. O botão exportar baixa um backup antes de qualquer exclusão. Também é possível remover os dados nas configurações do navegador, em 'Dados do site'.",
  },
  {
    title: "6. Contato",
    body: "Questões sobre esta política podem ser abertas no repositório público do projeto (github.com/lmaoclost/ops-board), seção Issues.",
  },
];

export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Política de privacidade</h1>
      <p className="mt-2 text-sm text-[var(--muted-text)]">
        OpsBoard — controle de tarefas. Dados ficam apenas no seu navegador.
      </p>
      <div className="mt-8 space-y-6">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="text-base font-semibold text-[var(--text)]">{s.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-text)]">{s.body}</p>
          </section>
        ))}
      </div>
      <p className="mt-10 text-xs text-[var(--dimmer)]">
        Atualizado em agosto de 2026.
      </p>
    </main>
  );
}
