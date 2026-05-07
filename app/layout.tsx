'use client';

import dynamic from 'next/dynamic'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const DataProvider = dynamic(() => import('@/app/context/DataContext').then(m => m.DataProvider), { ssr: false })
const AppSidebar = dynamic(() => import('@/components/app-sidebar').then(m => m.AppSidebar), { ssr: false })
const AppHeader = dynamic(() => import('@/components/app-sidebar').then(m => m.AppHeader), { ssr: false })
const SidebarProvider = dynamic(() => import('@/components/ui/sidebar').then(m => m.SidebarProvider), { ssr: false })
const SidebarInset = dynamic(() => import('@/components/ui/sidebar').then(m => m.SidebarInset), { ssr: false })

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <DataProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <AppHeader />
                <main className="flex-1 overflow-auto p-4 lg:p-6">
                  {children}
                </main>
              </SidebarInset>
            </SidebarProvider>
            <Toaster position="top-right" richColors />
          </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
