// Retorno do login Steam (OpenID 2.0).
//
// Segurança — nada aqui confia no navegador:
// 1. A resposta é revalidada DIRETAMENTE com a Steam (check_authentication);
//    só aceitamos se a Steam responder is_valid:true.
// 2. O steamid é extraído do claimed_id validado por regex estrita — nunca de
//    um parâmetro solto.
// 3. O return_to da resposta assinada precisa apontar para ESTE endpoint
//    (impede reuso da resposta em outro site/rota).
// 4. A STEAM_API_KEY só é usada aqui no servidor, para buscar nick/avatar;
//    nunca aparece em resposta, log ou código cliente.

import { NextResponse } from 'next/server';
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from '@/lib/session';

export const dynamic = 'force-dynamic';

const CLAIMED_ID_RE = /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/;

async function verifyWithSteam(searchParams) {
  // Reenvia todos os parâmetros openid.* recebidos, trocando o mode.
  const body = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith('openid.')) body.set(key, value);
  }
  body.set('openid.mode', 'check_authentication');

  const res = await fetch('https://steamcommunity.com/openid/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    cache: 'no-store',
  });
  if (!res.ok) return false;
  const text = await res.text();
  return /is_valid\s*:\s*true/.test(text);
}

async function fetchSteamProfile(steamid) {
  const key = process.env.STEAM_API_KEY;
  if (!key) return null; // sem a key o login funciona; só fica sem nick/avatar
  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${key}&steamids=${steamid}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const p = data.response?.players?.[0];
    if (!p) return null;
    return { name: p.personaname || null, avatar: p.avatarmedium || p.avatar || null };
  } catch {
    return null; // erro na API da Steam não impede o login
  }
}

export async function GET(request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const params = url.searchParams;

  const fail = (reason) =>
    NextResponse.redirect(`${origin}/profile?erro=${encodeURIComponent(reason)}`);

  if (params.get('openid.mode') !== 'id_res') return fail('login_cancelado');

  // return_to assinado pela Steam precisa ser este endpoint
  const returnTo = params.get('openid.return_to') || '';
  if (returnTo !== `${origin}/api/auth/steam/return`) return fail('retorno_invalido');

  // steamid vem do claimed_id, com formato estrito
  const match = CLAIMED_ID_RE.exec(params.get('openid.claimed_id') || '');
  if (!match) return fail('identidade_invalida');
  const steamid = match[1];

  // Validação server-to-server com a Steam
  const valid = await verifyWithSteam(params);
  if (!valid) return fail('assinatura_invalida');

  // Enriquece a sessão com nick/avatar (opcional, não bloqueia o login)
  const profile = await fetchSteamProfile(steamid);

  const token = createSessionToken({
    steamid,
    name: profile?.name,
    avatar: profile?.avatar,
  });

  const response = NextResponse.redirect(`${origin}/profile`);
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
