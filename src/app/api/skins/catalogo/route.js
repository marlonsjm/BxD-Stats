// Busca no catalogo de adesivos e chaveiros.
//
// Existe porque sao 10.461 adesivos (2 MB de JSON): mandar isso para o
// navegador so para preencher um seletor seria absurdo. O catalogo fica no
// servidor e o cliente pede o que precisa.
//
//   GET /api/skins/catalogo?tipo=sticker&q=katowice      -> busca por nome
//   GET /api/skins/catalogo?tipo=keychain&ids=4,17       -> resolve ids conhecidos
//
// Exige sessao: nao e dado sensivel (vem de um repositorio publico), mas nao ha
// motivo para deixar um endpoint de busca aberto.

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

const LIMITE = 60;

async function carregar(tipo) {
  if (tipo === 'keychain') {
    return (await import('@/data/skins/keychains.json')).default;
  }
  return (await import('@/data/skins/stickers.json')).default;
}

export async function GET(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ erro: 'nao autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo') === 'keychain' ? 'keychain' : 'sticker';
  const q = (searchParams.get('q') ?? '').trim().toLowerCase();
  const ids = (searchParams.get('ids') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const catalogo = await carregar(tipo);

  // Resolver ids especificos (para mostrar o que ja esta equipado)
  if (ids.length > 0) {
    const procurados = new Set(ids);
    const itens = catalogo.filter((x) => procurados.has(String(x.id)));
    return NextResponse.json({ itens });
  }

  // Busca por nome. Sem termo, devolve o inicio do catalogo.
  const itens = (q
    ? catalogo.filter((x) => String(x.name).toLowerCase().includes(q))
    : catalogo
  ).slice(0, LIMITE);

  return NextResponse.json({ itens, total: catalogo.length });
}
