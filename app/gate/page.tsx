"use client";

import { useState } from "react";
import Image from "next/image";

type Tab = "login" | "create";

export default function GatePage() {
  const [tab, setTab] = useState<Tab>("login");
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);

  return (
    <div className="flex min-h-screen">
      {/* Left: Form */}
      <div className="flex flex-1 flex-col justify-center px-16 py-12 max-w-[600px]">
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

        {/* Login Form */}
        {tab === "login" && (
          <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1.5">
                Email<span className="text-portal-accent">*</span>
              </label>
              <input
                type="email"
                placeholder="you@email.com"
                className="w-full rounded-lg border border-portal-border bg-white px-4 py-3 text-[15px] text-portal-text placeholder:text-portal-muted outline-none focus:border-portal-accent focus:ring-1 focus:ring-portal-accent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1.5">
                Password<span className="text-portal-accent">*</span>
              </label>
              <input
                type="password"
                placeholder="••••••••••••••••"
                className="w-full rounded-lg border border-portal-border bg-white px-4 py-3 text-[15px] text-portal-text placeholder:text-portal-muted outline-none focus:border-portal-accent focus:ring-1 focus:ring-portal-accent transition"
              />
            </div>

            {/* Keep me logged in */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <button
                type="button"
                role="checkbox"
                aria-checked={keepLoggedIn}
                onClick={() => setKeepLoggedIn(!keepLoggedIn)}
                className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                  keepLoggedIn
                    ? "bg-portal-accent"
                    : "border-2 border-portal-border"
                }`}
              >
                {keepLoggedIn && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="text-white"
                  >
                    <path
                      d="M2 6L5 9L10 3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              <span className="text-sm text-portal-text2">
                Keep me logged in on this device
              </span>
            </label>

            <button
              type="submit"
              className="w-full rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white font-medium py-3 text-[15px] transition-colors mt-2"
            >
              Log in
            </button>

            <p className="text-center">
              <a
                href="#"
                className="text-sm text-portal-text2 hover:text-portal-accent transition-colors"
              >
                I forgot my password
              </a>
            </p>
          </form>
        )}

        {/* Create Account Form */}
        {tab === "create" && (
          <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1.5">
                Full name<span className="text-portal-accent">*</span>
              </label>
              <input
                type="text"
                placeholder="Your full name"
                className="w-full rounded-lg border border-portal-border bg-white px-4 py-3 text-[15px] text-portal-text placeholder:text-portal-muted outline-none focus:border-portal-accent focus:ring-1 focus:ring-portal-accent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1.5">
                Email<span className="text-portal-accent">*</span>
              </label>
              <input
                type="email"
                placeholder="you@email.com"
                className="w-full rounded-lg border border-portal-border bg-white px-4 py-3 text-[15px] text-portal-text placeholder:text-portal-muted outline-none focus:border-portal-accent focus:ring-1 focus:ring-portal-accent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1.5">
                Password<span className="text-portal-accent">*</span>
              </label>
              <input
                type="password"
                placeholder="••••••••••••••••"
                className="w-full rounded-lg border border-portal-border bg-white px-4 py-3 text-[15px] text-portal-text placeholder:text-portal-muted outline-none focus:border-portal-accent focus:ring-1 focus:ring-portal-accent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1.5">
                Confirm password<span className="text-portal-accent">*</span>
              </label>
              <input
                type="password"
                placeholder="••••••••••••••••"
                className="w-full rounded-lg border border-portal-border bg-white px-4 py-3 text-[15px] text-portal-text placeholder:text-portal-muted outline-none focus:border-portal-accent focus:ring-1 focus:ring-portal-accent transition"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white font-medium py-3 text-[15px] transition-colors mt-2"
            >
              Create account
            </button>
          </form>
        )}
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
        {/* Overlay card at bottom-right */}
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
