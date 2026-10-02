// Seletor de time e de categoria da pagina /skins.
//
// Tudo e link, nao estado de cliente: o filtro vive na URL
// (/skins?team=ct&cat=rifles). Isso mantem a pagina como server component,
// deixa o botao "voltar" funcionar e permite mandar um link direto pra alguem.

import Link from 'next/link';
import { CATEGORIES, TEAMS } from '@/lib/skins/catalog';

function montarHref({ team, cat }) {
  return `/skins?team=${team}&cat=${cat}`;
}

export function SkinsToolbar({ teamSlug, category }) {
  return (
    <div className="space-y-4">
      {/* Time */}
      <div
        className="inline-flex rounded-full border border-gray-700 bg-gray-800/60 p-1"
        role="group"
        aria-label="Escolher time"
      >
        {TEAMS.map((t) => {
          const ativo = t.slug === teamSlug;
          return (
            <Link
              key={t.slug}
              href={montarHref({ team: t.slug, cat: category })}
              aria-current={ativo ? 'true' : undefined}
              className={`rounded-full px-5 py-1.5 text-sm font-bold transition-colors ${
                ativo
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* Categorias */}
      <nav aria-label="Categorias de itens" className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const ativo = c.id === category;
          return (
            <Link
              key={c.id}
              href={montarHref({ team: teamSlug, cat: c.id })}
              aria-current={ativo ? 'page' : undefined}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                ativo
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
              }`}
            >
              {c.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
