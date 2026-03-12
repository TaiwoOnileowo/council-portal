"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Lock, Eye, EyeOff, Check } from "lucide-react";

export default function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (!current || !newPass || newPass !== confirm) return;
    // Mock save
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
      setCurrent("");
      setNewPass("");
      setConfirm("");
    }, 1500);
  }

  const mismatch = confirm.length > 0 && newPass !== confirm;
  const tooShort = newPass.length > 0 && newPass.length < 8;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.18, ease: "easeOut" }}
      className="bg-portal-surface border border-portal-border rounded-2xl p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-portal-accent-bg flex items-center justify-center">
            <Lock className="w-4 h-4 text-portal-accent" />
          </div>
          <div>
            <h3 className="font-heading text-[15px] font-bold text-portal-text">
              Password
            </h3>
            <p className="text-[12px] text-portal-muted">
              Last changed 45 days ago
            </p>
          </div>
        </div>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-portal-accent bg-portal-accent-bg hover:bg-portal-accent hover:text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Change Password
          </button>
        )}
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.25 }}
          className="mt-5 space-y-3"
        >
          {/* Current password */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="w-full text-[13.5px] text-portal-text bg-portal-bg border border-portal-border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-portal-accent/30 focus:border-portal-accent transition-all"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-portal-muted hover:text-portal-text"
              >
                {showCurrent ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className={`w-full text-[13.5px] text-portal-text bg-portal-bg border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-portal-accent/30 transition-all ${
                  tooShort
                    ? "border-red-300 focus:border-red-400"
                    : "border-portal-border focus:border-portal-accent"
                }`}
                placeholder="Min 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-portal-muted hover:text-portal-text"
              >
                {showNew ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {tooShort && (
              <p className="text-[11px] text-red-500 mt-1">
                Password must be at least 8 characters
              </p>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`w-full text-[13.5px] text-portal-text bg-portal-bg border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-portal-accent/30 transition-all ${
                mismatch
                  ? "border-red-300 focus:border-red-400"
                  : "border-portal-border focus:border-portal-accent"
              }`}
              placeholder="Re-enter new password"
            />
            {mismatch && (
              <p className="text-[11px] text-red-500 mt-1">
                Passwords don&apos;t match
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                setOpen(false);
                setCurrent("");
                setNewPass("");
                setConfirm("");
              }}
              className="text-[12px] font-medium text-portal-muted hover:text-portal-text px-3 py-1.5 rounded-lg border border-portal-border transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!current || !newPass || tooShort || mismatch || saved}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white bg-portal-accent hover:bg-portal-accent2 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-1.5 rounded-lg transition-colors"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Saved!
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
