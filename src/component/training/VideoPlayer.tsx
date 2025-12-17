// ================= src/components/training/VideoPlayer.tsx =================
"use client";
import React from "react";

export default function VideoPlayer({ src }: { src?: string }) {
  // Placeholder: pakai poster kosong kalau src tidak ada
  return src ? (
    <video
      controls
      className="aspect-video w-full rounded-xl bg-black"
      src={src}
    />
  ) : (
    <div className="aspect-video w-full rounded-xl bg-slate-900/90 text-white grid place-content-center">
      <div className="text-center">
        <div className="text-sm font-semibold">Video Training</div>
        <div className="text-xs text-white/70">
          (contoh placeholder — nanti taruh URL Supabase Storage)
        </div>
      </div>
    </div>
  );
}
