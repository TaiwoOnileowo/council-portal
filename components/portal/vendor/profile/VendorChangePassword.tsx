"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { changeVendorPassword } from "@/lib/actions/vendor.action";

type Props = { vendorId: string };

const inputCls = (err?: string) =>
  `w-full text-[13.5px] text-portal-text bg-portal-bg border ${
    err
      ? "border-red-400 focus:ring-red-300"
      : "border-portal-border focus:border-portal-accent focus:ring-portal-accent/30"
  } rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 transition-all`;

export default function VendorChangePassword({ vendorId }: Props) {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [errors, setErrors] = useState<Partial<typeof fields>>({});
  const [loading, setLoading] = useState(false);

  function reset() {
    setFields({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    setErrors({});
    setShow({ current: false, new: false, confirm: false });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errs: Partial<typeof fields> = {};
    if (!fields.currentPassword) errs.currentPassword = "Current password is required";
    if (fields.newPassword.length < 8) errs.newPassword = "New password must be at least 8 characters";
    if (fields.newPassword !== fields.confirmNewPassword) errs.confirmNewPassword = "Passwords do not match";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    const result = await changeVendorPassword({ vendorId, ...fields });
    setLoading(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Password changed successfully");
    reset();
    setOpen(false);
  }

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
            <h3 className="font-heading text-[15px] font-bold text-portal-text">Password</h3>
            <p className="text-[12px] text-portal-muted">Change your account password</p>
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
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.25 }}
          onSubmit={handleSubmit}
          className="mt-5 space-y-3 overflow-hidden"
        >
          {/* Current password */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <input
                type={show.current ? "text" : "password"}
                value={fields.currentPassword}
                onChange={(e) => setFields({ ...fields, currentPassword: e.target.value })}
                placeholder="••••••••"
                className={inputCls(errors.currentPassword)}
              />
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, current: !s.current }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-portal-muted hover:text-portal-text"
                tabIndex={-1}
              >
                {show.current ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.currentPassword}</p>
            )}
          </div>

          {/* New password */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={show.new ? "text" : "password"}
                value={fields.newPassword}
                onChange={(e) => setFields({ ...fields, newPassword: e.target.value })}
                placeholder="••••••••"
                className={inputCls(errors.newPassword)}
              />
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, new: !s.new }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-portal-muted hover:text-portal-text"
                tabIndex={-1}
              >
                {show.new ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm new password */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={show.confirm ? "text" : "password"}
                value={fields.confirmNewPassword}
                onChange={(e) => setFields({ ...fields, confirmNewPassword: e.target.value })}
                placeholder="••••••••"
                className={inputCls(errors.confirmNewPassword)}
              />
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-portal-muted hover:text-portal-text"
                tabIndex={-1}
              >
                {show.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.confirmNewPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.confirmNewPassword}</p>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => { reset(); setOpen(false); }}
              className="flex-1 rounded-lg border border-portal-border text-portal-text font-medium py-2 text-[13px] transition-colors hover:bg-portal-border/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white font-medium py-2 text-[13px] transition-colors disabled:opacity-60"
            >
              {loading ? "Saving..." : "Update Password"}
            </button>
          </div>
        </motion.form>
      )}
    </motion.div>
  );
}
