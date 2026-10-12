import { randomBytes } from "node:crypto"
import { writeFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import path from "node:path"
import { ensurePrismaClient } from "./ensure-prisma.mjs"

const root = fileURLToPath(new URL("../", import.meta.url))

// If DATABASE_URL is already set (e.g. Render + Supabase), skip creating SQLite .env
if (process.env.DATABASE_URL) {
  console.log("DATABASE_URL already set in environment, skipping .env creation.")
} else {
  try {
    writeFileSync(
      path.join(root, ".env"),
      `DATABASE_URL="file:./dev.db"\nAUTH_SECRET="${randomBytes(32).toString("hex")}"\n`,
      { flag: "wx", mode: 0o600 },
    )
    console.log("Created .env for the local SQLite database.")
  } catch (error) {
    if (error.code !== "EEXIST") throw error
  }
}

// Use the installed CLI directly so this also works on Windows without a shell.
ensurePrismaClient()
for (const args of [["migrate", "deploy"]]) {
  const result = spawnSync(process.execPath, [path.join(root, "node_modules/prisma/build/index.js"), ...args], {
    cwd: root,
    // Prisma 5 parses the engine's info output when creating a new SQLite file.
    // A system-wide RUST_LOG=warn can otherwise hide the missing-database response.
    env: { ...process.env, RUST_LOG: "info" },
    stdio: "inherit",
    windowsHide: true,
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

console.log("Local database is ready. Existing records are preserved.")
