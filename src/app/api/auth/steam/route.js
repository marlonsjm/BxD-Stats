// Inicia o login: redireciona para a página de autorização da Steam (OpenID 2.0).
// Nenhum segredo participa deste passo — a STEAM_API_KEY não é usada aqui.

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const origin = new URL(request.url).origin;

  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.return_to': `${origin}/api/auth/steam/return`,
    'openid.realm': origin,
  });

  return NextResponse.redirect(`https://steamcommunity.com/openid/login?${params}`);
}
