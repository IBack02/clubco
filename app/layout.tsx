import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "NIS CLUBS - Школьная платформа клубов",
  description: "Платформа для просмотра и управления школьными клубами",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`${GeistSans.variable} antialiased`}>
      <body className="min-h-screen flex flex-col font-sans">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
