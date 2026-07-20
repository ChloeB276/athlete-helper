import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppSidebar } from "~/components/app-sidebar";
import { Navbar } from "~/components/navbar";
import { createClient } from "~/lib/supabase/server";
import { ThemeProvider } from "./theme-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Athlete Helper",
  description: "Built with create-lumos-app",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let role: "coach" | "player" | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, role")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.is_admin ?? false;
    role = profile?.role ?? null;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          {user ? (
            <div className="flex min-h-svh flex-col md:flex-row">
              <AppSidebar
                role={role}
                isAdmin={isAdmin}
                userEmail={user.email ?? ""}
              />
              <main className="min-w-0 flex-1">{children}</main>
            </div>
          ) : (
            <>
              <Navbar />
              {children}
            </>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
