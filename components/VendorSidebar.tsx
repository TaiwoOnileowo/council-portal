"use client";

import { cn } from "@/lib/utils";
import { Home, User, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import Image from "next/image";
import { signOutUser } from "@/lib/actions/user.action";
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";
import { useState, useEffect } from "react";

const mainNav = [
  { label: "Home", icon: Home, href: "/vendor-dashboard" },
  { label: "Profile", icon: User, href: "/vendor-dashboard/profile" },
];

interface NavItemProps {
  label: string;
  icon: React.ElementType;
  href: string;
  isActive: boolean;
}

function NavItem({ label, icon: Icon, href, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13.5px] font-medium transition-all duration-200",
        isActive
          ? "bg-portal-accent-bg text-portal-accent font-semibold"
          : "text-portal-text2 hover:bg-portal-bg hover:text-portal-text",
      )}
    >
      {isActive && (
        <motion.div
          layoutId="vendor-sidebar-active"
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
      <span className="relative z-10">{label}</span>
    </Link>
  );
}

export default function VendorSidebar() {
  const { data: vendor } = useCurrentUser();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile top bar */}
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
            Vendor Portal
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-portal-muted hover:bg-portal-bg transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 w-[260px] bg-portal-surface border-r border-portal-border flex flex-col z-40 transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="px-4 pt-6 pb-5 relative">
          {/* Mobile close button */}
          <button
            className="lg:hidden absolute top-4 right-4 p-1.5 rounded-lg text-portal-muted hover:bg-portal-bg transition-colors"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>

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
              <div className="text-[11px] text-portal-muted">Vendor Portal</div>
            </div>
          </div>

          {/* Navigation */}
          <nav>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-portal-muted">
              Menu
            </p>
            <div className="space-y-0.5">
              {mainNav.map((item) => (
                <NavItem
                  key={item.href}
                  label={item.label}
                  icon={item.icon}
                  href={item.href}
                  isActive={pathname === item.href}
                />
              ))}
            </div>
          </nav>
        </div>

        {/* Vendor pill */}
        <div className="mt-auto border-t border-portal-border px-4 py-4">
          <div className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl bg-portal-bg hover:bg-portal-bg2 transition-colors">
            {vendor?.image ? (
              <Image
                src={vendor.image}
                alt={vendor.fullName}
                width={32}
                height={32}
                className="rounded-full flex-shrink-0 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-portal-accent flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[11px] font-bold">
                  {vendor?.fullName?.charAt(0) ?? "V"}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-portal-text truncate">
                {vendor?.fullName ?? "Vendor"}
              </div>
              <div className="text-[11px] text-portal-muted truncate">
                {vendor?.email ?? ""}
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
    </>
  );
}
