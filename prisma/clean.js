const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning database...');

  // Delete in order to respect relations (though relationMode = "prisma" handles it, this is safer)
  // 1. Delete PlayerStats (depends on Maps)
  const deletedStats = await prisma.playerStats.deleteMany({});
  console.log(`Deleted ${deletedStats.count} player stats.`);

  // 2. Delete Maps (depends on Matches)
  const deletedMaps = await prisma.map.deleteMany({});
  console.log(`Deleted ${deletedMaps.count} maps.`);

  // 3. Delete Matches (parent)
  const deletedMatches = await prisma.match.deleteMany({});
  console.log(`Deleted ${deletedMatches.count} matches.`);

  console.log('Database cleaned successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
