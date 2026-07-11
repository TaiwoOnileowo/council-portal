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
  headings: Record<View, string>;
  subtitles?: Partial<Record<View, string>>;
  Signup?: React.ComponentType;
  loginOnly?: boolean;
}

function buildConfig(commissionNaira?: number): Record<AuthMode, ModeConfig> {
  return {
    student: {
      headings: {
        login: "Your keys please...",
        signup: "New face at the gate?",
        forgot: "Lost your keys?",
      },
      Signup: SignUpForm,
    },
    vendor: {
      headings: {
        login: "Welcome back",
        signup: "Join as a vendor",
        forgot: "Forgot your password?",
      },
      subtitles: {
        login: "Sign in to your vendor account",
        signup: "Transport vendor registration · invite only",
      },
      Signup: () => <VendorSignUpForm commissionNaira={commissionNaira!} />,
    },
    admin: {
      loginOnly: true,
      headings: {
        login: "Admin access",
        signup: "",
        forgot: "Forgot your password?",
      },
      subtitles: {
        login: "Your keys please...",
      },
    },
  };
}

type Props =
  | { mode: "vendor"; commissionNaira: number }
  | { mode: Exclude<AuthMode, "vendor"> };

export default function AuthGate(props: Props) {
  const { mode } = props;
  const commissionNaira = props.mode === "vendor" ? props.commissionNaira : undefined;
  const [view, setView] = useState<View>("login");
  const cfg = buildConfig(commissionNaira)[mode];
  const subtitle = cfg.subtitles?.[view];

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
          tabs={
            cfg.loginOnly
              ? [{ label: "Log in", active: true }]
              : [
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
                ]
          }
        />
      ) : (
        <AuthTabs tabs={[{ label: "Forgot password", active: true }]} />
      )}

      {view === "login" && (
        <AuthLoginForm mode={mode} onForgotPassword={() => setView("forgot")} />
      )}
      {view === "signup" && cfg.Signup && <cfg.Signup />}
      {view === "forgot" && (
        <ForgotPasswordForm
          isVendor={mode === "vendor"}
          onBack={() => setView("login")}
        />
      )}
    </>
  );
}
