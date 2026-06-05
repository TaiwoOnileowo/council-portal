"use client";

import { ChevronLeft } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import type { VendorSignUpInput } from "@/modules/vendor/vendor.types";
import ImageUpload from "@/components/ui/ImageUpload";
import { inputClass } from "@/lib/utils";

type Props = {
  image: string;
  onImageChange: (url: string) => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
  onBack: () => void;
};

export default function ProfileInfoStep({
  image,
  onImageChange,
  onSubmit,
  onBack,
}: Props) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<VendorSignUpInput>();

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-portal-text mb-1.5">
          Transport name<span className="text-portal-accent">*</span>
        </label>
        <input
          type="text"
          {...register("transportName")}
          placeholder="e.g. SwiftMove NG"
          maxLength={60}
          className={inputClass(errors.transportName?.message)}
          autoFocus
        />
        {errors.transportName && (
          <p className="mt-1 text-xs text-red-500">
            {errors.transportName.message}
          </p>
        )}
      </div>

      <ImageUpload value={image} onChange={onImageChange} />

      <div>
        <label className="block text-sm font-medium text-portal-text mb-1.5">
          Tagline{" "}
          <span className="text-portal-muted font-normal">(optional)</span>
        </label>
        <input
          type="text"
          {...register("tagline")}
          placeholder="Your campus ride, always on time"
          maxLength={80}
          className={inputClass(errors.tagline?.message)}
        />
        <div className="flex justify-between mt-1">
          {errors.tagline ? (
            <p className="text-xs text-red-500">{errors.tagline.message}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-portal-muted">
            {watch("tagline")?.length ?? 0}/80
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-portal-text mb-1.5">
          About your service{" "}
          <span className="text-portal-muted font-normal">(optional)</span>
        </label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              placeholder="Tell students about your transport service, vehicles, and what makes you stand out..."
              rows={4}
              maxLength={500}
              className={`${inputClass(errors.description?.message)} resize-none`}
            />
          )}
        />
        <div className="flex justify-between mt-1">
          {errors.description ? (
            <p className="text-xs text-red-500">{errors.description.message}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-portal-muted">
            {watch("description")?.length ?? 0}/500
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-portal-text">
          Socials{" "}
          <span className="text-portal-muted font-normal">(optional)</span>
        </p>
        <div>
          <label className="block text-xs text-portal-muted mb-1">
            Instagram URL
          </label>
          <input
            type="url"
            {...register("instagram")}
            placeholder="https://instagram.com/youraccount"
            className={inputClass(errors.instagram?.message)}
          />
          {errors.instagram && (
            <p className="mt-1 text-xs text-red-500">
              {errors.instagram.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs text-portal-muted mb-1">
            TikTok URL
          </label>
          <input
            type="url"
            {...register("tiktok")}
            placeholder="https://tiktok.com/@youraccount"
            className={inputClass(errors.tiktok?.message)}
          />
          {errors.tiktok && (
            <p className="mt-1 text-xs text-red-500">{errors.tiktok.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 rounded-lg border border-portal-border text-portal-text font-medium py-3 px-4 text-[15px] transition-colors hover:bg-portal-border/30"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        <button
          type="submit"
          className="flex-1 rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white font-medium py-3 text-[15px] transition-colors"
        >
          Continue
        </button>
      </div>
    </form>
  );
}
