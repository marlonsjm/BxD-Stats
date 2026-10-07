'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetTrigger, SheetContent, SheetClose, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { AuthNav } from '@/components/AuthNav';
import { SeletorServidor, useServidorAtual } from '@/components/SeletorServidor';
import { rota } from '@/lib/servidores';

// porServidor: o link ganha o prefixo do servidor da pagina (/online/matches).
// Em pagina global (/skins, /gallery) fica sem prefixo e o middleware manda
// para o servidor preferido.
const LINKS = [
  { href: '/', label: 'Home', porServidor: true },
  { href: '/matches', label: 'Partidas', porServidor: true },
  { href: '/players', label: 'Jogadores', porServidor: true },
  { href: '/rankings', label: 'Rankings', porServidor: true },
  { href: '/maps', label: 'Mapas', porServidor: true },
  { href: '/skins', label: 'Skins' },
  { href: '/gallery', label: 'Galeria' },
];

export function Navbar() {
  const pathname = usePathname();
  const { servidor, naUrl } = useServidorAtual();
  const navLinks = LINKS.map(link => ({
    ...link,
    href: link.porServidor && naUrl ? rota(servidor, link.href) : link.href,
  }));
  const homeHref = navLinks[0].href;

  const NavLink = ({ href, label, className }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        aria-current={isActive ? 'page' : undefined}
        className={`text-sm font-medium transition-colors ${isActive ? 'text-white underline decoration-cyan-400 decoration-2 underline-offset-8' : 'text-gray-400 hover:text-white'} ${className}`}>
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-700 bg-gray-900/80 backdrop-blur">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link href={homeHref} className="mr-3 md:mr-4 flex items-center py-2">
          <span className="font-bold text-lg text-white font-orbitron">BxD STATS</span>
        </Link>

        {/* Seletor LAN | Online: visivel tambem no mobile, porque e contexto da
            pagina e nao item de navegacao */}
        <SeletorServidor className="md:mr-6" />

        {/* Desktop Navigation */}
        <nav aria-label="Navegação principal" className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>

        {/* Login Steam / perfil (desktop) */}
        <div className="hidden md:flex flex-1 items-center justify-end">
          <AuthNav />
        </div>

        {/* Mobile Navigation */}
        <div className="flex flex-1 items-center justify-end md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Abrir menu de navegação">
                <Menu className="h-6 w-6 text-white" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-gray-900 border-l-gray-800 text-white">
              <div className="grid gap-4 p-6">
                <SheetTitle className="text-left">
                  <SheetClose asChild>
                    <Link href={homeHref} className="inline-flex items-center py-1">
                      <span className="font-bold text-lg text-white font-orbitron">BxD STATS</span>
                    </Link>
                  </SheetClose>
                </SheetTitle>
                <nav aria-label="Navegação principal" className="grid">
                  {navLinks.map(link => {
                    const isActive = pathname === link.href;
                    return (
                      <SheetClose asChild key={link.href}>
                        <Link
                          href={link.href}
                          aria-current={isActive ? 'page' : undefined}
                          className={`flex items-center min-h-[44px] text-lg font-medium transition-colors border-b border-gray-800 ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                          {link.label}
                        </Link>
                      </SheetClose>
                    );
                  })}
                </nav>
                {/* Login Steam / perfil (mobile) */}
                <AuthNav mobile />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
