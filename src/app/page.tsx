export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6">
      <header className="flex items-baseline gap-2">
        <h1 className="text-sm font-bold tracking-tight">
          ops<span className="text-emerald-400">/</span>board
        </h1>
        <span className="text-[10px] text-zinc-500">scaffold — board chega nas próximas fases</span>
      </header>
      <div className="mt-24 border border-dashed border-zinc-600 rounded-md p-10 text-center text-zinc-500">
        <span className="block text-2xl">_</span>
        <p className="mt-3">nenhum projeto na fila.</p>
      </div>
    </main>
  );
}