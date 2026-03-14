"use client";

import { cn } from "@/lib/utils";
import { Home, User, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import Image from "next/image";
import { signOutUser } from "@/lib/actions/user.action";

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

type VendorSidebarUser = {
  name: string;
  email: string;
  image?: string | null;
};

export default function VendorSidebar({ vendor }: { vendor?: VendorSidebarUser | null }) {
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
              alt={vendor.name}
              width={32}
              height={32}
              className="rounded-full flex-shrink-0 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-portal-accent flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[11px] font-bold">
                {vendor?.name?.charAt(0) ?? "V"}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-portal-text truncate">
              {vendor?.name ?? "Vendor"}
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
  );
}
