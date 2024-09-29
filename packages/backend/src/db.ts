import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Surreal, { ConnectionStatus } from "surrealdb";
import { config } from "./config.js";
import { getExpireTimeFromJWT } from "./helper/getExpireTimeFromJWT.js";
import logger from "./logger.js";

let db = new Surreal();
let expirationDate = new Date();

export const connectDb = async () => {
  db = new Surreal();
  await db.connect(config.surrealdb.url);
  await db.use({
    database: config.surrealdb.database,
    namespace: config.surrealdb.namespace,
  });

  const token = await db.signin({
    username: config.surrealdb.user,
    password: config.surrealdb.pass,
  });

  expirationDate = new Date(getExpireTimeFromJWT(token) * 1000);

  const version = await db.version();

  logger.info(
    { dbVersion: version, status: db.status },
    `Using SurrealDB version ${version}`
  );
};

export const getDb = async () => {
  if (db.status === ConnectionStatus.Connected && expirationDate > new Date()) {
    return db;
  }

  await db
    .close()
    .catch((err) =>
      logger.error({ err }, "failed to close surrealDB connection")
    );

  await connectDb();

  return db;
};

export const migrateDb = async () => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const file = join(__dirname, "database.surql");
  const migration = readFileSync(file, { encoding: "utf-8" });
  const db = await getDb();
  await db
    .query(migration)
    .catch((err) => logger.error({ err }, "Migration failed"));
};
