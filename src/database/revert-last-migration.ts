import AppDataSource from "./data-source";

type MigrationRow = { id: number; name: string };

function isMigrationRowArray(value: unknown): value is MigrationRow[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        typeof (item as { id?: unknown }).id === "number" &&
        "name" in item &&
        typeof (item as { name?: unknown }).name === "string",
    )
  );
}

async function revertLastMigration() {
  await AppDataSource.initialize();
  try {
    const rawResult = await AppDataSource.query(
      "SELECT id, name FROM migrations ORDER BY id DESC LIMIT 1",
    );

    if (!isMigrationRowArray(rawResult) || rawResult.length === 0) {
      console.log("No migrations to revert");
      return;
    }

    const [lastMigration] = rawResult;

    await AppDataSource.undoLastMigration();
    console.log(`Reverted migration: ${lastMigration.name}`);
  } finally {
    await AppDataSource.destroy();
  }
}

revertLastMigration().catch((error) => {
  console.error("Revert migration failed", error);
  process.exit(1);
});
