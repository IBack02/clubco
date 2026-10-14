import { existsSync, writeFileSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"
import { ensurePrismaClient } from "./ensure-prisma.mjs"

const root = fileURLToPath(new URL("../", import.meta.url))
const defaultDbUrl = "postgresql://postgres.frtgaslfumyxjhzzstok:Raushan2009%3D%3FNur@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

const envPath = path.join(root, ".env")
let envContent = ""
if (existsSync(envPath)) {
  try {
    envContent = readFileSync(envPath, "utf8")
  } catch {}
}

// Fix or create .env if it has invalid SQLite or raw unencoded password or direct IPv6 host
if (!existsSync(envPath) || envContent.includes("file:./dev.db") || envContent.includes("Raushan2009=?Nur") || envContent.includes("db.frtgaslfumyxjhzzstok.supabase.co")) {
  try {
    writeFileSync(
      envPath,
      `DATABASE_URL="${defaultDbUrl}"\nAUTH_SECRET="clubco-super-secret-key-2024"\nNEXT_PUBLIC_SUPABASE_URL="https://frtgaslfumyxjhzzstok.supabase.co"\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_q1YsdZlvvJRVfGN0i4Fr6A_rYYZAE58"\n`,
      "utf8"
    )
    console.log("Configured .env for Supabase PostgreSQL IPv4 Pooler.")
  } catch (err) {
    console.warn("Could not write .env:", err.message)
  }
}

// Ensure process.env.DATABASE_URL is URL-encoded and uses IPv4 pooler
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("file:")) {
  process.env.DATABASE_URL = defaultDbUrl
} else {
  if (process.env.DATABASE_URL.includes("Raushan2009=?Nur")) {
    process.env.DATABASE_URL = process.env.DATABASE_URL.replace("Raushan2009=?Nur", "Raushan2009%3D%3FNur")
  }
  if (process.env.DATABASE_URL.includes("db.frtgaslfumyxjhzzstok.supabase.co")) {
    process.env.DATABASE_URL = process.env.DATABASE_URL
      .replace("db.frtgaslfumyxjhzzstok.supabase.co", "aws-0-ap-southeast-1.pooler.supabase.com")
      .replace("postgres:", "postgres.frtgaslfumyxjhzzstok:")
  }
}

ensurePrismaClient()
console.log("Database setup is ready.")
