// ============================================================================
// Admin direto no TiDB, contornando o SQL Editor do TiDB Cloud (que pode estar
// em modo read-only e "engolir" DDL sem aplicar).
//
// Rodar diagnostico (READ-ONLY, nao apaga nada):
//   node --env-file=.env.local prisma/db-admin.mjs
//
// Apagar as tabelas do MatchZy de verdade:
//   CONFIRM=1 node --env-file=.env.local prisma/db-admin.mjs
// ============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const db = await prisma.$queryRawUnsafe('SELECT DATABASE() AS db');
  console.log('Conectado. DATABASE() =', db[0]?.db);

  const tables = await prisma.$queryRawUnsafe(
    `SELECT table_name AS name, table_rows AS approx_rows
       FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name LIKE 'matchzy%'
      ORDER BY table_name`
  );
  console.log('\nTabelas matchzy% ANTES:');
  console.table(tables);

  if (process.env.CONFIRM !== '1') {
    console.log('\n[DIAGNOSTICO] Nada foi apagado.');
    console.log('Para apagar, rode: CONFIRM=1 node --env-file=.env.local prisma/db-admin.mjs');
    return;
  }

  console.log('\n[CONFIRM=1] Apagando tabelas do MatchZy...');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS `matchzy_stats_players`');
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS `matchzy_stats_maps`');
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS `matchzy_stats_matches`');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');

  const after = await prisma.$queryRawUnsafe(
    `SELECT table_name AS name
       FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name LIKE 'matchzy%'
      ORDER BY table_name`
  );
  console.log('\nTabelas matchzy% DEPOIS (deve estar vazio):');
  console.table(after);
  console.log(after.length === 0
    ? '\nOK — tabelas apagadas. Agora reinicie o servidor CS2 para o MatchZy recria-las.'
    : '\nATENCAO — ainda restam tabelas. Verifique permissoes do usuario do banco.');
}

main()
  .catch((e) => { console.error('ERRO:', e.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
