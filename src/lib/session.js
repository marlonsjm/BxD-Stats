// Sessão via cookie assinado (HMAC-SHA256, crypto nativo do Node).
// Formato do token: base64url(JSON payload) + "." + base64url(assinatura).
// O payload carrega apenas dados públicos do jogador (steamid, nick, avatar) +
// expiração. NUNCA colocar a STEAM_API_KEY ou qualquer segredo aqui: o cookie
// é assinado (inviolável), mas NÃO criptografado (legível pelo dono).
//
// Uso exclusivo em código servidor (route handlers / server components).

import crypto from 'crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'bxd_session';
const MAX_AGE_SECONDS = 7 * 24 * 3600; // 7 dias

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'SESSION_SECRET ausente ou curta demais (mínimo 16 caracteres). ' +
      'Defina no .env.local e nas variáveis de ambiente da Vercel.'
    );
  }
  return secret;
}

function sign(data) {
  return crypto.createHmac('sha256', getSecret()).update(data).digest('base64url');
}

// Cria o token de sessão. `user`: { steamid, name, avatar }
export function createSessionToken(user) {
  const payload = Buffer.from(
    JSON.stringify({
      steamid: String(user.steamid),
      name: user.name || null,
      avatar: user.avatar || null,
      exp: Date.now() + MAX_AGE_SECONDS * 1000,
    })
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

// Verifica assinatura e expiração. Retorna o usuário ou null.
export function verifySessionToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  // Comparação em tempo constante (evita timing attack na assinatura)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.steamid || !/^\d{17}$/.test(data.steamid)) return null;
    if (!data.exp || Date.now() > data.exp) return null;
    return { steamid: data.steamid, name: data.name, avatar: data.avatar };
  } catch {
    return null;
  }
}

// Lê a sessão do cookie da requisição atual (server components / route handlers).
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

// Opções do cookie de sessão (usadas ao definir e ao limpar).
// httpOnly: JS do navegador não lê; secure em produção; lax mitiga CSRF.
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  };
}
