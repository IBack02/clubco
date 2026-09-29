import assert from "node:assert/strict"
import { test } from "node:test"
import { spawn } from "node:child_process"
import { once } from "node:events"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { randomBytes } from "node:crypto"
import { setTimeout as delay } from "node:timers/promises"
import { PrismaClient } from "@prisma/client"

const root = fileURLToPath(new URL("../", import.meta.url))

function run(script, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd: root, env: { ...env, RUST_LOG: "info" }, windowsHide: true, timeout: 60000,
    })
    let output = ""
    child.stdout.on("data", (chunk) => { output += chunk })
    child.stderr.on("data", (chunk) => { output += chunk })
    child.on("error", reject)
    child.on("close", (code) => code === 0 ? resolve(output) : reject(new Error(output)))
  })
}

test("local SQLite API persists data and processes requests atomically", { timeout: 180000 }, async (t) => {
  const temp = await mkdtemp(path.join(tmpdir(), "nis-clubs-test-"))
  const databaseUrl = `file:${path.join(temp, "test.db").replaceAll("\\", "/")}`
  const env = { ...process.env, DATABASE_URL: databaseUrl, AUTH_SECRET: randomBytes(32).toString("hex"), NODE_ENV: "production" }
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } })
  let server
  let baseUrl
  let serverOutput = ""

  async function stopServer() {
    if (!server || server.exitCode !== null) return
    const closed = once(server, "exit")
    server.kill()
    await closed
    server = undefined
  }

  async function startServer() {
    serverOutput = ""
    server = spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", "0"], {
      cwd: root, env, windowsHide: true,
    })
    let startupError
    server.on("error", (error) => { startupError = error })
    server.stdout.on("data", (chunk) => { serverOutput += chunk })
    server.stderr.on("data", (chunk) => { serverOutput += chunk })
    for (let attempt = 0; attempt < 200; attempt++) {
      if (startupError) throw startupError
      if (server.exitCode !== null) throw new Error(serverOutput)
      const address = serverOutput.match(/http:\/\/127\.0\.0\.1:(\d+)/)
      if (address) {
        baseUrl = address[0]
        try {
          const response = await fetch(baseUrl + "/api/clubs", { signal: AbortSignal.timeout(2000) })
          if (response.ok) return
        } catch {}
      }
      await delay(100)
    }
    throw new Error("Server did not become ready: " + serverOutput)
  }

  function client() {
    let cookie = ""
    return async (url, method = "GET", body, expected = 200) => {
      const response = await fetch(baseUrl + url, {
        method,
        headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      const setCookie = response.headers.get("set-cookie")
      if (setCookie) cookie = setCookie.split(";")[0]
      const raw = await response.text()
      let data
      try {
        data = JSON.parse(raw)
      } catch {
        throw new Error(`${method} ${url}: HTTP ${response.status} ${raw}\n${serverOutput.slice(-4000)}`)
      }
      assert.equal(response.status, expected, `${method} ${url}: ${JSON.stringify(data)}`)
      return data
    }
  }

  t.after(async () => {
    await stopServer()
    await prisma.$disconnect()
    // Delete only the unique temporary directory created by this test.
    const resolved = path.resolve(temp)
    assert.equal(path.dirname(resolved), path.resolve(tmpdir()))
    assert.ok(path.basename(resolved).startsWith("nis-clubs-test-"))
    await rm(resolved, { recursive: true, force: true })
  })

  const cli = path.join(root, "node_modules/prisma/build/index.js")
  const seed = path.join(root, "node_modules/tsx/dist/cli.mjs")
  await run(cli, ["migrate", "deploy"], env)

  await t.test("initializes an empty DB and preserves existing data on repeated setup/seed", async () => {
    await run(seed, ["prisma/seed.ts"], env)
    assert.equal(await prisma.user.count(), 3)
    assert.equal(await prisma.club.count(), 3)
    await prisma.user.update({ where: { email: "daniyar@nis.edu.kz" }, data: { bio: "Keep this edit" } })
    const models = ["user", "club", "clubOwner", "clubMember", "announcement", "comment", "announcementLike", "achievement", "clubRequest", "community"]
    const before = await Promise.all(models.map((name) => prisma[name].count()))
    await run(cli, ["migrate", "deploy"], env)
    await run(seed, ["prisma/seed.ts"], env)
    assert.deepEqual(await Promise.all(models.map((name) => prisma[name].count())), before)
    assert.equal((await prisma.user.findUnique({ where: { email: "daniyar@nis.edu.kz" } })).bio, "Keep this edit")
  })

  await startServer()
  const guest = client()
  const student = client()
  const admin = client()
  const owner = client()
  const outsider = client()
  let studentId
  let proposed
  let approvedClub
  let comment
  let announcement
  const schedule = [{ day: "Понедельник", time: "15:00-16:00", room: "101" }]
  const proposal = { clubName: "Шахматы API", description: "Шахматный клуб", goals: "Учиться", schedule, contacts: "test@example.com" }
  const approval = { name: proposal.clubName, shortDescription: "Шахматы", description: proposal.description, coverImage: "/placeholder.jpg", schedule }

  await t.test("registers, authenticates, saves profile and rejects unauthenticated writes", async () => {
    await guest("/api/requests", "POST", proposal, 401)
    await guest("/api/clubs/club-1/join", "POST", {}, 401)
    const { user } = await student("/api/auth/register", "POST", {
      name: "API Ученик", email: "local-test@example.com", password: "test-password", phone: "+77001112233",
    }, 201)
    studentId = user.id
    const row = await prisma.user.findUnique({ where: { id: studentId } })
    assert.notEqual(row.passwordHash, "test-password")
    await student("/api/auth/me", "PATCH", { name: "Сохранённое имя" })
    assert.equal((await student("/api/auth/me")).user.name, "Сохранённое имя")
    await admin("/api/auth/login", "POST", { email: "aidar@nis.edu.kz", password: "password" })
    await owner("/api/auth/login", "POST", { email: "alina@nis.edu.kz", password: "password" })
    await outsider("/api/auth/login", "POST", { email: "daniyar@nis.edu.kz", password: "password" })
  })

  await t.test("stores joins and membership together; duplicates and failed writes do not change counts", async () => {
    const before = (await guest("/api/clubs/club-1")).memberCount
    await prisma.$executeRawUnsafe(`CREATE TRIGGER fail_test_join BEFORE INSERT ON join_requests BEGIN SELECT RAISE(ABORT, 'test failure'); END`)
    await student("/api/clubs/club-1/join", "POST", {}, 500)
    assert.equal(await prisma.clubMember.count({ where: { userId: studentId } }), 0)
    assert.equal((await guest("/api/clubs/club-1")).memberCount, before)
    await prisma.$executeRawUnsafe("DROP TRIGGER fail_test_join")
    const joined = await student("/api/clubs/club-1/join", "POST", { grade: "10A", contacts: "test-contact" }, 201)
    assert.equal(joined.request.name, "Сохранённое имя")
    assert.equal(joined.request.contacts, "test-contact")
    assert.equal(joined.request.status, "approved")
    await student("/api/clubs/club-1/join", "POST", {}, 409)
    assert.equal(await prisma.joinRequest.count({ where: { userId: studentId } }), 1)
    assert.equal((await guest("/api/clubs/club-1")).memberCount, before + 1)
    assert.equal((await student("/api/join-requests")).length, 1)
    assert.equal((await owner("/api/join-requests")).length, 1)
    assert.equal((await outsider("/api/join-requests")).length, 0)
    await guest("/api/join-requests", "GET", undefined, 401)
  })

  await t.test("validates and stores proposals, restricts access and approves atomically", async () => {
    await student("/api/requests", "POST", { ...proposal, clubName: 5 }, 400)
    await student("/api/requests", "POST", { ...proposal, schedule: [{}] }, 400)
    proposed = await student("/api/requests", "POST", proposal, 201)
    assert.equal(proposed.status, "pending")
    assert.equal((await student("/api/requests")).length, 1)
    assert.ok(!(await outsider("/api/requests")).some((row) => row.id === proposed.id))
    await student(`/api/requests/${proposed.id}/approve`, "POST", approval, 403)
    await prisma.$executeRawUnsafe(`CREATE TRIGGER fail_test_club BEFORE INSERT ON clubs BEGIN SELECT RAISE(ABORT, 'test failure'); END`)
    await admin(`/api/requests/${proposed.id}/approve`, "POST", approval, 500)
    assert.equal((await prisma.clubRequest.findUnique({ where: { id: proposed.id } })).status, "pending")
    assert.equal(await prisma.club.count(), 3)
    await prisma.$executeRawUnsafe("DROP TRIGGER fail_test_club")
    approvedClub = (await admin(`/api/requests/${proposed.id}/approve`, "POST", approval, 201)).club
    assert.equal(approvedClub.memberCount, 1)
    assert.deepEqual(approvedClub.ownerIds, [studentId])
    await admin(`/api/requests/${proposed.id}/approve`, "POST", approval, 409)
    await admin(`/api/requests/${proposed.id}/reject`, "POST", {}, 409)
    assert.equal(await prisma.club.count(), 4)
    const rejected = await student("/api/requests", "POST", { ...proposal, clubName: "Вторая заявка" }, 201)
    await admin(`/api/requests/${rejected.id}/reject`, "POST", { adminComment: "Нужно уточнение" })
    const saved = await prisma.clubRequest.findUnique({ where: { id: rejected.id } })
    assert.equal(saved.status, "rejected")
    assert.equal(saved.adminComment, "Нужно уточнение")
  })

  await t.test("persists club edits, announcements, achievements, comments and idempotent likes", async () => {
    await student(`/api/clubs/${approvedClub.id}`, "PUT", { description: "Новое описание", schedule })
    announcement = await student(`/api/clubs/${approvedClub.id}/announcements`, "POST", { title: "Новость", content: "Первая встреча" })
    await student(`/api/clubs/${approvedClub.id}/achievements`, "POST", { title: "Победа", description: "Турнир", date: "2026-09-14" })
    await guest(`/api/announcements/${announcement.id}/comments`, "POST", { content: "guest" }, 401)
    await student(`/api/announcements/${announcement.id}/comments`, "POST", { content: "  " }, 400)
    await student("/api/announcements/missing/comments", "POST", { content: "text" }, 404)
    comment = await student(`/api/announcements/${announcement.id}/comments`, "POST", { content: "  Сохраняется в SQLite  " }, 201)
    assert.equal(comment.content, "Сохраняется в SQLite")
    assert.equal(comment.userId, studentId)
    assert.equal(comment.userName, "Сохранённое имя")
    await guest(`/api/announcements/${announcement.id}/like`, "PUT", undefined, 401)
    await student(`/api/announcements/${announcement.id}/like`, "PUT")
    assert.deepEqual((await student(`/api/announcements/${announcement.id}/like`, "PUT")).likes, [studentId])
    assert.deepEqual((await student(`/api/announcements/${announcement.id}/like`, "DELETE")).likes, [])
    assert.deepEqual((await student(`/api/announcements/${announcement.id}/like`, "DELETE")).likes, [])
    await student(`/api/announcements/${announcement.id}/like`, "PUT")
    assert.equal(await prisma.comment.count({ where: { id: comment.id } }), 1)
    assert.equal(await prisma.announcementLike.count({ where: { announcementId: announcement.id } }), 1)
  })

  await t.test("retains sessions and all submitted data across a server restart", async () => {
    await stopServer()
    await prisma.$disconnect()
    await startServer()
    const { user } = await student("/api/auth/me")
    assert.equal(user.name, "Сохранённое имя")
    assert.ok(user.clubMemberships.includes("club-1"))
    assert.ok(user.ownedClubs.includes(approvedClub.id))
    assert.equal((await student("/api/requests")).find((row) => row.id === proposed.id).status, "approved")
    assert.equal((await student("/api/join-requests"))[0].contacts, "test-contact")
    const persisted = (await guest(`/api/clubs/${approvedClub.id}/announcements`))[0]
    assert.equal(persisted.comments[0].id, comment.id)
    assert.deepEqual(persisted.likes, [studentId])
    assert.equal((await guest(`/api/clubs/${approvedClub.id}`)).description, "Новое описание")
    assert.equal((await guest(`/api/clubs/${approvedClub.id}/achievements`)).length, 1)
  })
})
