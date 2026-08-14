import type { Metadata } from "next";
import { JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

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
    <html lang="pt-BR" suppressHydrationWarning className={cn("antialiased", jetbrains.variable, "font-sans", geist.variable)}>
      <body className="min-h-full font-mono">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}