'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/matches', label: 'Partidas' },
    { href: '/players', label: 'Jogadores' },
    { href: '/rankings', label: 'Rankings' },
    { href: '/maps', label: 'Mapas' },
    { href: '/gallery', label: 'Galeria' },
  ];

  const NavLink = ({ href, label, className }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={`text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'} ${className}`}>
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-700 bg-gray-900/80 backdrop-blur">
      <div className="container flex h-16 items-center px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center">
          <span className="font-bold text-lg text-white">BxD STATS</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>

        {/* Mobile Navigation */}
        <div className="flex flex-1 items-center justify-end md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6 text-white" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-gray-900 border-l-gray-800 text-white">
              <div className="grid gap-6 p-6">
                <Link href="/" className="flex items-center">
                  <span className="font-bold text-lg text-white">BxD STATS</span>
                </Link>
                <nav className="grid gap-4">
                  {navLinks.map(link => (
                    <NavLink key={link.href} href={link.href} label={link.label} className="text-lg" />
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}