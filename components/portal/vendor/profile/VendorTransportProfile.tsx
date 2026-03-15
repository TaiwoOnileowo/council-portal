"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { Pencil, Check, X, Upload, Instagram, Link } from "lucide-react";
import { toast } from "sonner";
import { updateVendorProfile } from "@/lib/actions/vendor.action";
import { vendorStep2Schema, VendorStep2Fields } from "@/lib/validations/vendor";
import { uploadFiles } from "@/lib/uploadthing";

type TransportFields = {
  transportName: string;
  tagline: string;
  description: string;
  instagram: string;
  tiktok: string;
  image: string;
};

type Props = {
  vendor: TransportFields & {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

const inputCls = (err?: string) =>
  `w-full text-[13.5px] text-portal-text bg-portal-bg border ${
    err
      ? "border-red-400 focus:ring-red-300"
      : "border-portal-border focus:border-portal-accent focus:ring-portal-accent/30"
  } rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-all`;

function ImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFiles("vendorProfileImage", { files: [file] });
      if (res?.[0]?.ufsUrl) {
        onChange(res[0].ufsUrl);
        toast.success("Image uploaded!");
      }
    } catch {
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative w-16 h-16 rounded-xl border-2 border-dashed border-portal-border bg-portal-bg flex items-center justify-center cursor-pointer hover:border-portal-accent transition-colors overflow-hidden flex-shrink-0"
        onClick={() => fileInputRef.current?.click()}
      >
        {value ? (
          <img
            src={value}
            alt="Transport logo"
            className="w-full h-full object-cover"
          />
        ) : (
          <Upload className="w-5 h-5 text-portal-muted" />
        )}
        {uploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-portal-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-[12px] font-medium text-portal-accent hover:underline disabled:opacity-50"
        >
          {uploading ? "Uploading..." : value ? "Change image" : "Upload logo"}
        </button>
        {value && (
          <div>
            <button type="button" onClick={() => onChange("")} className="text-[12px] text-red-500 hover:underline block">
              Remove
            </button>
          </div>
        )}
        <p className="text-[11px] text-portal-muted">Max 4MB</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />
    </div>
  );
}

export default function VendorTransportProfile({ vendor }: Props) {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<TransportFields>({
    transportName: vendor.transportName,
    tagline: vendor.tagline,
    description: vendor.description,
    instagram: vendor.instagram,
    tiktok: vendor.tiktok,
    image: vendor.image,
  });
  const [draftImage, setDraftImage] = useState<string>(vendor.image);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<VendorStep2Fields>({
    resolver: zodResolver(vendorStep2Schema),
  });

  function startEdit() {
    reset({
      transportName: profile.transportName,
      tagline: profile.tagline,
      description: profile.description,
      instagram: profile.instagram,
      tiktok: profile.tiktok,
    });
    setDraftImage(profile.image);
    setEditing(true);
  }

  function cancelEdit() {
    reset();
    setEditing(false);
  }

  async function onSubmit(data: VendorStep2Fields) {
    const result = await updateVendorProfile({
      vendorId: vendor.id,
      firstName: vendor.firstName,
      lastName: vendor.lastName,
      email: vendor.email,
      transportName: data.transportName,
      tagline: data.tagline || undefined,
      description: data.description || undefined,
      instagram: data.instagram || undefined,
      tiktok: data.tiktok || undefined,
      image: draftImage || undefined,
    });

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    setProfile({
      transportName: data.transportName,
      tagline: data.tagline ?? "",
      description: data.description ?? "",
      instagram: data.instagram ?? "",
      tiktok: data.tiktok ?? "",
      image: draftImage,
    });
    setEditing(false);
    toast.success("Transport profile updated successfully");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.22, ease: "easeOut" }}
      className="bg-portal-surface border border-portal-border rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading text-[15px] font-bold text-portal-text">
          Transport Profile
        </h3>
        {!editing ? (
          <button
            onClick={startEdit}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-portal-accent bg-portal-accent-bg hover:bg-portal-accent hover:text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        ) : (
          <div className="flex gap-1.5">
            <button
              onClick={cancelEdit}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-portal-muted hover:text-portal-text px-2.5 py-1.5 rounded-lg border border-portal-border transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={!isDirty || isSubmitting}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-white bg-portal-accent hover:bg-portal-accent2 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
            >
              <Check className="w-3.5 h-3.5" />
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Logo */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
            Logo / Display Picture
          </label>
          {editing ? (
            <ImageUpload
              value={draftImage}
              onChange={(url) => setDraftImage(url)}
            />
          ) : (
            <div className="flex items-center gap-3 py-1">
              {profile.image ? (
                <img
                  src={profile.image}
                  alt={profile.transportName}
                  className="w-12 h-12 rounded-xl object-cover border border-portal-border"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-portal-accent-bg border border-portal-border flex items-center justify-center">
                  <span className="text-portal-accent font-bold text-lg">
                    {profile.transportName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transport Name */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
            Transport Name
          </label>
          {editing ? (
            <>
              <input
                type="text"
                {...register("transportName")}
                maxLength={60}
                className={inputCls(errors.transportName?.message)}
              />
              <div className="flex justify-between mt-1">
                {errors.transportName ? (
                  <p className="text-xs text-red-500">{errors.transportName.message}</p>
                ) : (
                  <span />
                )}
                <span className="text-[11px] text-portal-muted">
                  {watch("transportName")?.length ?? 0}/60
                </span>
              </div>
            </>
          ) : (
            <p className="text-[13.5px] font-medium text-portal-text py-2">
              {profile.transportName}
            </p>
          )}
        </div>

        {/* Tagline */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
            Tagline{" "}
            <span className="normal-case font-normal text-portal-muted">
              (optional)
            </span>
          </label>
          {editing ? (
            <>
              <input
                type="text"
                {...register("tagline")}
                placeholder="Your campus ride, always on time"
                maxLength={80}
                className={inputCls(errors.tagline?.message)}
              />
              <div className="flex justify-between mt-1">
                {errors.tagline ? (
                  <p className="text-xs text-red-500">{errors.tagline.message}</p>
                ) : (
                  <span />
                )}
                <span className="text-[11px] text-portal-muted">
                  {watch("tagline")?.length ?? 0}/80
                </span>
              </div>
            </>
          ) : (
            <p className="text-[13.5px] font-medium text-portal-text py-2 italic">
              {profile.tagline || (
                <span className="text-portal-muted not-italic">Not set</span>
              )}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
            About Your Service{" "}
            <span className="normal-case font-normal text-portal-muted">
              (optional)
            </span>
          </label>
          {editing ? (
            <>
              <textarea
                {...register("description")}
                placeholder="Tell students about your transport service..."
                rows={3}
                maxLength={500}
                className={`${inputCls(errors.description?.message)} resize-none`}
              />
              <div className="flex justify-between mt-1">
                {errors.description ? (
                  <p className="text-xs text-red-500">{errors.description.message}</p>
                ) : (
                  <span />
                )}
                <span className="text-[11px] text-portal-muted">
                  {watch("description")?.length ?? 0}/500
                </span>
              </div>
            </>
          ) : (
            <p className="text-[13.5px] text-portal-text2 py-2 leading-relaxed">
              {profile.description || (
                <span className="text-portal-muted">Not set</span>
              )}
            </p>
          )}
        </div>

        {/* Socials */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-2">
            Socials{" "}
            <span className="normal-case font-normal text-portal-muted">
              (optional)
            </span>
          </label>
          {editing ? (
            <div className="space-y-2.5">
              <div>
                <div className="flex items-center gap-2.5">
                  <Instagram className="w-4 h-4 text-portal-muted flex-shrink-0" />
                  <input
                    type="url"
                    {...register("instagram")}
                    placeholder="https://instagram.com/youraccount"
                    className={inputCls(errors.instagram?.message)}
                  />
                </div>
                {errors.instagram && (
                  <p className="mt-1 text-xs text-red-500 pl-6">
                    {errors.instagram.message}
                  </p>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <Link className="w-4 h-4 text-portal-muted flex-shrink-0" />
                  <input
                    type="url"
                    {...register("tiktok")}
                    placeholder="https://tiktok.com/@youraccount"
                    className={inputCls(errors.tiktok?.message)}
                  />
                </div>
                {errors.tiktok && (
                  <p className="mt-1 text-xs text-red-500 pl-6">
                    {errors.tiktok.message}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 py-1">
              {profile.instagram ? (
                <div className="flex items-center gap-2">
                  <Instagram className="w-3.5 h-3.5 text-portal-muted" />
                  <a
                    href={profile.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-portal-accent hover:underline truncate"
                  >
                    {profile.instagram}
                  </a>
                </div>
              ) : null}
              {profile.tiktok ? (
                <div className="flex items-center gap-2">
                  <Link className="w-3.5 h-3.5 text-portal-muted" />
                  <a
                    href={profile.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-portal-accent hover:underline truncate"
                  >
                    {profile.tiktok}
                  </a>
                </div>
              ) : null}
              {!profile.instagram && !profile.tiktok && (
                <p className="text-[13px] text-portal-muted">
                  No socials added
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
