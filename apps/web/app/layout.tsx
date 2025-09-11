import { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";
import { AuthProvider } from "../lib/auth-context";
import AppHeader from "../components/layout/AppHeader";

export const metadata = { 
  title: "PDF Review Dashboard",
  description: "AI-powered PDF invoice management system"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="light">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <AuthProvider>
          <AppHeader />
          
          {/* Page Content */}
          <main className="flex-1">
            {children}
          </main>

          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
