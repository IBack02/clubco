const BASE = ""

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    cache: "no-store",
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    credentials: "include",
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error || "Ошибка запроса")
  return data as T
}

export const api = {
  auth: {
    me: () => fetchJson<{ user: import("./types").User | null }>("/api/auth/me"),
    register: (data: { name: string; email: string; phone?: string; password: string }) =>
      fetchJson<{ user: import("./types").User }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    login: (email: string, password: string) =>
      fetchJson<{ user: import("./types").User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    logout: () => fetchJson<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
    updateMe: (data: { name?: string; email?: string; phone?: string; password?: { current: string; next: string } }) =>
      fetchJson<{ user: import("./types").User }>("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },
  clubs: {
    list: (params?: { city?: string; category?: string }) => {
      const sp = new URLSearchParams()
      if (params?.city) sp.set("city", params.city)
      if (params?.category) sp.set("category", params.category)
      const q = sp.toString()
      return fetchJson<import("./types").Club[]>("/api/clubs" + (q ? "?" + q : ""));
    },
    get: (id: string) =>
      fetchJson<import("./types").Club & { owners?: { id: string; name: string; email: string; grade?: string; phone?: string; bio?: string }[] }>(
        "/api/clubs/" + encodeURIComponent(id)
      ),
    update: (
      id: string,
      data: {
        name?: string
        shortDescription?: string
        description?: string
        coverImage?: string
        city?: string
        categories?: string[]
        schedule?: { day: string; time: string; room: string }[]
        links?: { telegram?: string; whatsapp?: string; website?: string }
      }
    ) =>
      fetchJson<import("./types").Club>("/api/clubs/" + encodeURIComponent(id), {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<{ success: boolean; message: string }>("/api/clubs/" + encodeURIComponent(id), {
        method: "DELETE",
      }),
    announcements: (clubId: string) =>
      fetchJson<import("./types").Announcement[]>("/api/clubs/" + encodeURIComponent(clubId) + "/announcements"),
    createAnnouncement: (clubId: string, data: { title: string; content: string; image?: string }) =>
      fetchJson<import("./types").Announcement>("/api/clubs/" + encodeURIComponent(clubId) + "/announcements", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    achievements: (clubId: string) =>
      fetchJson<import("./types").Achievement[]>("/api/clubs/" + encodeURIComponent(clubId) + "/achievements"),
    createAchievement: (clubId: string, data: { title: string; description: string; date: string; image?: string; icon?: string }) =>
      fetchJson<import("./types").Achievement>("/api/clubs/" + encodeURIComponent(clubId) + "/achievements", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    join: (clubId: string, data: { name?: string; grade?: string; contacts?: string } = {}) =>
      fetchJson<{ ok: boolean; request: import("./types").JoinRequest }>("/api/clubs/" + encodeURIComponent(clubId) + "/join", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  announcements: {
    comment: (id: string, content: string) =>
      fetchJson<import("./types").Comment>("/api/announcements/" + encodeURIComponent(id) + "/comments", {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    setLike: (id: string, liked: boolean) =>
      fetchJson<{ likes: string[] }>("/api/announcements/" + encodeURIComponent(id) + "/like", {
        method: liked ? "PUT" : "DELETE",
      }),
  },
  joinRequests: {
    list: () => fetchJson<import("./types").JoinRequest[]>("/api/join-requests"),
  },
  requests: {
    list: () => fetchJson<import("./types").ClubRequest[]>("/api/requests"),
    create: (data: {
      clubName: string
      description: string
      goals: string
      schedule: { day: string; time: string; room: string }[]
      curator?: string
      contacts: string
    }) =>
      fetchJson<import("./types").ClubRequest>("/api/requests", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    approve: (
      id: string,
      data: { name: string; shortDescription: string; description: string; coverImage: string; schedule: { day: string; time: string; room: string }[] }
    ) =>
      fetchJson<{ club: import("./types").Club }>("/api/requests/" + encodeURIComponent(id) + "/approve", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    reject: (id: string, data: { adminComment?: string }) =>
      fetchJson<{ ok: boolean }>("/api/requests/" + encodeURIComponent(id) + "/reject", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  communities: {
    list: () => fetchJson<import("./types").Community[]>("/api/communities"),
  },
}
