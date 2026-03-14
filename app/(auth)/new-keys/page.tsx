import Image from "next/image";
import Link from "next/link";
import { verifyResetToken } from "@/lib/actions/password.action";
import NewPasswordForm from "@/components/portal/gate/NewPasswordForm";
import AuthTabs from "@/components/portal/gate/AuthTabs";

interface NewKeysPageProps {
  searchParams: Promise<{ token?: string; email?: string }>;
}

export default async function NewKeysPage({ searchParams }: NewKeysPageProps) {
  const { token } = await searchParams;

  const result = token ? await verifyResetToken(token) : { error: "Missing link parameters." };

  return (
    <>
      <div className="mb-10">
        <Image
          src="/logo.png"
          alt="Covenant University"
          width={64}
          height={64}
          className="mb-4"
        />
        <h1 className="font-heading text-[28px] font-bold tracking-tight text-portal-text">
          Change Keys...
        </h1>
      </div>

      <AuthTabs tabs={[{ label: "New Password", active: true }]} />

      {"error" in result ? (
        <div className="space-y-5">
          <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-5 text-center">
            <p className="text-[15px] font-semibold text-red-800 mb-1">
              Link invalid or expired
            </p>
            <p className="text-sm text-red-700">{result.error}</p>
          </div>
          <Link
            href="/gate"
            className="block w-full text-center rounded-lg border border-portal-border text-portal-text2 font-medium py-3 text-[15px] transition-colors hover:bg-portal-surface"
          >
            Back to log in
          </Link>
        </div>
      ) : (
        <NewPasswordForm email={result.email} token={token!} />
      )}
    </>
  );
}
