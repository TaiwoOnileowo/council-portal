"use client";

import { signOutUser } from "@/lib/actions/user.action";
import { cn } from "@/lib/utils";
import { Bus, Home, LogOut, User } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const mainNav = [{ label: "Home", icon: Home, href: "/", badge: null }];

const servicesNav = [
  { label: "Transport", icon: Bus, href: "/transport", badge: null },
];

const accountNav = [
  { label: "Profile", icon: User, href: "/profile", badge: null },
];

interface NavGroupProps {
  label: string;
  items: typeof mainNav;
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
                  : "text-portal-text2 hover:bg-portal-bg hover:text-portal-text",
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

type SidebarUser = {
  name: string;
  matricNumber: string;
  level: string;
};

export default function Sidebar({ user }: { user?: SidebarUser | null }) {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-[260px] bg-portal-surface border-r border-portal-border flex flex-col z-10">
      <div className="px-4 pt-6 pb-5">
        {/* Logo */}
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
            <div className="text-[11px] text-portal-muted">Student Portal</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <NavGroup label="Menu" items={mainNav} pathname={pathname} />
          <NavGroup label="Services" items={servicesNav} pathname={pathname} />
          <NavGroup label="Account" items={accountNav} pathname={pathname} />
        </nav>
      </div>

      {/* User pill */}
      <div className="mt-auto border-t border-portal-border px-4 py-4">
        <div className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl bg-portal-bg hover:bg-portal-bg2 transition-colors">
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-portal-text truncate">
              {user?.name ?? "Student"}
            </div>
            <div className="text-[11px] text-portal-muted truncate">
              {user ? `${user.matricNumber} · ${user.level}L` : ""}
            </div>
          </div>
          <form action={signOutUser}>
            <button
              type="submit"
              title="Logout"
              className="p-1.5 rounded-lg text-portal-muted hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
