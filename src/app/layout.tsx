import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpsBoard — controle de tarefas",
  description:
    "Visualizador de projetos e tarefas. Lista e kanban, drag & drop, prioridades e backup JSON. Dados ficam apenas no navegador.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${jetbrains.variable} antialiased`}>
      <body className="min-h-full font-mono">{children}</body>
    </html>
  );
}