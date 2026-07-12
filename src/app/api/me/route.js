// Estado de login para o cliente (Navbar). Retorna apenas dados públicos da
// sessão (steamid, nick, avatar) — nunca segredos. A Navbar consulta este
// endpoint no navegador, o que mantém as páginas em cache ISR (ler cookies
// direto no layout tornaria todas as páginas dinâmicas).

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  return NextResponse.json(
    { user: session },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
