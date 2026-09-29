import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { serializeClub } from "@/lib/serialize"
import { getSession } from "@/lib/auth"
import { ApiError, apiError, readJson } from "@/lib/server-errors"
import { approveRequestSchema } from "@/lib/request-validation"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Только администратор может одобрять заявки" }, { status: 403 })
  }
  try {
    const { id } = await params
    const body = await readJson(request, approveRequestSchema)
    const clubRequest = await prisma.clubRequest.findUnique({ where: { id } })
    if (!clubRequest) throw new ApiError(404, "Заявка не найдена")

    const club = await prisma.$transaction(async (tx) => {
      const claimed = await tx.clubRequest.updateMany({
        where: { id, status: "pending" },
        data: { status: "approved" },
      })
      if (claimed.count !== 1) throw new ApiError(409, "Заявка уже рассмотрена")
      const created = await tx.club.create({
        data: {
          name: body.name,
          shortDescription: body.shortDescription,
          description: body.description,
          coverImage: body.coverImage,
          photos: "[]",
          schedule: JSON.stringify(body.schedule),
          links: "{}",
          city: "Школа",
          memberCount: 1,
          categories: "[]",
          owners: { create: { userId: clubRequest.applicantId } },
          members: { create: { userId: clubRequest.applicantId } },
        },
        include: { owners: { select: { userId: true } } },
      })
      await tx.clubRequest.update({ where: { id }, data: { approvedClubId: created.id } })
      await tx.user.updateMany({
        where: { id: clubRequest.applicantId, role: "student" },
        data: { role: "owner" },
      })
      return created
    })
    const payload = serializeClub(club)
    payload.ownerIds = club.owners.map((owner) => owner.userId)
    return NextResponse.json({ club: payload }, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
