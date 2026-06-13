export function TableSkeleton({ rows = 10, title = true }) {
  return (
    <div className="animate-pulse" role="status" aria-label="Carregando dados">
      {title && (
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="h-9 w-72 max-w-full rounded bg-gray-800" />
          <div className="h-4 w-96 max-w-full rounded bg-gray-800" />
        </div>
      )}
      <div className="overflow-hidden rounded-lg bg-gray-800 shadow-lg">
        <div className="h-11 bg-gray-900" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-gray-700/50 px-4 py-3 last:border-b-0">
            <div className="h-4 w-8 rounded bg-gray-700/60" />
            <div className="h-4 w-40 rounded bg-gray-700/60" />
            <div className="ml-auto hidden gap-6 md:flex">
              <div className="h-4 w-12 rounded bg-gray-700/40" />
              <div className="h-4 w-12 rounded bg-gray-700/40" />
              <div className="h-4 w-12 rounded bg-gray-700/40" />
              <div className="h-4 w-12 rounded bg-gray-700/40" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Carregando...</span>
    </div>
  );
}
