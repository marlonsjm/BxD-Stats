import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export function Breadcrumbs({ items }) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-6 px-4 md:px-0">
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-white hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-white">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
