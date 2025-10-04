import AppDataSource from "./data-source";

async function revertLastMigration() {
  await AppDataSource.initialize();
  try {
    const reverted = await AppDataSource.undoLastMigration();
    if (reverted) {
      console.log(`Reverted migration: ${reverted.name}`);
    } else {
      console.log("No migrations to revert");
    }
  } finally {
    await AppDataSource.destroy();
  }
}

revertLastMigration().catch((error) => {
  console.error("Revert migration failed", error);
  process.exit(1);
});
