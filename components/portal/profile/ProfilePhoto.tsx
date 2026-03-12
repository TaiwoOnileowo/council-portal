"use client";

import { useState, useRef } from "react";
import { motion } from "motion/react";
import { Camera, Upload, X } from "lucide-react";
import { mockProfile } from "./profileData";

export default function ProfilePhoto() {
  const [avatar, setAvatar] = useState<string | null>(mockProfile.avatar);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = mockProfile.firstName[0] + mockProfile.lastName[0];

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setAvatar(url);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.08, ease: "easeOut" }}
      className="bg-portal-surface border border-portal-border rounded-2xl p-6 flex items-center gap-6"
    >
      {/* Avatar */}
      <div
        className="relative group cursor-pointer flex-shrink-0"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <div
          className={`w-[88px] h-[88px] rounded-full flex items-center justify-center overflow-hidden transition-all ${
            dragging ? "ring-2 ring-portal-accent ring-offset-2" : ""
          } ${
            avatar ? "" : "bg-gradient-to-br from-portal-accent to-portal-gold"
          }`}
        >
          {avatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={avatar}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[28px] font-bold text-white font-heading">
              {initials}
            </span>
          )}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="w-5 h-5 text-white" />
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* Info + actions */}
      <div className="min-w-0">
        <h2 className="font-heading text-[18px] font-extrabold text-portal-text">
          {mockProfile.firstName} {mockProfile.lastName}
        </h2>
        <p className="text-[13px] text-portal-muted mt-0.5">
          {mockProfile.matricNumber} · {mockProfile.level} ·{" "}
          {mockProfile.department}
        </p>

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-portal-accent bg-portal-accent-bg hover:bg-portal-accent hover:text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Photo
          </button>
          {avatar && (
            <button
              onClick={() => setAvatar(null)}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-portal-muted hover:text-red-600 px-2 py-1.5 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
