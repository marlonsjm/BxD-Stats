'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetTrigger, SheetContent, SheetClose, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/matches', label: 'Partidas' },
  { href: '/players', label: 'Jogadores' },
  { href: '/rankings', label: 'Rankings' },
  { href: '/maps', label: 'Mapas' },
  { href: '/gallery', label: 'Galeria' },
];

const skinsMixUrl = 'https://powderblue-parrot-119938.hostingersite.com/';

export function Navbar() {
  const pathname = usePathname();

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
        <Link href="/" className="mr-6 flex items-center py-2">
          <span className="font-bold text-lg text-white font-orbitron">BxD STATS</span>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Navegação principal" className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
          <Link
            href={skinsMixUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg text-sm"
          >
            Skins MIX
          </Link>
        </nav>

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
                    <Link href="/" className="inline-flex items-center py-1">
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
                <SheetClose asChild>
                  <Link
                    href={skinsMixUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center justify-center min-h-[44px] bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-4 rounded-full shadow-lg"
                  >
                    Skins MIX
                  </Link>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
