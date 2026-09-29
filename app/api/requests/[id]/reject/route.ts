import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { ApiError, apiError, readJson } from "@/lib/server-errors"
import { rejectRequestSchema } from "@/lib/request-validation"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Только администратор может отклонять заявки" }, { status: 403 })
  }
  try {
    const { id } = await params
    const body = await readJson(request, rejectRequestSchema)
    const req = await prisma.clubRequest.findUnique({ where: { id } })
    if (!req) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 })
    const result = await prisma.clubRequest.updateMany({
      where: { id, status: "pending" },
      data: { status: "rejected", adminComment: body.adminComment?.trim() || null },
    })
    if (result.count !== 1) throw new ApiError(409, "Заявка уже рассмотрена")
    return NextResponse.json({ ok: true })
  } catch (e) {
    return apiError(e)
  }
}
