import { ReactNode } from "react";
import Link from "next/link";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata = { 
  title: "PDF Review Dashboard",
  description: "AI-powered PDF invoice management system"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <div className="mr-4 hidden md:flex">
              <Link className="mr-6 flex items-center space-x-2" href="/">
                <span className="hidden font-bold sm:inline-block">
                  PDF Review Dashboard
                </span>
              </Link>
              <nav className="flex items-center space-x-6 text-sm font-medium">
                <Link
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                  href="/"
                >
                  Dashboard
                </Link>
                <Link
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                  href="/upload"
                >
                  Upload
                </Link>
              </nav>
            </div>
            <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
              <div className="w-full flex-1 md:w-auto md:flex-none">
                <div className="md:hidden">
                  <Link className="flex items-center space-x-2" href="/">
                    <span className="font-bold">PDF Dashboard</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <div className="container py-6">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t py-6 md:py-0">
          <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
            <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
              <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                Built with Next.js, TypeScript, and shadcn/ui.
              </p>
            </div>
          </div>
        </footer>

        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
