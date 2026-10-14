import { PrismaClient } from "@prisma/client"

function getDatabaseUrl(): string {
  let url =
    process.env.DATABASE_URL ||
    "postgresql://postgres:Raushan2009%3D%3FNur@db.frtgaslfumyxjhzzstok.supabase.co:5432/postgres"

  if (url.includes("Raushan2009=?Nur")) {
    url = url.replace("Raushan2009=?Nur", "Raushan2009%3D%3FNur")
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
