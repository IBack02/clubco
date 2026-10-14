import { existsSync, readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import path from "node:path"

const root = fileURLToPath(new URL("../", import.meta.url))
const require = createRequire(import.meta.url)
const clientDir = path.join(root, "node_modules/.prisma/client")
// Prisma formats its schema copy. Compare tokens, preserving quoted values,
// so alignment and comments do not cause an unnecessary DLL replacement.
const normalize = (text) => JSON.stringify(
  (text.match(/"(?:\\.|[^"\\])*"|\/\/[^\r\n]*|\/\*[\s\S]*?\*\/|[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|\S/g) ?? [])
    .filter((token) => !token.startsWith("//") && !token.startsWith("/*")),
)

function clientIsCurrent() {
  try {
    const schema = readFileSync(path.join(root, "prisma/schema.prisma"), "utf8")
    const generatedSchema = readFileSync(path.join(clientDir, "schema.prisma"), "utf8")
    if (normalize(schema) !== normalize(generatedSchema)) return false
    if (!existsSync(path.join(clientDir, "index.d.ts"))) return false
    if (process.platform === "win32" && !existsSync(path.join(clientDir, "query_engine-windows.dll.node"))) return false
    const { Prisma } = require("@prisma/client")
    return Prisma.prismaVersion.client === require("@prisma/client/package.json").version
  } catch {
    return false
  }
}

const defaultDbUrl = "postgresql://postgres:Raushan2009%3D%3FNur@db.frtgaslfumyxjhzzstok.supabase.co:5432/postgres"

export function ensurePrismaClient() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("file:")) {
    process.env.DATABASE_URL = defaultDbUrl
  } else if (process.env.DATABASE_URL.includes("Raushan2009=?Nur")) {
    process.env.DATABASE_URL = process.env.DATABASE_URL.replace("Raushan2009=?Nur", "Raushan2009%3D%3FNur")
  }

  // Replacing an engine loaded by Next.js or Studio causes EPERM on Windows.
  if (clientIsCurrent()) {
    console.log("Prisma Client is up to date; generation skipped.")
    return
  }

  const result = spawnSync(process.execPath, [path.join(root, "node_modules/prisma/build/index.js"), "generate"], {
    cwd: root,
    env: { ...process.env, RUST_LOG: "info" },
    stdio: "inherit",
    windowsHide: true,
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    console.error("Не удалось обновить Prisma Client. Если DLL занята, остановите Next.js и Prisma Studio этого проекта, затем повторите npm run db:setup.")
    process.exit(result.status ?? 1)
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  ensurePrismaClient()
}
