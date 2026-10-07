// Renova na hora o cache de stats de um servidor (lib/stats.js), sem esperar
// a validade expirar. Chamado pelo prisma/sync-sqlite-to-tidb.mjs ao fim do sync
// da LAN; tambem serve para forcar o Online depois de uma noite de jogo:
//
//   curl -X POST "https://SITE/api/revalidar?servidor=online" -H "Authorization: Bearer $REVALIDATE_SECRET"
//
// Nao toca no banco: so marca o retrato como velho. A proxima visita recarrega.

import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { timingSafeEqual } from 'node:crypto';
import { IDS_SERVIDORES, isServidor } from '@/lib/servidores';
import { tagStats } from '@/lib/stats';

export const dynamic = 'force-dynamic';

function autorizado(request) {
  const segredo = process.env.REVALIDATE_SECRET;
  if (!segredo) return false;
  const recebido = Buffer.from(request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '');
  const esperado = Buffer.from(segredo);
  return recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
}

export async function POST(request) {
  if (!autorizado(request)) {
    return NextResponse.json({ erro: 'não autorizado' }, { status: 401 });
  }

  const pedido = new URL(request.url).searchParams.get('servidor');
  const servidores = pedido === 'todos' ? IDS_SERVIDORES : [pedido];
  if (!servidores.every(isServidor)) {
    return NextResponse.json({ erro: `servidor inválido; use ${IDS_SERVIDORES.join(', ')} ou todos` }, { status: 400 });
  }

  servidores.forEach((s) => revalidateTag(tagStats(s)));
  return NextResponse.json({ revalidado: servidores });
}
