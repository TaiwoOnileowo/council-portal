import {
  Bus,
  Handshake,
  LayoutDashboard,
  UserStar,
  Wallet,
} from "lucide-react";
import type { ElementType } from "react";

export interface SidebarNavItem {
  label: string;
  icon: ElementType;
  href: string;
  badge?: string | number | null;
  // Marks this item active when pathname starts with href + "/"
  // — needed for parent routes with nested detail pages (e.g. /admin/vendors/[id])
  matchPrefix?: boolean;
}

export interface SidebarNavGroup {
  label: string;
  items: SidebarNavItem[];
}

export type SidebarVariant = "student" | "vendor" | "admin";

export const SIDEBAR_CONFIG: Record<
  SidebarVariant,
  { subtitle: string; auth: string; home: string; navGroups: SidebarNavGroup[] }
> = {
  student: {
    subtitle: "Student Portal",
    auth: "/gate",
    home: "/",
    navGroups: [
      {
        label: "Menu",
        items: [{ label: "Home", icon: LayoutDashboard, href: "/" }],
      },
      {
        label: "Services",
        items: [{ label: "Transport", icon: Bus, href: "/transport" }],
      },
      {
        label: "Account",
        items: [
          { label: "Profile", icon: UserStar, href: "/profile" },
          { label: "Wallet", icon: Wallet, href: "/wallet" },
        ],
      },
    ],
  },
  vendor: {
    subtitle: "Vendor Portal",
    auth: "/vendor-gate",
    home: "/vendor-dashboard",
    navGroups: [
      {
        label: "Menu",
        items: [
          { label: "Home", icon: LayoutDashboard, href: "/vendor-dashboard" },
        ],
      },
      {
        label: "Account",
        items: [
          {
            label: "Profile",
            icon: UserStar,
            href: "/vendor-dashboard/profile",
          },
          { label: "Earnings", icon: Wallet, href: "/vendor-dashboard/wallet" },
        ],
      },
    ],
  },
  admin: {
    subtitle: "Admin Portal",
    auth: "/admin-gate",
    home: "/admin",
    navGroups: [
      {
        label: "Menu",
        items: [{ label: "Home", icon: LayoutDashboard, href: "/admin" }],
      },
      {
        label: "Management",
        items: [
          { label: "Students", icon: UserStar, href: "/admin/students" },
          {
            label: "Vendors",
            icon: Handshake,
            href: "/admin/vendors",
            matchPrefix: true,
          },
        ],
      },

      {
        label: "Finance",
        items: [{ label: "Earnings", icon: Wallet, href: "/admin/wallet" }],
      },
    ],
  },
};
