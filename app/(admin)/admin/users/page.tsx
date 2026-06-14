import { getAdminUsers } from "@/lib/actions/admin.action";
import AdminPagination from "@/modules/admin/components/AdminPagination";
import AdminUsersFilters from "@/modules/admin/components/AdminUsersFilters";
import { format } from "date-fns";
import { GraduationCap } from "lucide-react";
import { Suspense } from "react";

const PAGE_SIZE = 25;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    level?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(0, parseInt(params.page ?? "0", 10) || 0);
  const search = params.search ?? "";
  const level = params.level ?? "";

  const result = await getAdminUsers({ page, search, level });

  const users = result.ok ? result.data : [];
  const total = result.ok ? result.total : 0;
  const pageCount = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-[22px] sm:text-[26px] font-extrabold text-portal-text">
          Students
        </h1>
        <p className="text-[13px] text-portal-muted mt-0.5">
          {total} registered student{total !== 1 ? "s" : ""}
        </p>
      </div>

      <Suspense>
        <AdminUsersFilters />
      </Suspense>

      <div className="bg-portal-surface border border-portal-border rounded-2xl overflow-hidden">
        {!result.ok ? (
          <div className="px-5 py-10 text-center text-[13px] text-red-400">
            Failed to load students
          </div>
        ) : users.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <GraduationCap className="w-8 h-8 text-portal-muted mx-auto mb-2" />
            <p className="text-[13px] text-portal-muted">
              {search || level ? "No students match your filters" : "No students yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-portal-border bg-portal-accent-bg/50">
                    {["Name", "Matric", "Department", "Level", "Phone", "Joined"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left text-[11px] font-semibold text-portal-muted uppercase tracking-wide px-5 py-3"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-portal-border last:border-b-0 hover:bg-portal-accent-bg/30 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-[13px] font-semibold text-portal-text">
                          {u.fullName}
                        </p>
                        <p className="text-[11px] text-portal-muted">{u.email}</p>
                      </td>
                      <td className="px-5 py-3.5 text-[12.5px] font-mono text-portal-text2">
                        {u.matricNumber}
                      </td>
                      <td className="px-5 py-3.5 text-[12.5px] text-portal-text2">
                        {u.department}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-portal-blue-bg text-portal-blue">
                          {u.level}00L
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[12.5px] text-portal-text2">
                        {u.phone}
                      </td>
                      <td className="px-5 py-3.5 text-[12.5px] text-portal-muted">
                        {format(new Date(u.createdAt), "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-portal-border">
              {users.map((u) => (
                <div key={u.id} className="px-4 py-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-portal-accent-bg flex items-center justify-center shrink-0">
                    <span className="text-[12px] font-bold text-portal-accent">
                      {u.fullName.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-portal-text">
                      {u.fullName}
                    </p>
                    <p className="text-[11.5px] text-portal-muted truncate">
                      {u.matricNumber} · {u.department} · {u.level}00L
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Suspense>
        <AdminPagination page={page} pageCount={pageCount} />
      </Suspense>
    </div>
  );
}
