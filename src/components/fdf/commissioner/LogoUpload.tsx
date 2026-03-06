"use client";

import { useRef, useCallback } from "react";
import { Upload, X } from "lucide-react";

interface LogoUploadProps {
  logoUrl: string | undefined;
  onChange: (dataUrl: string | undefined) => void;
  size?: number;
  fallbackColor?: string;
  fallbackText?: string;
}

export function LogoUpload({
  logoUrl,
  onChange,
  size = 32,
  fallbackColor = "#3b82f6",
  fallbackText = "?",
}: LogoUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Compress to max 128×128
        const maxSize = 128;
        let w = img.width;
        let h = img.height;
        if (w > maxSize || h > maxSize) {
          const ratio = Math.min(maxSize / w, maxSize / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/png", 0.8);
        onChange(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  }, [onChange]);

  return (
    <div className="relative inline-flex group" style={{ width: size, height: size }}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      {logoUrl ? (
        <div className="relative" style={{ width: size, height: size }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="Team logo"
            className="rounded object-cover"
            style={{ width: size, height: size }}
          />
          {/* Remove button */}
          <button
            onClick={(e) => { e.stopPropagation(); onChange(undefined); }}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: "#ef4444", color: "#fff" }}
            type="button"
            title="Remove logo"
          >
            <X size={8} />
          </button>
          {/* Click to change */}
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            type="button"
            title="Change logo"
          >
            <Upload size={12} style={{ color: "#fff" }} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded flex items-center justify-center font-fdf-mono text-xs font-bold transition-colors hover:opacity-80"
          style={{
            width: size,
            height: size,
            backgroundColor: fallbackColor,
            color: "#fff",
            border: "2px dashed rgba(255,255,255,0.3)",
          }}
          type="button"
          title="Upload logo"
        >
          {fallbackText}
        </button>
      )}
    </div>
  );
}
