import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { ApiError, apiError, readJson } from "@/lib/server-errors"
import { joinRequestSchema } from "@/lib/request-validation"
import { serializeJoinRequest } from "@/lib/serialize"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 })
  try {
    const { id } = await params
    const body = await readJson(request, joinRequestSchema)
    const club = await prisma.club.findUnique({ where: { id } })
    if (!club) throw new ApiError(404, "Клуб не найден")
    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!user) throw new ApiError(401, "Войдите в аккаунт снова")
    const existing = await prisma.clubMember.findUnique({
      where: { clubId_userId: { clubId: id, userId: user.id } },
    })
    if (existing) throw new ApiError(409, "Вы уже в клубе")

    const joinRequest = await prisma.$transaction(async (tx) => {
      // The membership's unique key also prevents concurrent duplicate joins.
      await tx.clubMember.create({ data: { clubId: id, userId: user.id } })
      const record = await tx.joinRequest.create({
        data: {
          clubId: id,
          userId: user.id,
          name: body.name ?? user.name,
          grade: body.grade ?? user.grade ?? "",
          contacts: body.contacts ?? user.phone ?? user.email,
          status: "approved",
        },
      })
      await tx.club.update({ where: { id }, data: { memberCount: { increment: 1 } } })
      return record
    })
    return NextResponse.json({ ok: true, request: serializeJoinRequest(joinRequest) }, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
