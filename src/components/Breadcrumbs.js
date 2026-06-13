import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Trilha de navegação" className="mb-6">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-400">
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
