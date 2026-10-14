import { PrismaClient } from "@prisma/client"

function getDatabaseUrl(): string {
  let url =
    process.env.DATABASE_URL ||
    "postgresql://postgres.frtgaslfumyxjhzzstok:Raushan2009%3D%3FNur@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

  if (url.includes("Raushan2009=?Nur")) {
    url = url.replace("Raushan2009=?Nur", "Raushan2009%3D%3FNur")
  }

  // Render is IPv4-only; Supabase direct db.* is IPv6-only.
  // Automatically route through the IPv4 Connection Pooler:
  if (url.includes("db.frtgaslfumyxjhzzstok.supabase.co")) {
    url = url
      .replace("db.frtgaslfumyxjhzzstok.supabase.co", "aws-0-ap-southeast-1.pooler.supabase.com")
      .replace("postgres:", "postgres.frtgaslfumyxjhzzstok:")
  }

  return url
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
