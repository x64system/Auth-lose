import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import path from "node:path";

const PORT = 5433;
const DB_NAME = "inject_bypass";
const DATA_DIR = path.resolve("./.local-pg-data");

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: "postgres",
  password: "postgres",
  port: PORT,
  persistent: true
});

const alreadyInitialised = existsSync(path.join(DATA_DIR, "PG_VERSION"));

async function main() {
  if (!alreadyInitialised) {
    console.log(">> Inicializando cluster Postgres local (primeira vez)...");
    await pg.initialise();
  } else {
    console.log(">> Cluster Postgres local já existe, a reutilizar.");
  }

  console.log(">> Iniciando servidor Postgres (fica a correr em background)...");
  await pg.start();

  try {
    await pg.createDatabase(DB_NAME);
    console.log(`>> Base de dados "${DB_NAME}" criada.`);
  } catch {
    console.log(`>> Base de dados "${DB_NAME}" já existia.`);
  }

  const databaseUrl = `postgresql://postgres:postgres@localhost:${PORT}/${DB_NAME}?schema=public`;
  console.log(`\nDATABASE_URL=${databaseUrl}\n`);
  console.log(">> Postgres local pronto e a correr (não vai parar quando este script terminar).");
}

main().catch((err) => {
  console.error("ERRO ao preparar o Postgres local:", err);
  process.exit(1);
});
