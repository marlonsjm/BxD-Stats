import Link from 'next/link';

export function Footer() {
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/matches', label: 'Partidas' },
    { href: '/players', label: 'Jogadores' },
    { href: '/rankings', label: 'Rankings' },
    { href: '/maps', label: 'Mapas' },
    { href: '/gallery', label: 'Galeria' },
  ];

  return (
    <footer className="border-t border-gray-800 bg-gray-900 text-white">
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-lg font-semibold">BxD STATS</p>
            <p className="text-sm text-gray-400">Estatísticas da nossa galera.</p>
          </div>
          <nav aria-label="Rodapé" className="flex flex-wrap justify-center gap-x-4 gap-y-1 sm:gap-x-6">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className="inline-flex items-center min-h-[44px] text-sm text-gray-400 hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-6 border-t border-gray-800 pt-6 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} BxD Stats. Todos os direitos reservados.</p>
          <p className="mt-2">
            Feito com ❤️ por <Link href="https://github.com/marlonsjm/web-casa.git" target="_blank" rel="noopener noreferrer" className="hover:text-white underline">marlonsjm</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
