"use client";

import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function TopBar() {
  const { data: user } = useCurrentUser();
  const firstName = user?.firstName ?? "there";

  return (
    <div className="flex items-center justify-between gap-4 mb-7">
      <div>
        <h1 className="font-heading text-[20px] sm:text-[26px] font-bold leading-tight text-portal-text">
          {getGreeting()},{" "}
          <span className="text-portal-accent capitalize">{firstName}</span>{" "}
          <span className="inline-block origin-[70%_70%] animate-[wave_2.5s_ease-in-out_infinite]">
            👋
          </span>
        </h1>
      </div>
    </div>
  );
}
