import { PrismaClient } from '@prisma/client'
import { notFound } from 'next/navigation'
import { isServidor, SERVIDOR_PADRAO } from './servidores'

// Um client por servidor: os bancos tem o mesmo schema (tabelas do MatchZy),
// so muda a URL. As skins (wp_player_*) existem apenas no banco da LAN.
const URLS = {
  lan: 'DATABASE_URL_LAN',
  online: 'DATABASE_URL_ONLINE',
}

const clients = global.prismaClients || {}
if (process.env.NODE_ENV === 'development') global.prismaClients = clients

// Servidor invalido vem de URL digitada (/foo): 404. A pagina renderiza em
// paralelo com o layout [servidor], entao o notFound() de la nao chega antes.
export function getDb(servidor) {
  if (!isServidor(servidor)) notFound()
  if (!clients[servidor]) {
    const url = process.env[URLS[servidor]]
    if (!url) throw new Error(`Variável ${URLS[servidor]} não definida (banco do servidor "${servidor}").`)
    clients[servidor] = new PrismaClient({
      datasourceUrl: url,
      // LOG_QUERIES=1 imprime cada consulta (com o servidor), para medir o
      // custo de uma pagina no banco. Ver docs/cache.md.
      log: process.env.LOG_QUERIES ? [{ emit: 'event', level: 'query' }] : [],
    })
    if (process.env.LOG_QUERIES) {
      clients[servidor].$on('query', (e) => console.log(`[db:${servidor}] ${e.duration}ms ${e.query.slice(0, 90)}`))
    }
  }
  return clients[servidor]
}

// Banco da LAN: skins, sessão e qualquer código que não depende do seletor.
const prisma = getDb(SERVIDOR_PADRAO)

export default prisma
