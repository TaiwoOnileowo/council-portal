"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

const PAGE_SIZE = 25;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Unauthorized");
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export type AdminRecentBooking = {
  id: string;
  reference: string;
  passengerName: string;
  vendorName: string;
  routeName: string;
  fare: number;
  commission: number;
  status: string;
  createdAt: string;
};

export type AdminRecentUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
};

export type DashboardStats = {
  totalStudents: number;
  totalVendors: number;
  activeVendors: number;
  bookingsThisMonth: number;
  totalCommissionNaira: number;
  recentBookings: AdminRecentBooking[];
  recentSignups: AdminRecentUser[];
};

export async function getAdminDashboardStats(): Promise<
  { ok: true; data: DashboardStats } | { ok: false; error: string }
> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    totalStudents,
    totalVendors,
    activeVendors,
    bookingsThisMonth,
    commissionAgg,
    recentBookingsRaw,
    recentSignupsRaw,
  ] = await Promise.all([
    db.user.count({ where: { role: "STUDENT" } }),
    db.user.count({ where: { role: "VENDOR" } }),
    db.vendor_profile.count({ where: { is_active: true } }),
    db.booking.count({
      where: { status: "CONFIRMED", created_at: { gte: monthStart } },
    }),
    db.booking.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { commission: true },
    }),
    db.booking.findMany({
      take: 10,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        reference: true,
        passenger_name: true,
        route_name: true,
        fare: true,
        commission: true,
        status: true,
        created_at: true,
        vendor: { select: { business_name: true } },
      },
    }),
    db.user.findMany({
      take: 5,
      orderBy: { created_at: "desc" },
      where: { role: { in: ["STUDENT", "VENDOR"] } },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        created_at: true,
      },
    }),
  ]);

  return {
    ok: true,
    data: {
      totalStudents,
      totalVendors,
      activeVendors,
      bookingsThisMonth,
      totalCommissionNaira: commissionAgg._sum.commission ?? 0,
      recentBookings: recentBookingsRaw.map((b) => ({
        id: b.id,
        reference: b.reference,
        passengerName: b.passenger_name,
        vendorName: b.vendor.business_name,
        routeName: b.route_name,
        fare: b.fare,
        commission: b.commission,
        status: b.status,
        createdAt: b.created_at.toISOString(),
      })),
      recentSignups: recentSignupsRaw.map((u) => ({
        id: u.id,
        fullName: `${u.first_name} ${u.last_name}`,
        email: u.email,
        role: u.role,
        createdAt: u.created_at.toISOString(),
      })),
    },
  };
}

// ── Users ─────────────────────────────────────────────────────────────────────

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  matricNumber: string;
  department: string;
  level: string;
  createdAt: string;
};

export async function getAdminUsers({
  page = 0,
  search = "",
  level = "",
}: {
  page?: number;
  search?: string;
  level?: string;
} = {}): Promise<
  { ok: true; data: AdminUser[]; total: number } | { ok: false; error: string }
> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const where: Record<string, any> = { role: "STUDENT" };
  if (level) where.student_profile = { level: `L${level}` };
  if (search) {
    where.OR = [
      { first_name: { contains: search, mode: "insensitive" } },
      { last_name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      {
        student_profile: {
          matric_number: { contains: search, mode: "insensitive" },
        },
      },
    ];
  }

  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      include: { student_profile: true },
      orderBy: { created_at: "desc" },
      skip: page * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return {
    ok: true,
    total,
    data: users.map((u) => ({
      id: u.id,
      fullName: `${u.first_name} ${u.last_name}`,
      email: u.email,
      phone: u.phone,
      matricNumber: u.student_profile?.matric_number ?? "",
      department: u.student_profile?.department ?? "",
      level: u.student_profile?.level?.replace("L", "") ?? "",
      createdAt: u.created_at.toISOString(),
    })),
  };
}

// ── Vendors ───────────────────────────────────────────────────────────────────

export type AdminVendor = {
  userId: string;
  businessName: string;
  ownerName: string;
  email: string;
  category: string;
  isActive: boolean;
  bankLinked: boolean;
  bookingCount: number;
  totalCommissionNaira: number;
};

export async function getAdminVendors(): Promise<
  { ok: true; data: AdminVendor[] } | { ok: false; error: string }
> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const [vendors, commissions] = await Promise.all([
    db.vendor_profile.findMany({
      include: {
        user: { select: { first_name: true, last_name: true, email: true } },
        _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
      },
      orderBy: { user: { created_at: "desc" } },
    }),
    db.booking.groupBy({
      by: ["vendor_id"],
      where: { status: "CONFIRMED" },
      _sum: { commission: true },
    }),
  ]);

  const commissionMap = Object.fromEntries(
    commissions.map((c) => [c.vendor_id, c._sum.commission ?? 0]),
  );

  return {
    ok: true,
    data: vendors.map((v) => ({
      userId: v.user_id,
      businessName: v.business_name,
      ownerName: `${v.user.first_name} ${v.user.last_name}`,
      email: v.user.email,
      category: v.category,
      isActive: v.is_active,
      bankLinked: !!(v.bank_code && v.account_number),
      bookingCount: v._count.bookings,
      totalCommissionNaira: commissionMap[v.user_id] ?? 0,
    })),
  };
}

export async function toggleVendorActive(
  vendorId: string,
): Promise<{ ok: true; isActive: boolean } | { ok: false; error: string }> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const vendor = await db.vendor_profile.findUnique({
    where: { user_id: vendorId },
    select: { is_active: true },
  });
  if (!vendor) return { ok: false, error: "Vendor not found" };

  const updated = await db.vendor_profile.update({
    where: { user_id: vendorId },
    data: { is_active: !vendor.is_active },
    select: { is_active: true },
  });

  return { ok: true, isActive: updated.is_active };
}

// ── Vendor Detail ─────────────────────────────────────────────────────────────

export type AdminVendorBooking = {
  id: string;
  reference: string;
  passengerName: string;
  routeName: string;
  fare: number;
  commission: number;
  status: string;
  createdAt: string;
};

export type AdminVendorPriceList = {
  id: string;
  name: string;
  direction: string;
  availabilityType: string;
  routeCount: number;
};

export type AdminVendorDetail = {
  userId: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  category: string;
  tagline: string | null;
  description: string | null;
  isActive: boolean;
  bankLinked: boolean;
  bankName: string | null;
  accountMask: string | null;
  totalFareNaira: number;
  totalCommissionNaira: number;
  confirmedBookings: number;
  recentBookings: AdminVendorBooking[];
  priceLists: AdminVendorPriceList[];
};

export async function getAdminVendorDetail(
  vendorId: string,
): Promise<
  { ok: true; data: AdminVendorDetail } | { ok: false; error: string }
> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const [vendor, commissionAgg, recentBookings, priceLists] = await Promise.all(
    [
      db.vendor_profile.findUnique({
        where: { user_id: vendorId },
        include: { user: true },
      }),
      db.booking.aggregate({
        where: { vendor_id: vendorId, status: "CONFIRMED" },
        _sum: { commission: true, fare: true },
        _count: true,
      }),
      db.booking.findMany({
        where: { vendor_id: vendorId },
        orderBy: { created_at: "desc" },
        take: 20,
        select: {
          id: true,
          reference: true,
          passenger_name: true,
          route_name: true,
          fare: true,
          commission: true,
          status: true,
          created_at: true,
        },
      }),
      db.price_list.findMany({
        where: { vendor_id: vendorId },
        include: { _count: { select: { routes: true } } },
        orderBy: { created_at: "asc" },
      }),
    ],
  );

  if (!vendor) return { ok: false, error: "Vendor not found" };

  return {
    ok: true,
    data: {
      userId: vendor.user_id,
      businessName: vendor.business_name,
      ownerName: `${vendor.user.first_name} ${vendor.user.last_name}`,
      email: vendor.user.email,
      phone: vendor.user.phone,
      category: vendor.category,
      tagline: vendor.tagline,
      description: vendor.description,
      isActive: vendor.is_active,
      bankLinked: !!(vendor.bank_code && vendor.account_number),
      bankName: vendor.bank_name,
      accountMask: vendor.account_number
        ? `••••${vendor.account_number.slice(-4)}`
        : null,
      totalFareNaira: commissionAgg._sum.fare ?? 0,
      totalCommissionNaira: commissionAgg._sum.commission ?? 0,
      confirmedBookings: commissionAgg._count,
      recentBookings: recentBookings.map((b) => ({
        id: b.id,
        reference: b.reference,
        passengerName: b.passenger_name,
        routeName: b.route_name,
        fare: b.fare,
        commission: b.commission,
        status: b.status,
        createdAt: b.created_at.toISOString(),
      })),
      priceLists: priceLists.map((pl) => ({
        id: pl.id,
        name: pl.name,
        direction: pl.direction,
        availabilityType: pl.availability_type,
        routeCount: pl._count.routes,
      })),
    },
  };
}

