import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isVendor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (typeof body?.isActive !== "boolean") {
    return NextResponse.json({ error: "isActive (boolean) is required" }, { status: 400 });
  }

  const updated = await db.vendor.update({
    where: { id: session.user.id },
    data: { isActive: body.isActive },
    select: { isActive: true },
  });

  return NextResponse.json({ isActive: updated.isActive });
}
