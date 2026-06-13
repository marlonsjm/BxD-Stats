export default function Loading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-gray-400" role="status" aria-live="polite">
      <div aria-hidden="true" className="h-10 w-10 animate-spin rounded-full border-4 border-gray-700 border-t-cyan-400" />
      <p className="text-sm">Carregando estatísticas...</p>
    </div>
  );
}
