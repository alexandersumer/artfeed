import AppDataSource from './data-source';

async function runMigrations() {
  await AppDataSource.initialize();
  try {
    const migrations = await AppDataSource.runMigrations();
    migrations.forEach((migration) => {
      console.log(`Executed migration: ${migration.name}`);
    });
  } finally {
    await AppDataSource.destroy();
  }
}

runMigrations().catch((error) => {
  console.error('Migration failed', error);
  process.exit(1);
});
