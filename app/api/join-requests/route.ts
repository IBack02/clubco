import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { serializeJoinRequest } from "@/lib/serialize"
import { apiError } from "@/lib/server-errors"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 })
  try {
    const records = await prisma.joinRequest.findMany({
      where: session.role === "admin" ? {} : {
        OR: [
          { userId: session.userId },
          { club: { owners: { some: { userId: session.userId } } } },
        ],
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(records.map(serializeJoinRequest))
  } catch (error) {
    return apiError(error)
  }
}
