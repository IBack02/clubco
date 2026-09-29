import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { ApiError, apiError, readJson } from "@/lib/server-errors"

const commentSchema = z.object({ content: z.string().trim().min(1, "Введите комментарий").max(5000) })

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 })
  try {
    const { id } = await params
    const body = await readJson(request, commentSchema)
    const announcement = await prisma.announcement.findUnique({ where: { id } })
    if (!announcement) throw new ApiError(404, "Анонс не найден")
    const comment = await prisma.comment.create({
      data: { announcementId: id, userId: session.userId, content: body.content },
      include: { user: { select: { name: true } } },
    })
    return NextResponse.json({
      id: comment.id,
      userId: comment.userId,
      userName: comment.user.name,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
