"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadFiles } from "@/lib/uploadthing";

type Props = {
  value: string;
  onChange: (url: string) => void;
};

export default function ImageUpload({ value, onChange }: Props) {
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
        className="relative w-24 h-24 rounded-full border-2 border-dashed border-portal-border bg-portal-bg flex items-center justify-center cursor-pointer hover:border-portal-accent transition-colors overflow-hidden"
        onClick={() => fileInputRef.current?.click()}
      >
        {value ? (
          <img src={value} alt="Profile" className="w-full h-full object-cover" />
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
      <p className="text-xs text-portal-muted text-center">
        Click to upload a display picture (max 4MB)
      </p>
    </div>
  );
}
