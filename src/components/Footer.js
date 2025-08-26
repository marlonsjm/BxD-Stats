import Link from 'next/link';

export function Footer() {
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/matches', label: 'Partidas' },
    { href: '/players', label: 'Ranking' },
    { href: '/maps', label: 'Mapas' },
    { href: '/gallery', label: 'Galeria' },
  ];

  return (
    <footer className="border-t border-gray-800 bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-lg font-semibold">BxD STATS</p>
            <p className="text-sm text-gray-400">Estatísticas da nossa galera.</p>
          </div>
          <nav className="flex gap-4 sm:gap-6">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-6 border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} BxD Stats. Todos os direitos reservados.</p>
          <p className="mt-2">
            Feito com ❤️ por <Link href="https://github.com/marlonsjm/web-casa.git" target="_blank" rel="noopener noreferrer" className="hover:text-white underline">marlonsjm</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
