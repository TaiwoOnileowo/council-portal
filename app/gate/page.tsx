"use client";

import { useState } from "react";
import Image from "next/image";
import LoginForm from "@/components/portal/gate/LoginForm";
import SignUpForm from "@/components/portal/gate/SignUpForm";

type Tab = "login" | "create";

export default function GatePage() {
  const [tab, setTab] = useState<Tab>("login");

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: Form */}
      <div className="flex-1 overflow-y-auto max-w-[600px]">
      <div className="flex flex-col justify-center min-h-full px-16 py-12">
        {/* Logo / Brand */}
        <div className="mb-10">
          <Image
            src="/logo.png"
            alt="Covenant University"
            width={64}
            height={64}
            className="mb-4"
          />
          <h1 className="font-heading text-[28px] font-bold tracking-tight text-portal-text">
            {tab === "login" ? "Your keys please..." : "New face at the gate?"}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-portal-border mb-8">
          <button
            onClick={() => setTab("login")}
            className={`pb-3 px-1 mr-8 text-[15px] font-medium transition-colors ${
              tab === "login"
                ? "border-b-2 border-portal-accent text-portal-text"
                : "text-portal-muted hover:text-portal-text2"
            }`}
          >
            Log in
          </button>
          <button
            onClick={() => setTab("create")}
            className={`pb-3 px-1 text-[15px] font-medium transition-colors ${
              tab === "create"
                ? "border-b-2 border-portal-accent text-portal-text"
                : "text-portal-muted hover:text-portal-text2"
            }`}
          >
            Create account
          </button>
        </div>

        {tab === "login" ? <LoginForm /> : <SignUpForm />}
      </div>
      </div>

      {/* Right: Image */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center">
        <div className="absolute inset-0 bg-black/40" />
        <Image
          src="/gateimage.jpg"
          alt="Students on campus"
          fill
          className="object-cover"
          priority
        />

        <div className="z-10 flex flex-col items-center px-8">
          <p className="uppercase text-center font-bold auth-helper-text">
            CU STUDENT COUNCIL
          </p>
          <h1 className="auth-text max-w-2xl mt-2 font-bold uppercase text-center text-2xl md:text-4xl lg:text-5xl tracking-wide md:tracking-wider">
            MAKING YOUR CAMPUS LIFE EASIER
          </h1>
        </div>

        <div className="absolute bottom-8 right-8 bg-white/90 backdrop-blur-sm rounded-xl px-5 py-3 shadow-lg z-10">
          <p className="font-heading font-semibold text-portal-text text-[15px]">
            Student Council
          </p>
          <p className="text-portal-accent text-sm">Covenant University</p>
        </div>
      </div>
    </div>
  );
}
