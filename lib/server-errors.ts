import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { z } from "zod"

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export async function readJson<T extends z.ZodTypeAny>(request: Request, schema: T): Promise<z.output<T>> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new ApiError(400, "Некорректный JSON в запросе")
  }
  const result = schema.safeParse(body)
  if (!result.success) {
    throw new ApiError(400, result.error.issues[0]?.message || "Проверьте поля запроса")
  }
  return result.data
}

export function apiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json({ error: "Запись уже существует" }, { status: 409 })
  }
  console.error("Database request failed:", error)
  return NextResponse.json({ error: "Не удалось сохранить данные. Попробуйте ещё раз." }, { status: 500 })
}
