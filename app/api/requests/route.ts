import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { serializeClubRequest } from "@/lib/serialize"
import { getSession } from "@/lib/auth"
import { apiError, readJson } from "@/lib/server-errors"
import { clubRequestSchema } from "@/lib/request-validation"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 })
  if (session.role !== "admin") {
    const list = await prisma.clubRequest.findMany({
      where: { applicantId: session.userId },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(list.map(serializeClubRequest))
  }
  const list = await prisma.clubRequest.findMany({
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(list.map(serializeClubRequest))
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 })
  try {
    const body = await readJson(request, clubRequestSchema)
    const req = await prisma.clubRequest.create({
      data: {
        applicantId: session.userId,
        clubName: body.clubName.trim(),
        description: body.description.trim(),
        goals: body.goals.trim(),
        schedule: JSON.stringify(body.schedule),
        curator: body.curator?.trim() || null,
        contacts: body.contacts.trim(),
        status: "pending",
      },
    })
    return NextResponse.json(serializeClubRequest(req), { status: 201 })
  } catch (e) {
    return apiError(e)
  }
}
