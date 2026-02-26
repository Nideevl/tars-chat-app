"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { Loader2, ZoomIn, ZoomOut, RotateCw, Check, Camera, User } from "lucide-react";

interface EditProfileModalProps {
  clerkId: string;
  currentName: string;
  currentBio?: string;
  currentImageUrl?: string;
  onClose: () => void;
}

// ─── Crop Step ────────────────────────────────────────────────────────────────
function CropStep({ imageSrc, onCrop, onCancel }: {
  imageSrc: string;
  onCrop: (blob: Blob, preview: string) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);
  const CANVAS = 260;

  useEffect(() => {
    const img = new Image();
    img.onload = () => { imgRef.current = img; draw(); };
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => { draw(); }, [zoom, rotation, offset]);

  const draw = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, CANVAS, CANVAS);
    ctx.save();
    ctx.translate(CANVAS / 2 + offset.x, CANVAS / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    const scale = Math.max(CANVAS / img.width, CANVAS / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    ctx.arc(CANVAS / 2, CANVAS / 2, CANVAS / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    setOffset({ x: dragStart.current.ox + (e.clientX - dragStart.current.x), y: dragStart.current.oy + (e.clientY - dragStart.current.y) });
  }, [dragging]);
  const handleMouseUp = useCallback(() => setDragging(false), []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => { window.removeEventListener("mousemove", handleMouseMove); window.removeEventListener("mouseup", handleMouseUp); };
  }, [handleMouseMove, handleMouseUp]);

  const touchStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, ox: offset.x, oy: offset.y };
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setOffset({ x: touchStart.current.ox + (t.clientX - touchStart.current.x), y: touchStart.current.oy + (t.clientY - touchStart.current.y) });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(4, Math.max(0.5, z - e.deltaY * 0.001)));
  };

  const applyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(blob => {
      if (!blob) return;
      onCrop(blob, canvas.toDataURL("image/png"));
    }, "image/png", 0.95);
  };

  return (
    <div className="flex flex-col items-center gap-5 px-6 py-6">
      <div className="text-center">
        <h3 className="ep-text-primary text-base font-semibold">Crop your photo</h3>
        <p className="ep-text-secondary mt-0.5 text-xs">Drag · scroll to zoom · rotate</p>
      </div>

      {/* Crop canvas */}
      <div
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="ep-crop-canvas-wrapper"
        style={{ cursor: dragging ? "grabbing" : "grab" }}
      >
        <canvas ref={canvasRef} width={CANVAS} height={CANVAS} style={{ display: "block" }} />
      </div>

      {/* Zoom + rotate */}
      <div className="flex w-full items-center gap-3">
        <ZoomOut className="ep-text-secondary h-3.5 w-3.5 flex-shrink-0" />
        <input
          type="range" min={50} max={400} step={1}
          value={Math.round(zoom * 100)}
          onChange={e => setZoom(Number(e.target.value) / 100)}
          className="ep-range flex-1"
        />
        <ZoomIn className="ep-text-secondary h-3.5 w-3.5 flex-shrink-0" />
        <button onClick={() => setRotation(r => (r + 90) % 360)} className="ep-btn-rotate" title="Rotate 90°">
          <RotateCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Crop step buttons */}
      <div className="flex w-full gap-3">
        <button onClick={onCancel} className="ep-btn-cancel flex-1 rounded-full py-2.5 text-sm font-medium">
          Cancel
        </button>
        <button onClick={applyCrop} className="ep-btn-save flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold">
          <Check className="h-4 w-4" /> Use this photo
        </button>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export function EditProfileModal({ clerkId, currentName, currentBio, currentImageUrl, onClose }: EditProfileModalProps) {
  const [step, setStep] = useState<"edit" | "crop">("edit");
  const [username, setUsername] = useState(currentName);
  const [bio, setBio] = useState(currentBio ?? "");
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const updateProfile = useMutation(api.users.updateProfile);

  const displayAvatar = croppedPreview ?? currentImageUrl;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError("Image must be under 10MB"); return; }
    const reader = new FileReader();
    reader.onload = () => { setRawImageSrc(reader.result as string); setStep("crop"); };
    reader.readAsDataURL(file);
    e.target.value = "";
    setError(null);
  };

  const handleCropDone = (blob: Blob, preview: string) => {
    setCroppedBlob(blob);
    setCroppedPreview(preview);
    setStep("edit");
  };

  const handleSave = async () => {
    if (!username.trim()) { setError("Name cannot be empty"); return; }
    setIsSaving(true); setError(null);
    try {
      let storageId: Id<"_storage"> | undefined;
      if (croppedBlob) {
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": "image/png" }, body: croppedBlob });
        if (!res.ok) throw new Error("Upload failed");
        const { storageId: sid } = await res.json() as { storageId: Id<"_storage"> };
        storageId = sid;
      }
      await updateProfile({ clerkId, username: username.trim(), bio: bio.trim() || undefined, storageId });
      setSaved(true);
      setTimeout(onClose, 800);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setIsSaving(false); }
  };

  return (
    <div
      className="ep-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={step === "edit" ? onClose : undefined}
    >
      <div
        className="ep-modal w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >

        {/* ── Crop Step ───────────────────────────────────────────── */}
        {step === "crop" && rawImageSrc && (
          <CropStep
            imageSrc={rawImageSrc}
            onCrop={handleCropDone}
            onCancel={() => { setStep("edit"); setRawImageSrc(null); }}
          />
        )}

        {/* ── Edit Step ───────────────────────────────────────────── */}
        {step === "edit" && (<>

          {/* Header */}
          <div className="flex items-center justify-center px-5 pt-5 pb-2">
            <div>
              <h2 className="ep-text-primary text-lg font-semibold tracking-tight flex justify-center">Edit Profile</h2>
              <p className="ep-text-secondary text-xs mt-0.5">Visible to everyone on TarsChat</p>
            </div>
          </div>

          {/* Divider */}
          <div className="ep-divider-strong" />

          {/* Avatar */}
          <div className="flex flex-col items-center gap-2 py-7">
            <button onClick={() => fileInputRef.current?.click()} className="group relative">
              <div className="ep-avatar-ring" />
              <div className="ep-avatar-circle h-24 w-24 overflow-hidden rounded-full">
                {displayAvatar ? (
                  <img src={displayAvatar} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="ep-avatar-empty flex h-full w-full items-center justify-center">
                    <User className="ep-avatar-icon h-10 w-10" />
                  </div>
                )}
              </div>
              <div className="ep-camera-badge">
                <Camera className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="ep-avatar-hover">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </button>

            <span className="ep-upload-link" onClick={() => fileInputRef.current?.click()}>
              {croppedPreview ? "Change photo" : "Upload photo"}
            </span>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Fields */}
          <div className="px-5 pb-6 space-y-4">

            {/* Name */}
            <div className="space-y-1.5">
              <label className="ep-label text-xs font-semibold uppercase tracking-widest">Display Name</label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value.slice(0, 32)); setError(null); }}
                className="ep-input ep-input-name rounded-full px-4 py-3 text-sm"
              />
              <div className="flex justify-end">
                <span className="ep-counter text-xs">{32 - username.length}</span>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="ep-label text-xs font-semibold uppercase tracking-widest">About</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value.slice(0, 120))}
                placeholder="Something about you…"
                rows={3}
                className="ep-input ep-input-bio resize-none rounded-xl px-4 py-3 text-sm"
              />
              <div className="flex justify-end">
                <span className="ep-counter text-xs">{120 - bio.length}</span>
              </div>
            </div>

            {/* Error */}
            {error && <div className="ep-error">{error}</div>}

            {/* Divider */}
            <div className="ep-divider-subtle" />

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="ep-btn-cancel flex-1 rounded-full py-3 text-sm font-medium">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || saved || !username.trim()}
                className={`ep-btn-save flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold${saved ? " saved" : ""}`}
              >
                {saved
                  ? <><Check className="h-4 w-4" /> Saved!</>
                  : isSaving
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                    : "Save changes"
                }
              </button>
            </div>
          </div>
        </>)}
      </div>
    </div>
  );
}