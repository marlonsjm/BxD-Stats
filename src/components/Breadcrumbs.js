import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SeloServidor } from '@/components/SeloServidor';

// Com `servidor`, a trilha abre com o selo LAN/Online: a pagina deixa claro de
// qual banco sao os dados, inclusive num print.
export function Breadcrumbs({ items, servidor }) {
  return (
    <nav aria-label="Trilha de navegação" className="mb-6">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-400">
        {servidor && (
          <li className="flex items-center pr-1">
            <SeloServidor servidor={servidor} />
          </li>
        )}
        {items.map((item, index) => (
          <li key={index} className="flex min-w-0 items-center gap-x-2">
            {index > 0 && <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0" />}
            {item.href ? (
              <Link href={item.href} className="inline-flex items-center py-2 hover:text-white hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="truncate py-2 font-semibold text-white">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
