import AuthGate from "@/modules/auth/components/AuthGate";

export default function AdminGatePage() {
  return <AuthGate mode="admin" />;
}
