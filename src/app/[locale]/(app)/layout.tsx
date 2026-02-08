import AppHeader from "@/components/layout/AppHeader";
import AppSidebar from "@/components/layout/AppSidebar";
import MobileTabBar from "@/components/layout/MobileTabBar";
import RequireAuth from "@/components/auth/RequireAuth";
import { Suspense } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Top header */}
      <header
        className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        role="banner"
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <Suspense fallback={null}>
            <AppHeader />
          </Suspense>
        </div>
      </header>

      {/* Content + sidebar */}
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden md:block" role="complementary" aria-label="Sidebar">
          <AppSidebar />
        </aside>

        {/* Add bottom padding on mobile so the fixed tab bar doesn't cover content */}
        <main className="min-w-0 pb-16 md:pb-0" role="main" id="content">
          <RequireAuth>{children}</RequireAuth>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 md:hidden"
        role="navigation"
        aria-label="Bottom navigation"
      >
        <div className="mx-auto max-w-6xl">
          <MobileTabBar />
        </div>
      </nav>
    </div>
  );
}
