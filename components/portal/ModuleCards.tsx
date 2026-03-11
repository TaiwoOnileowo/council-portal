"use client";

import { motion } from "motion/react";
import { Bus, Tent, TicketCheck, Store, ArrowRight } from "lucide-react";

const modules = [
  {
    key: "transport",
    name: "Transport",
    desc: "Book rides with approved campus transport vendors. Private or shared.",
    stat: "5 vendors available",
    icon: Bus,
    iconBg: "bg-portal-accent-bg",
    accentColor: "bg-portal-accent",
    iconColor: "text-portal-accent",
  },
//   {
//     key: "canopy",
//     name: "Canopy Booking",
//     desc: "Reserve canopies and event spaces for departmental or personal events.",
//     stat: "8 canopies free today",
//     icon: Tent,
//     iconBg: "bg-portal-gold-bg",
//     accentColor: "bg-portal-gold",
//     iconColor: "text-portal-gold",
//   },
//   {
//     key: "helpdesk",
//     name: "Help Desk",
//     desc: "Raise complaints, inquiries, or welfare concerns to the student council.",
//     stat: "Avg. reply 4 hrs",
//     icon: TicketCheck,
//     iconBg: "bg-portal-blue-bg",
//     accentColor: "bg-portal-blue",
//     iconColor: "text-portal-blue",
//   },
//   {
//     key: "vendor",
//     name: "Vendor Registry",
//     desc: "View all council-approved vendors on campus or apply for vendor status.",
//     stat: "23 approved vendors",
//     icon: Store,
//     iconBg: "bg-portal-purple-bg",
//     accentColor: "bg-portal-purple",
//     iconColor: "text-portal-purple",
//   },
];

export default function ModuleCards() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.21, ease: "easeOut" }}
      className="mb-7"
    >
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="font-heading text-[17px] font-bold">Services</h2>
        <button className="text-[13px] font-medium text-portal-accent hover:underline">
          All services →
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3.5">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <motion.div
              key={mod.key}
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="group bg-portal-surface border border-portal-border rounded-2xl p-5 cursor-pointer relative overflow-hidden hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-shadow duration-250"
            >
              {/* Top accent line on hover */}
              <div
                className={`absolute top-0 left-0 right-0 h-[3px] ${mod.accentColor} rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
              />

              <div
                className={`w-[46px] h-[46px] rounded-[14px] ${mod.iconBg} flex items-center justify-center mb-4`}
              >
                <Icon className={`w-[22px] h-[22px] ${mod.iconColor}`} />
              </div>

              <h3 className="font-heading text-[15px] font-bold mb-1.5">
                {mod.name}
              </h3>
              <p className="text-xs text-portal-muted leading-relaxed mb-4">
                {mod.desc}
              </p>

              <div className="flex items-center justify-between pt-3.5 border-t border-portal-border">
                <span
                  className="text-xs text-portal-text2"
                  dangerouslySetInnerHTML={{
                    __html: mod.stat.replace(
                      /(\d+\s?\w*)/,
                      "<strong class='font-bold'>$1</strong>",
                    ),
                  }}
                />
                <ArrowRight className="w-4 h-4 text-portal-muted group-hover:text-portal-text group-hover:translate-x-0.5 transition-all duration-200" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
