import { PrismaClient } from "@prisma/client"
import * as bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const defaultPassword = "password"

async function main() {
  const hash = await bcrypt.hash(defaultPassword, 10)

  const admin = await prisma.user.upsert({
    where: { email: "aidar@nis.edu.kz" },
    update: {
      name: "Айдар Баймурзунов",
      role: "admin",
      passwordHash: hash,
    },
    create: {
      email: "aidar@nis.edu.kz",
      passwordHash: hash,
      name: "Айдар Баймурзунов",
      role: "admin",
      grade: "11A",
      phone: "+7 777 123 4567",
      bio: "Администратор платформы NIS CLUBS",
    },
  })

  const owner = await prisma.user.upsert({
    where: { email: "raushan@nis.edu.kz" },
    update: {
      name: "Бакирова Раушан",
      role: "owner",
      passwordHash: hash,
    },
    create: {
      email: "raushan@nis.edu.kz",
      passwordHash: hash,
      name: "Бакирова Раушан",
      role: "owner",
      grade: "10B",
      phone: "+7 777 234 5678",
      bio: "Руководитель спортивных клубов NIS",
    },
  })

  // Promote existing personal account if present
  try {
    await prisma.user.updateMany({
      where: { email: "hjdosa@gmail.com" },
      data: { role: "admin" },
    })
  } catch {}

  const club1 = await prisma.club.upsert({
    where: { id: "club-basketball" },
    update: {
      name: "Баскетбольный клуб NIS",
      description:
        "Тренировки по баскетболу, тактическая подготовка, отработка бросков и командного взаимодействия. Участие в школьных, городских и региональных турнирах.",
      shortDescription: "Тренировки, командная игра и турниры по баскетболу",
      coverImage: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=80",
      photos: JSON.stringify([
        "https://images.unsplash.com/photo-1519766304817-4f37bda74a29?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80",
      ]),
      schedule: JSON.stringify([
        { day: "Понедельник", time: "16:00-18:00", room: "Большой спортзал" },
        { day: "Среда", time: "16:00-18:00", room: "Большой спортзал" },
        { day: "Пятница", time: "17:00-19:00", room: "Большой спортзал" },
      ]),
      links: JSON.stringify({ telegram: "https://t.me/nis_basketball", whatsapp: "https://wa.me/77771234567" }),
      city: "Кызылорда",
      memberCount: 15,
      categories: JSON.stringify(["Спорт", "Баскетбол"]),
    },
    create: {
      id: "club-basketball",
      name: "Баскетбольный клуб NIS",
      description:
        "Тренировки по баскетболу, тактическая подготовка, отработка бросков и командного взаимодействия. Участие в школьных, городских и региональных турнирах.",
      shortDescription: "Тренировки, командная игра и турниры по баскетболу",
      coverImage: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=80",
      photos: JSON.stringify([
        "https://images.unsplash.com/photo-1519766304817-4f37bda74a29?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80",
      ]),
      schedule: JSON.stringify([
        { day: "Понедельник", time: "16:00-18:00", room: "Большой спортзал" },
        { day: "Среда", time: "16:00-18:00", room: "Большой спортзал" },
        { day: "Пятница", time: "17:00-19:00", room: "Большой спортзал" },
      ]),
      links: JSON.stringify({ telegram: "https://t.me/nis_basketball", whatsapp: "https://wa.me/77771234567" }),
      city: "Кызылорда",
      memberCount: 0,
      categories: JSON.stringify(["Спорт", "Баскетбол"]),
    },
  })

  const club2 = await prisma.club.upsert({
    where: { id: "club-volleyball" },
    update: {
      name: "Волейбольный клуб NIS",
      description:
        "Секция классического волейбола. Отработка точных подач, блоков, атакующих ударов и защитной расстановки. Регулярные спарринги и подготовка к межшкольным соревнованиям.",
      shortDescription: "Отработка техники, тактики и участие в волейбольных турнирах",
      coverImage: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&auto=format&fit=crop&q=80",
      photos: JSON.stringify([
        "https://images.unsplash.com/photo-1592656094267-764a45160876?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&auto=format&fit=crop&q=80",
      ]),
      schedule: JSON.stringify([
        { day: "Вторник", time: "16:00-18:00", room: "Малый спортзал" },
        { day: "Четверг", time: "16:00-18:00", room: "Малый спортзал" },
        { day: "Суббота", time: "11:00-13:00", room: "Малый спортзал" },
      ]),
      links: JSON.stringify({ telegram: "https://t.me/nis_volleyball", whatsapp: "https://wa.me/77772345678" }),
      city: "Кызылорда",
      memberCount: 0,
      categories: JSON.stringify(["Спорт", "Волейбол"]),
    },
    create: {
      id: "club-volleyball",
      name: "Волейбольный клуб NIS",
      description:
        "Секция классического волейбола. Отработка точных подач, блоков, атакующих ударов и защитной расстановки. Регулярные спарринги и подготовка к межшкольным соревнованиям.",
      shortDescription: "Отработка техники, тактики и участие в волейбольных турнирах",
      coverImage: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&auto=format&fit=crop&q=80",
      photos: JSON.stringify([
        "https://images.unsplash.com/photo-1592656094267-764a45160876?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&auto=format&fit=crop&q=80",
      ]),
      schedule: JSON.stringify([
        { day: "Вторник", time: "16:00-18:00", room: "Малый спортзал" },
        { day: "Четверг", time: "16:00-18:00", room: "Малый спортзал" },
        { day: "Суббота", time: "11:00-13:00", room: "Малый спортзал" },
      ]),
      links: JSON.stringify({ telegram: "https://t.me/nis_volleyball", whatsapp: "https://wa.me/77772345678" }),
      city: "Кызылорда",
      memberCount: 0,
      categories: JSON.stringify(["Спорт", "Волейбол"]),
    },
  })

  await prisma.clubOwner.deleteMany({
    where: {
      OR: [{ clubId: club1.id }, { clubId: club2.id }],
    },
  })
  await prisma.clubOwner.createMany({
    data: [
      { clubId: club1.id, userId: owner.id },
      { clubId: club2.id, userId: owner.id },
    ],
  })

  await prisma.announcement.deleteMany({
    where: { clubId: { in: [club1.id, club2.id] } },
  })
  await prisma.announcement.createMany({
    data: [
      {
        clubId: club1.id,
        title: "Открытый отбор в школьную сборную по баскетболу",
        content: "В эту пятницу в 17:00 в большом спортзале пройдет открытый отбор в сборную команду NIS. Приглашаются ученики 7-12 классов. С собой иметь спортивную форму и сменную обувь!",
        image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=80",
        authorId: owner.id,
      },
      {
        clubId: club2.id,
        title: "Товарищеский турнир по волейболу",
        content: "В субботу состоится товарищеский матч между параллелями 9-11 классов. Приходите поддержать свои команды!",
        image: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&auto=format&fit=crop&q=80",
        authorId: owner.id,
      },
    ],
  })

  await prisma.achievement.deleteMany({
    where: { clubId: { in: [club1.id, club2.id] } },
  })
  await prisma.achievement.createMany({
    data: [
      {
        clubId: club1.id,
        title: "1 место в городской лиге по баскетболу",
        description: "Команда NIS одержала победу в финале городского чемпионата среди школьников",
        date: "2024-11-20",
        icon: "🏆",
      },
      {
        clubId: club2.id,
        title: "Серебряные призеры регионального первенства",
        description: "Наша волейбольная сборная завоевала 2 место на кубке области",
        date: "2024-10-15",
        icon: "🥈",
      },
    ],
  })

  await prisma.community.upsert({
    where: { id: "comm-sport" },
    update: {},
    create: {
      id: "comm-sport",
      name: "NIS Спорт Кызылорда",
      description: "Официальное спортивное сообщество NIS: баскетбол, волейбол, тренировки и школьные турниры.",
      link: "https://t.me/nis_sport_kzo",
      icon: "🏀",
      platform: "Telegram",
      memberCount: 230,
    },
  })

  console.log("Seed completed.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
