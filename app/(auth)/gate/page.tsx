"use client";

import { useState } from "react";
import Image from "next/image";
import LoginForm from "@/components/portal/gate/LoginForm";
import SignUpForm from "@/components/portal/gate/SignUpForm";
import ForgotPasswordForm from "@/components/portal/gate/ForgotPasswordForm";
import AuthTabs from "@/components/portal/gate/AuthTabs";

type View = "login" | "create" | "forgot";

export default function GatePage() {
  const [view, setView] = useState<View>("login");

  const headings: Record<View, string> = {
    login: "Your keys please...",
    create: "New face at the gate?",
    forgot: "Lost your keys?",
  };

  return (
    <>
      <div className="mb-6 sm:mb-8 lg:mb-10">
        <Image
          src="/logo.png"
          alt="Covenant University"
          width={64}
          height={64}
          className="mb-4"
        />
        <h1 className="font-heading text-[28px] font-bold tracking-tight text-portal-text">
          {headings[view]}
        </h1>
      </div>

      {view !== "forgot" ? (
        <AuthTabs
          tabs={[
            { label: "Log in", active: view === "login", onClick: () => setView("login") },
            { label: "Create account", active: view === "create", onClick: () => setView("create") },
          ]}
        />
      ) : (
        <AuthTabs tabs={[{ label: "Forgot password", active: true }]} />
      )}

      {view === "login" && (
        <LoginForm onForgotPassword={() => setView("forgot")} />
      )}
      {view === "create" && <SignUpForm />}
      {view === "forgot" && (
        <ForgotPasswordForm onBack={() => setView("login")} />
      )}
    </>
  );
}
