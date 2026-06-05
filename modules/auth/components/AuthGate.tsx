"use client";

import { useState } from "react";
import Image from "next/image";
import AuthTabs from "./AuthTabs";
import AuthLoginForm, { AuthMode } from "./AuthLoginForm";
import ForgotPasswordForm from "./ForgotPasswordForm";
import SignUpForm from "./SignUpForm";
import VendorSignUpForm from "./VendorSignUpForm";

type View = "login" | "signup" | "forgot";

interface ModeConfig {
  signupTabLabel: string;
  headings: Record<View, string>;
  subtitles?: Partial<Record<View, string>>;
  Signup: React.ComponentType;
}

const CONFIG: Record<AuthMode, ModeConfig> = {
  student: {
    signupTabLabel: "Create account",
    headings: {
      login: "Your keys please...",
      signup: "New face at the gate?",
      forgot: "Lost your keys?",
    },
    Signup: SignUpForm,
  },
  vendor: {
    signupTabLabel: "Sign up",
    headings: {
      login: "Welcome back",
      signup: "Join as a vendor",
      forgot: "Forgot your password?",
    },
    subtitles: {
      login: "Sign in to your vendor account",
      signup: "Transport vendor registration · invite only",
    },
    Signup: VendorSignUpForm,
  },
};

export default function AuthGate({ mode }: { mode: AuthMode }) {
  const [view, setView] = useState<View>("login");
  const cfg = CONFIG[mode];
  const subtitle = cfg.subtitles?.[view];
  const Signup = cfg.Signup;

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
          {cfg.headings[view]}
        </h1>
        {subtitle && (
          <p className="text-portal-muted text-sm mt-1">{subtitle}</p>
        )}
      </div>

      {view !== "forgot" ? (
        <AuthTabs
          tabs={[
            {
              label: "Log in",
              active: view === "login",
              onClick: () => setView("login"),
            },
            {
              label: cfg.signupTabLabel,
              active: view === "signup",
              onClick: () => setView("signup"),
            },
          ]}
        />
      ) : (
        <AuthTabs tabs={[{ label: "Forgot password", active: true }]} />
      )}

      {view === "login" && (
        <AuthLoginForm mode={mode} onForgotPassword={() => setView("forgot")} />
      )}
      {view === "signup" && <Signup />}
      {view === "forgot" && (
        <ForgotPasswordForm
          isVendor={mode === "vendor"}
          onBack={() => setView("login")}
        />
      )}
    </>
  );
}
