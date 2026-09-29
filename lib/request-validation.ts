import { z } from "zod"

const requiredText = (max: number) => z.string().trim().min(1, "Заполните обязательные поля").max(max)

const schedule = z.array(z.object({
  day: requiredText(50),
  time: requiredText(50),
  room: requiredText(200),
})).min(1, "Добавьте хотя бы одно занятие в расписание").max(50)

export const clubRequestSchema = z.object({
  clubName: requiredText(200),
  description: requiredText(10000),
  goals: requiredText(10000),
  schedule,
  curator: z.string().trim().max(200).optional(),
  contacts: requiredText(1000),
})

export const approveRequestSchema = z.object({
  name: requiredText(200),
  shortDescription: requiredText(1000),
  description: requiredText(10000),
  coverImage: requiredText(2000),
  schedule,
})

export const rejectRequestSchema = z.object({
  adminComment: z.string().trim().max(5000).optional(),
})

export const joinRequestSchema = z.object({
  name: requiredText(200).optional(),
  grade: z.string().trim().max(50).optional(),
  contacts: requiredText(1000).optional(),
})