// ── Bookings ──────────────────────────────────────────────────────────────────

export type AdminBookingFull = {
  id: string;
  reference: string;
  passengerName: string;
  passengerPhone: string;
  vendorName: string;
  vendorId: string;
  routeName: string;
  direction: string;
  fare: number;
  commission: number;
  status: string;
  createdAt: string;
};

export async function getAdminBookings({
  page = 0,
  vendorId = "",
  status = "",
  dateFrom = "",
  dateTo = "",
  search = "",
}: {
  page?: number;
  vendorId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
} = {}): Promise<
  | {
      ok: true;
      data: AdminBookingFull[];
      total: number;
      totalFareNaira: number;
      totalCommissionNaira: number;
    }
  | { ok: false; error: string }
> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const where: Record<string, any> = {};
  if (vendorId) where.vendor_id = vendorId;
  if (status) where.status = status;
  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) where.created_at.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      where.created_at.lte = end;
    }
  }
  if (search) {
    where.OR = [
      { passenger_name: { contains: search, mode: "insensitive" } },
      { passenger_phone: { contains: search, mode: "insensitive" } },
      { reference: { contains: search, mode: "insensitive" } },
      { route_name: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, agg, bookings] = await Promise.all([
    db.booking.count({ where }),
    db.booking.aggregate({ where, _sum: { fare: true, commission: true } }),
    db.booking.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: page * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        reference: true,
        passenger_name: true,
        passenger_phone: true,
        route_name: true,
        direction: true,
        fare: true,
        commission: true,
        status: true,
        created_at: true,
        vendor: { select: { business_name: true, user_id: true } },
      },
    }),
  ]);

  return {
    ok: true,
    total,
    totalFareNaira: agg._sum.fare ?? 0,
    totalCommissionNaira: agg._sum.commission ?? 0,
    data: bookings.map((b) => ({
      id: b.id,
      reference: b.reference,
      passengerName: b.passenger_name,
      passengerPhone: b.passenger_phone,
      vendorName: b.vendor.business_name,
      vendorId: b.vendor.user_id,
      routeName: b.route_name,
      direction: b.direction,
      fare: b.fare,
      commission: b.commission,
      status: b.status,
      createdAt: b.created_at.toISOString(),
    })),
  };
}

export async function getAdminVendorNames(): Promise<
  | { ok: true; data: { id: string; name: string }[] }
  | { ok: false; error: string }
> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const vendors = await db.vendor_profile.findMany({
    select: { user_id: true, business_name: true },
    orderBy: { business_name: "asc" },
  });

  return {
    ok: true,
    data: vendors.map((v) => ({ id: v.user_id, name: v.business_name })),
  };
}

// ── Earnings ──────────────────────────────────────────────────────────────────

export type VendorEarningRow = {
  vendorId: string;
  businessName: string;
  bookingCount: number;
  commissionNaira: number;
};

export type AdminEarnings = {
  totalCommissionNaira: number;
  totalBookings: number;
  byVendor: VendorEarningRow[];
};

export async function getAdminEarnings(): Promise<
  { ok: true; data: AdminEarnings } | { ok: false; error: string }
> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const [overallAgg, byVendorRaw] = await Promise.all([
    db.booking.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { commission: true },
      _count: true,
    }),
    db.booking.groupBy({
      by: ["vendor_id"],
      where: { status: "CONFIRMED" },
      _sum: { commission: true },
      _count: true,
      orderBy: { _sum: { commission: "desc" } },
    }),
  ]);

  const vendorIds = byVendorRaw.map((v) => v.vendor_id);
  const vendorProfiles = await db.vendor_profile.findMany({
    where: { user_id: { in: vendorIds } },
    select: { user_id: true, business_name: true },
  });
  const nameMap = Object.fromEntries(
    vendorProfiles.map((v) => [v.user_id, v.business_name]),
  );

  return {
    ok: true,
    data: {
      totalCommissionNaira: overallAgg._sum.commission ?? 0,
      totalBookings: overallAgg._count,
      byVendor: byVendorRaw.map((v) => ({
        vendorId: v.vendor_id,
        businessName: nameMap[v.vendor_id] ?? v.vendor_id,
        bookingCount: v._count,
        commissionNaira: v._sum.commission ?? 0,
      })),
    },
  };
}
