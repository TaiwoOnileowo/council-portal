"use client";

import Image from "next/image";
import { motion } from "motion/react";

type Props = {
  firstName: string;
  lastName: string;
  transportName: string;
  image: string | null;
};

export default function VendorDashboardHeader({
  firstName,
  lastName,
  transportName,
  image,
}: Props) {
  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3.5">
          {image ? (
            <Image
              src={image}
              alt={transportName}
              width={44}
              height={44}
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
              }}
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-[15px] font-extrabold text-blue-700 flex-shrink-0">
              {initials}
            </div>
          )}
          <div>
            <h1 className="font-heading text-[24px] font-extrabold text-portal-text">
              {transportName}
            </h1>
            <p className="text-[12.5px] text-portal-muted mt-0.5">
              {firstName} {lastName}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
