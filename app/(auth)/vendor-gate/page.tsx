"use client";

import Image from "next/image";
import AuthTabs from "@/components/portal/gate/AuthTabs";
import VendorSignUpForm from "@/components/portal/vendor-gate/VendorSignUpForm";

export default function VendorGatePage() {
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
          Join as a vendor
        </h1>
        <p className="text-portal-muted text-sm mt-1">
          Transport vendor registration, invite only
        </p>
      </div>

      <AuthTabs tabs={[{ label: "New Transport Vendor", active: true }]} />

      <VendorSignUpForm />
    </>
  );
}
