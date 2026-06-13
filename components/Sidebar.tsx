"use client";

import { useQueryClient } from "@tanstack/react-query";
import { signOutUser } from "@/lib/actions/user.action";
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import { Bus, Home, LogOut, Menu, User, Wallet, X } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface SidebarNavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: string | number | null;
}

interface SidebarNavGroup {
  label: string;
  items: SidebarNavItem[];
}

export type SidebarVariant = "student" | "vendor";

const SIDEBAR_CONFIG: Record<
  SidebarVariant,
  { subtitle: string; navGroups: SidebarNavGroup[] }
> = {
  student: {
    subtitle: "Student Portal",
    navGroups: [
      { label: "Menu", items: [{ label: "Home", icon: Home, href: "/" }] },
      {
        label: "Services",
        items: [{ label: "Transport", icon: Bus, href: "/transport" }],
      },
      {
        label: "Account",
        items: [
          { label: "Profile", icon: User, href: "/profile" },
          { label: "Wallet", icon: Wallet, href: "/wallet" },
        ],
      },
    ],
  },
  vendor: {
    subtitle: "Vendor Portal",
    navGroups: [
      {
        label: "Menu",
        items: [{ label: "Home", icon: Home, href: "/vendor-dashboard" }],
      },
      {
        label: "Account",
        items: [
          { label: "Profile", icon: User, href: "/vendor-dashboard/profile" },
          { label: "Earnings", icon: Wallet, href: "/vendor-dashboard/wallet" },
        ],
      },
    ],
  },
};

interface SidebarProps {
  variant: SidebarVariant;
}

interface NavGroupProps extends SidebarNavGroup {
  pathname: string;
}

function NavGroup({ label, items, pathname }: NavGroupProps) {
  return (
    <div className="mb-6">
      <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-portal-muted">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13.5px] font-medium transition-all duration-200",
                isActive
                  ? "bg-portal-accent-bg text-portal-accent font-semibold"
                  : "text-portal-text2 hover:bg-portal-accent-bg/50 hover:text-portal-text",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-portal-accent-bg rounded-[10px]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <Icon
                className={cn(
                  "relative z-10 w-[18px] h-[18px] flex-shrink-0",
                  isActive ? "text-portal-accent" : "text-portal-muted",
                )}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span className="relative z-10">{item.label}</span>
              {item.badge && (
                <span className="relative z-10 ml-auto bg-portal-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Sidebar({ variant }: SidebarProps) {
  const { subtitle, navGroups } = SIDEBAR_CONFIG[variant];
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  async function handleLogout() {
    queryClient.clear();
    await signOutUser();
  }

  const displayName = user?.fullName ?? (user?.student ? "Student" : "Vendor");
  const secondaryLine = user?.student
    ? `${user.student.matricNumber} · ${user.student.level}L`
    : (user?.email ?? "");

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 h-14 bg-portal-surface border-b border-portal-border px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Logo"
            width={28}
            height={28}
            className="rounded-lg"
          />
          <span className="font-heading text-[13.5px] font-bold text-portal-text">
            CU Student Council
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-portal-muted hover:bg-portal-accent-bg/50 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 w-[260px] bg-portal-surface border-r border-portal-border flex flex-col z-40 transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="px-4 pt-6 pb-5 relative">
          <button
            className="lg:hidden absolute top-4 right-4 p-1.5 rounded-lg text-portal-muted hover:bg-portal-accent-bg/50 transition-colors"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 pb-5 border-b border-portal-border mb-5">
            <Image
              src="/logo.png"
              alt="Logo"
              width={36}
              height={36}
              className="rounded-[10px] flex-shrink-0"
            />
            <div>
              <div className="font-heading text-sm font-bold leading-tight text-portal-text">
                CU Student Council
              </div>
              <div className="text-[11px] text-portal-muted">{subtitle}</div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto">
            {navGroups.map((group) => (
              <NavGroup
                key={group.label}
                label={group.label}
                items={group.items}
                pathname={pathname}
              />
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-portal-border px-4 py-4">
          <div className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl bg-portal-accent-bg/50 hover:bg-portal-accent-bg/502 transition-colors">
            {user?.image ? (
              <Image
                src={user.image}
                alt={displayName}
                width={32}
                height={32}
                className="rounded-full flex-shrink-0 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-portal-accent flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[11px] font-bold">
                  {displayName.charAt(0)}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-portal-text truncate">
                {displayName}
              </div>
              <div className="text-[11px] text-portal-muted truncate">
                {secondaryLine}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-portal-muted hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
