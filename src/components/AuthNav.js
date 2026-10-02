'use client';

// Estado de login na Navbar. Busca a sessão via /api/me no navegador para não
// tornar as páginas dinâmicas (preserva o cache ISR do site). Recebe apenas
// dados públicos (steamid, nick, avatar) — nenhum segredo chega ao cliente.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export function AuthNav({ mobile = false, onNavigate }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    let active = true;
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data) => {
        if (active) {
          setUser(data.user || null);
          setLoading(false);
        }
      })
      .catch(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  if (loading) {
    // Placeholder do tamanho do botão para evitar "pulo" no layout
    return (
      <div
        className={mobile ? 'min-h-[44px]' : 'h-9 w-40 rounded-full bg-gray-800/60 animate-pulse'}
        aria-hidden="true"
      />
    );
  }

  // --- Deslogado: botão de login (destaque em ciano, o accent do site) ---
  if (!user) {
    const steamIcon = (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={mobile ? 'h-5 w-5' : 'h-4 w-4'}>
        <path d="M11.98 0C5.68 0 .51 4.86.02 11.04l6.43 2.66a3.39 3.39 0 0 1 1.91-.59h.17l2.86-4.14v-.06a4.53 4.53 0 0 1 4.53-4.53 4.53 4.53 0 0 1 4.53 4.53 4.53 4.53 0 0 1-4.53 4.53h-.1l-4.08 2.91v.14a3.4 3.4 0 0 1-3.39 3.4 3.41 3.41 0 0 1-3.33-2.73L.44 15.27A12 12 0 0 0 11.98 24a12 12 0 0 0 0-24zM7.54 18.21l-1.47-.61a2.55 2.55 0 0 0 4.92-.95 2.55 2.55 0 0 0-2.55-2.55c-.33 0-.65.07-.94.18l1.52.63a1.88 1.88 0 0 1-1.48 3.45v-.15zm10.9-9.83a3.02 3.02 0 0 0-3.02-3.02 3.02 3.02 0 0 0-3.02 3.02 3.02 3.02 0 0 0 3.02 3.02 3.02 3.02 0 0 0 3.02-3.02zm-5.28 0a2.27 2.27 0 1 1 4.54 0 2.27 2.27 0 0 1-4.54 0z" />
      </svg>
    );

    const cls = mobile
      ? 'mt-1 inline-flex items-center justify-center gap-2 min-h-[44px] bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold px-4 rounded-full shadow-lg'
      : 'inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-2 px-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg text-sm';

    return (
      <a href="/api/auth/steam" className={cls} onClick={onNavigate}>
        {steamIcon}
        Entrar com Steam
      </a>
    );
  }

  const avatar = user.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.avatar} alt="" className="h-8 w-8 rounded-full border border-gray-600" />
  ) : (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-sm font-bold text-white">
      {(user.name || '?').charAt(0).toUpperCase()}
    </span>
  );

  // --- Logado (mobile): links diretos no menu ---
  if (mobile) {
    return (
      <div className="grid">
        <Link
          href="/profile"
          onClick={onNavigate}
          className="flex items-center gap-3 min-h-[44px] text-lg font-medium text-gray-400 hover:text-white border-b border-gray-800"
        >
          {avatar}
          <span className="truncate">{user.name || 'Meu Perfil'}</span>
        </Link>
        <Link
          href="/skins"
          onClick={onNavigate}
          className="flex items-center min-h-[44px] text-lg font-medium text-gray-400 hover:text-white border-b border-gray-800"
        >
          Minhas Skins
        </Link>
        <button
          onClick={logout}
          className="flex items-center min-h-[44px] text-lg font-medium text-red-400 hover:text-red-300 text-left"
        >
          Sair
        </button>
      </div>
    );
  }

  // --- Logado (desktop): avatar com dropdown ---
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-gray-800 transition-colors"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="Menu do usuário"
      >
        {avatar}
        <span className="max-w-[120px] truncate text-sm text-gray-300">{user.name || 'Perfil'}</span>
      </button>
      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 overflow-hidden rounded-md border border-gray-700 bg-gray-800 shadow-lg"
        >
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setMenuOpen(false)}
            className="block px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-700"
          >
            Meu Perfil
          </Link>
          <Link
            href="/skins"
            role="menuitem"
            onClick={() => setMenuOpen(false)}
            className="block px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-700"
          >
            Minhas Skins
          </Link>
          <button
            onClick={logout}
            role="menuitem"
            className="block w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-gray-700"
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
