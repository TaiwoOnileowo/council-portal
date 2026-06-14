"use client";

import Pagination from "@/components/ui/Pagination";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function AdminPagination({
  page,
  pageCount,
}: {
  page: number;
  pageCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function handlePageChange(p: number) {
    const params = new URLSearchParams(sp.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params}`);
  }

  return (
    <Pagination
      page={page}
      pageCount={pageCount}
      onPageChange={handlePageChange}
      className="mt-3.5"
    />
  );
}
