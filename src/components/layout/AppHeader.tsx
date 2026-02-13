"use client";

import { Bell, CircleUser, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeaderSearch from "@/components/search/HeaderSearch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthActions, useSession } from "@/lib/auth/session";

export default function AppHeader() {
  const { userId } = useSession();
  const { logout } = useAuthActions();
  const isAuthed = userId != null;

  const params = useParams() as { locale?: "it" | "en" };
  const locale = params?.locale ?? "it";
  const router = useRouter();
  const qc = useQueryClient();

  const onLogout = async () => {
    await logout();
    qc.clear();
    router.replace(`/${locale}/login`);
  };

  return (
    <header className="flex w-full items-center gap-3">
      <Link
        href={`/${locale}`}
        className="select-none text-xl font-bold tracking-tight md:text-2xl"
        aria-label="Ager home"
      >
        Ager
      </Link>

      <div className="relative ml-auto hidden w-full max-w-sm items-center md:flex">
        <HeaderSearch />
      </div>

      <div className="ml-auto flex items-center gap-2 md:ml-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Menu">
              <Bell className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled>
              {locale === "it" ? "Notifiche: presto disponibili" : "Notifications: coming soon"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {isAuthed ? (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              asChild
              aria-label={locale === "it" ? "Profilo" : "Profile"}
              title={locale === "it" ? "Profilo" : "Profile"}
            >
              <Link href={`/${locale}/profile`}>
                <CircleUser className="h-5 w-5" />
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={locale === "it" ? "Impostazioni" : "Settings"}
                  title={locale === "it" ? "Impostazioni" : "Settings"}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/profile`}>{locale === "it" ? "Profilo" : "Profile"}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={onLogout}>
                  {locale === "it" ? "Esci" : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button size="sm" variant="default" asChild>
            <Link href={`/${locale}/login`}>{locale === "it" ? "Accedi" : "Sign in"}</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
