import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { ApiError, apiError } from "@/lib/server-errors"

async function setLike(id: string, liked: boolean) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 })
  try {
    const announcement = await prisma.announcement.findUnique({ where: { id } })
    if (!announcement) throw new ApiError(404, "Анонс не найден")
    const key = { announcementId: id, userId: session.userId }
    const likes = await prisma.$transaction(async (tx) => {
      if (liked) {
        await tx.announcementLike.upsert({ where: { announcementId_userId: key }, create: key, update: {} })
      } else {
        await tx.announcementLike.deleteMany({ where: key })
      }
      return tx.announcementLike.findMany({ where: { announcementId: id }, select: { userId: true } })
    })
    return NextResponse.json({ likes: likes.map((like) => like.userId) })
  } catch (error) {
    return apiError(error)
  }
}

export async function PUT(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return setLike((await params).id, true)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return setLike((await params).id, false)
}
