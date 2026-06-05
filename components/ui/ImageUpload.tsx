"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadFiles } from "@/lib/uploadthing";

type Props = {
  value: string;
  onChange: (url: string) => void;
  size?: number;
  hint?: string;
};

export default function ImageUpload({
  value,
  onChange,
  size = 96,
  hint = "Click to upload a display picture (max 4MB)",
}: Props) {
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
    <div className="flex flex-col items-center gap-3">
      <div
        style={{ width: size, height: size }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-full border-portal-border bg-portal-bg flex items-center justify-center cursor-pointer hover:border-portal-accent transition-colors overflow-hidden",
        )}
      >
        {value ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-portal-muted">
            <Upload className="w-6 h-6" />
            <span className="text-[10px]">Upload</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-portal-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-xs text-red-500 hover:underline"
        >
          Remove image
        </button>
      )}
      {hint && <p className="text-xs text-portal-muted text-center">{hint}</p>}
    </div>
  );
}
