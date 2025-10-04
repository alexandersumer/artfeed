import databaseConfig from "../src/database/database.config";

describe("database config", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("defaults autoSync to false", () => {
    delete process.env.DB_AUTO_SYNC;
    const config = databaseConfig();
    expect(config.autoSync).toBe(false);
  });

  it("respects DB_AUTO_SYNC=true", () => {
    process.env.DB_AUTO_SYNC = "true";
    const config = databaseConfig();
    expect(config.autoSync).toBe(true);
  });
});
