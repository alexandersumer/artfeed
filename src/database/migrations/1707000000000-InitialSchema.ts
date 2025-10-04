import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from "typeorm";

export class InitialSchema1707000000000 implements MigrationInterface {
  name = "InitialSchema1707000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const driverType = queryRunner.connection.driver.options.type;
    const isPostgres = driverType === "postgres";

    if (isPostgres) {
      await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    }

    await queryRunner.createTable(
      new Table({
        name: "users",
        columns: [
          {
            name: "id",
            type: isPostgres ? "uuid" : "varchar",
            isPrimary: true,
            isNullable: false,
            isGenerated: isPostgres,
            generationStrategy: isPostgres ? "uuid" : undefined,
            default: isPostgres ? "gen_random_uuid()" : undefined,
          },
          {
            name: "locale",
            type: "text",
            isNullable: true,
          },
          {
            name: "country",
            type: "text",
            isNullable: true,
          },
          {
            name: "created_at",
            type: isPostgres ? "timestamptz" : "datetime",
            isNullable: false,
            default: isPostgres ? "NOW()" : "datetime('now')",
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: "user_profiles",
        columns: [
          {
            name: "user_id",
            type: isPostgres ? "uuid" : "varchar",
            isPrimary: true,
            isNullable: false,
          },
          {
            name: "embedding",
            type: "text",
            isNullable: true,
          },
          {
            name: "last_updated",
            type: isPostgres ? "timestamptz" : "datetime",
            isNullable: true,
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      "user_profiles",
      new TableForeignKey({
        columnNames: ["user_id"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: "artworks",
        columns: [
          {
            name: "id",
            type: "integer",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "source",
            type: "text",
            isNullable: false,
          },
          {
            name: "source_id",
            type: "text",
            isNullable: false,
          },
          {
            name: "title",
            type: "text",
            isNullable: true,
          },
          {
            name: "artist",
            type: "text",
            isNullable: true,
          },
          {
            name: "artist_id",
            type: "text",
            isNullable: true,
          },
          {
            name: "date_display",
            type: "text",
            isNullable: true,
          },
          {
            name: "medium",
            type: "text",
            isNullable: true,
          },
          {
            name: "period",
            type: "text",
            isNullable: true,
          },
          {
            name: "styles",
            type: "text",
            isNullable: true,
          },
          {
            name: "subjects",
            type: "text",
            isNullable: true,
          },
          {
            name: "iiif_manifest_url",
            type: "text",
            isNullable: true,
          },
          {
            name: "iiif_image_base",
            type: "text",
            isNullable: true,
          },
          {
            name: "image_url_full",
            type: "text",
            isNullable: true,
          },
          {
            name: "image_url_1080",
            type: "text",
            isNullable: true,
          },
          {
            name: "width",
            type: "integer",
            isNullable: true,
          },
          {
            name: "height",
            type: "integer",
            isNullable: true,
          },
          {
            name: "license",
            type: "text",
            isNullable: true,
          },
          {
            name: "rights",
            type: "text",
            isNullable: true,
          },
          {
            name: "credit_line",
            type: "text",
            isNullable: true,
          },
          {
            name: "is_public_domain",
            type: isPostgres ? "boolean" : "integer",
            isNullable: false,
            default: isPostgres ? "false" : "0",
          },
          {
            name: "created_at",
            type: isPostgres ? "timestamptz" : "datetime",
            isNullable: false,
            default: isPostgres ? "NOW()" : "datetime('now')",
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      "artworks",
      new TableIndex({
        name: "IDX_ARTWORK_SOURCE_SOURCE_ID",
        columnNames: ["source", "source_id"],
        isUnique: true,
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: "artwork_embeddings",
        columns: [
          {
            name: "artwork_id",
            type: "integer",
            isPrimary: true,
          },
          {
            name: "embedding",
            type: "text",
            isNullable: false,
          },
          {
            name: "model",
            type: "text",
            isNullable: true,
          },
          {
            name: "phash",
            type: "text",
            isNullable: true,
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      "artwork_embeddings",
      new TableForeignKey({
        columnNames: ["artwork_id"],
        referencedTableName: "artworks",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: "feed_impressions",
        columns: [
          {
            name: "id",
            type: "integer",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "user_id",
            type: isPostgres ? "uuid" : "varchar",
            isNullable: true,
          },
          {
            name: "artwork_id",
            type: "integer",
            isNullable: false,
          },
          {
            name: "rank",
            type: "integer",
            isNullable: false,
          },
          {
            name: "score",
            type: isPostgres ? "double precision" : "real",
            isNullable: false,
          },
          {
            name: "model_version",
            type: "text",
            isNullable: true,
          },
          {
            name: "created_at",
            type: isPostgres ? "timestamptz" : "datetime",
            isNullable: false,
            default: isPostgres ? "NOW()" : "datetime('now')",
          },
        ],
      }),
    );

    await queryRunner.createForeignKeys("feed_impressions", [
      new TableForeignKey({
        columnNames: ["user_id"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      }),
      new TableForeignKey({
        columnNames: ["artwork_id"],
        referencedTableName: "artworks",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: "interactions",
        columns: [
          {
            name: "id",
            type: "integer",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "user_id",
            type: isPostgres ? "uuid" : "varchar",
            isNullable: true,
          },
          {
            name: "artwork_id",
            type: "integer",
            isNullable: false,
          },
          {
            name: "event_type",
            type: "text",
            isNullable: false,
          },
          {
            name: "dwell_ms",
            type: "integer",
            isNullable: true,
          },
          {
            name: "scroll_velocity",
            type: isPostgres ? "double precision" : "real",
            isNullable: true,
          },
          {
            name: "position",
            type: "integer",
            isNullable: true,
          },
          {
            name: "created_at",
            type: isPostgres ? "timestamptz" : "datetime",
            isNullable: false,
            default: isPostgres ? "NOW()" : "datetime('now')",
          },
        ],
      }),
    );

    await queryRunner.createForeignKeys("interactions", [
      new TableForeignKey({
        columnNames: ["user_id"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      }),
      new TableForeignKey({
        columnNames: ["artwork_id"],
        referencedTableName: "artworks",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("interactions", true, true, true);
    await queryRunner.dropTable("feed_impressions", true, true, true);
    await queryRunner.dropTable("artwork_embeddings", true, true, true);
    await queryRunner.dropIndex("artworks", "IDX_ARTWORK_SOURCE_SOURCE_ID");
    await queryRunner.dropTable("artworks", true, true, true);
    await queryRunner.dropTable("user_profiles", true, true, true);
    await queryRunner.dropTable("users", true, true, true);
  }
}
