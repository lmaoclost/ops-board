import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    ignores: ["legacy/**"],
  },
  {
    name: "lgpd/pii",
    rules: {
      // LGPD: impede re-introdução de dados pessoais em fixtures/código
      "no-restricted-syntax": [
        "error",
        {
          selector: 'Literal[value=/\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b/]',
          message: "PII: e-mails não devem aparecer no código (LGPD — minimização). Use valores fictícios.",
        },
        {
          selector: 'Literal[value=/^\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}$/]',
          message: "PII: CPF não deve aparecer no código (LGPD — minimização).",
        },
        {
          selector: 'Literal[value=/^\\+?55\\s?\\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}$/]',
          message: "PII: telefones brasileiros não devem aparecer no código (LGPD — minimização).",
        },
      ],
    },
  },
]);

export default eslintConfig;