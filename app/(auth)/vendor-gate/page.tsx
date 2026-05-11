"use client";

import { useState } from "react";
import Image from "next/image";
import AuthTabs from "@/modules/auth/components/AuthTabs";
import VendorLoginForm from "@/modules/auth/components/VendorLoginForm";
import VendorSignUpForm from "@/modules/auth/components/VendorSignUpForm";

type View = "login" | "signup";

const HEADINGS: Record<View, { title: string; subtitle: string }> = {
  login: {
    title: "Welcome back",
    subtitle: "Sign in to your vendor account",
  },
  signup: {
    title: "Join as a vendor",
    subtitle: "Transport vendor registration · invite only",
  },
};

export default function VendorGatePage() {
  const [view, setView] = useState<View>("login");
  const { title, subtitle } = HEADINGS[view];

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
          {title}
        </h1>
        <p className="text-portal-muted text-sm mt-1">{subtitle}</p>
      </div>

      <AuthTabs
        tabs={[
          {
            label: "Log in",
            active: view === "login",
            onClick: () => setView("login"),
          },
          {
            label: "Sign up",
            active: view === "signup",
            onClick: () => setView("signup"),
          },
        ]}
      />

      {view === "login" && <VendorLoginForm />}
      {view === "signup" && <VendorSignUpForm />}
    </>
  );
}
