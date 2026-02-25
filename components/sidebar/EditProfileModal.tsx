"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { Loader2, X, ZoomIn, ZoomOut, RotateCw, Check, Camera, User } from "lucide-react";

// ___________________________________________________________________
// |                     THEME CONFIGURATION                         |
// |         Change anything here to restyle the entire modal        |
// -------------------------------------------------------------------

const THEME = {
  // ── Accent (purple by default) ────────────────────────────────────
  accent:            "#7C3AED",          // primary purple
  accentMid:         "#6D28D9",          // mid purple (gradient stop)
  accentDark:        "#4C1D95",          // dark purple (gradient end)
  accentText:        "#a78bfa",          // lighter purple for text links
  accentFaint:       "rgba(139,92,246,0.05)",   // very faint tint on inputs
  accentBorder:      "rgba(139,92,246,0.15)",   // input border resting
  accentBorderHover: "1px solid rgb(78 0 123)",    // input border focused
  accentGlow:        "rgba(124,58,237,0.4)",    // button shadow
  accentGlowStrong:  "rgba(124,58,237,0.6)",    // button shadow hovered
  accentRing:        "rgba(139,92,246,0.4)",    // avatar outer ring
  accentRingGlow:    "rgba(139,92,246,0.2)",    // avatar ambient glow
  accentHoverBg:     "rgba(109,40,217,0.35)",   // avatar hover overlay
  accentBg:          "rgba(139,92,246,0.1)",    // avatar empty-state bg
  accentIcon:        "rgba(139,92,246,0.4)",    // empty-state user icon
  accentSaved:       "rgba(139,92,246,0.2)",    // saved button bg

  // ── Modal shell ───────────────────────────────────────────────────
  modalBg:           "linear-gradient(160deg, rgb(13, 13, 20) 0%, rgb(0 0 0) 100%)",
  modalBorder:       "rgb(186 186 186 / 18%)",
  modalShadow:       "0 32px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(139,92,246,0.06), 0 0 60px rgba(109,40,217,0.08)",
  backdrop:          "rgba(0,0,0,0.8)",

  // ── Dividers ──────────────────────────────────────────────────────
  dividerStrong:     "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)",
  dividerSubtle:     "linear-gradient(90deg, transparent, rgba(139,92,246,0.15), transparent)",

  // ── Text ──────────────────────────────────────────────────────────
  textPrimary:       "#ffffff",
  textSecondary:     "#6b6b8a",
  textLabel:         "#4a4a6a",
  textCounter:       "#3a3a5a",
  textLink:          "rgb(186 186 186)",           // same as accent

  // ── Buttons ───────────────────────────────────────────────────────
  cancelBg:          "rgba(255,255,255,0.03)",
  cancelBgHover:     "rgba(255,255,255,0.06)",
  cancelColor:       "rgb(189 189 189)",
  cancelColorHover:  "#aaaaaa",
  cancelBorder:      "rgb(186 186 186 / 18%)",
  closeBtnBg:        "rgba(255,255,255,0.04)",

  // ── Camera badge ─────────────────────────────────────────────────
  badgeBorder:       "#0a0a10",          // matches modal bg
  badgeShadow:       "rgba(124,58,237,0.5)",

  // ── Crop ring ────────────────────────────────────────────────────
  cropRingBorder:    "rgba(139,92,246,0.5)",
  cropRingGlow:      "0 0 0 4px rgba(139,92,246,0.12), 0 0 40px rgba(139,92,246,0.25), 0 0 80px rgba(109,51,170,0.15)",

  // ── Error state ──────────────────────────────────────────────────
  errorBg:           "rgba(255,59,48,0.08)",
  errorBorder:       "rgba(255,59,48,0.2)",
  errorText:         "#ff6b6b",
} as const;
// ══════════════════════════════════════════════════════════════════════

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
        <h3 className="text-base font-semibold" style={{ color: THEME.textPrimary }}>Crop your photo</h3>
        <p className="mt-0.5 text-xs" style={{ color: THEME.textSecondary }}>Drag · scroll to zoom · rotate</p>
      </div>

      <div
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="relative overflow-hidden rounded-full select-none"
        style={{
          width: CANVAS,
          height: CANVAS,
          cursor: dragging ? "grabbing" : "grab",
          border: `2px solid ${THEME.cropRingBorder}`,
          boxShadow: THEME.cropRingGlow,
        }}
      >
        <canvas ref={canvasRef} width={CANVAS} height={CANVAS} style={{ display: "block" }} />
      </div>

      <div className="flex w-full items-center gap-3">
        <ZoomOut className="h-3.5 w-3.5 flex-shrink-0" style={{ color: THEME.textSecondary }} />
        <input
          type="range" min={50} max={400} step={1}
          value={Math.round(zoom * 100)}
          onChange={e => setZoom(Number(e.target.value) / 100)}
          className="flex-1"
          style={{ accentColor: THEME.accent }}
        />
        <ZoomIn className="h-3.5 w-3.5 flex-shrink-0" style={{ color: THEME.textSecondary }} />
        <button
          onClick={() => setRotation(r => (r + 90) % 360)}
          className="rounded-xl p-2 transition-all"
          style={{ background: THEME.accentFaint, color: THEME.accentText, border: `1px solid ${THEME.accentBorder}` }}
          onMouseEnter={e => (e.currentTarget.style.background = THEME.accentBg)}
          onMouseLeave={e => (e.currentTarget.style.background = THEME.accentFaint)}
          title="Rotate 90°"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex w-full gap-3">
        <button
          onClick={onCancel}
          className="flex-1 rounded-full py-2.5 text-sm font-medium transition-all"
          style={{ background: THEME.cancelBg, color: THEME.cancelColor, border: `1px solid ${THEME.cancelBorder}` }}
          onMouseEnter={e => { e.currentTarget.style.color = THEME.cancelColorHover; e.currentTarget.style.background = THEME.cancelBgHover; }}
          onMouseLeave={e => { e.currentTarget.style.color = THEME.cancelColor; e.currentTarget.style.background = THEME.cancelBg; }}
        >
          Cancel
        </button>
        <button
          onClick={applyCrop}
          className="flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white transition-all"
          style={{
            background: `linear-gradient(135deg, rgb(30 0 80) 0%, rgb(109, 40, 217) 50%, rgb(76, 29, 149) 100%)`,
            boxShadow: `0 4px 20px ${THEME.accentGlow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 6px 28px ${THEME.accentGlowStrong}, inset 0 1px 0 rgba(255,255,255,0.15)`)}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 4px 20px ${THEME.accentGlow}, inset 0 1px 0 rgba(255,255,255,0.15)`)}
        >
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: THEME.backdrop, backdropFilter: "blur(16px)" }}
      onClick={step === "edit" ? onClose : undefined}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl"
        style={{ background: THEME.modalBg, border: `1px solid ${THEME.modalBorder}`, boxShadow: THEME.modalShadow }}
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
              <h2 className="text-lg font-semibold tracking-tight flex justify-center" style={{ color: THEME.textPrimary }}>Edit Profile</h2>
              <p className="text-xs mt-0.5" style={{ color: THEME.textSecondary }}>Visible to everyone on TarsChat</p>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: THEME.dividerStrong, margin: "0 20px" }} />

          {/* Avatar */}
          <div className="flex flex-col items-center gap-2 py-7">
            <button onClick={() => fileInputRef.current?.click()} className="group relative">
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 0 2px ${THEME.accentRing}, 0 0 30px ${THEME.accentRingGlow}`, transform: "scale(1.08)" }} />
              {/* Avatar circle */}
              <div className="h-24 w-24 overflow-hidden rounded-full" style={{ border: `2px solid ${THEME.cropRingBorder}` }}>
                {displayAvatar ? (
                  <img src={displayAvatar} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center" style={{ background: THEME.accentBg }}>
                    <User className="h-10 w-10" style={{ color: THEME.accentIcon }} />
                  </div>
                )}
              </div>
              {/* Camera badge */}
              <div className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: `linear-gradient(135deg, ${THEME.accent} 0%, ${THEME.accentMid} 60%, ${THEME.accentDark} 100%)`, border: `2px solid ${THEME.badgeBorder}`, boxShadow: `0 2px 12px ${THEME.badgeShadow}` }}>
                <Camera className="h-3.5 w-3.5 text-white" />
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: THEME.accentHoverBg }}>
                <Camera className="h-5 w-5 text-white" />
              </div>
            </button>

            <span
              className="text-xs font-medium cursor-pointer transition-colors"
              style={{ color: THEME.textLink }}
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={e => (e.currentTarget.style.color = THEME.accentText)}
              onMouseLeave={e => (e.currentTarget.style.color = THEME.textLink)}
            >
              {croppedPreview ? "Change photo" : "Upload photo"}
            </span>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Fields */}
          <div className="px-5 pb-6 space-y-4">

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME.textLabel }}>Display Name</label>
              <input
                type="text" value={username}
                onChange={e => { setUsername(e.target.value.slice(0, 32)); setError(null); }}
                className="w-full rounded-full px-4 py-3 text-sm outline-none transition-all"
                style={{ background: THEME.accentFaint, border: `1px solid ${THEME.accentBorder}`, color: THEME.textPrimary }}
                onFocus={e => { e.currentTarget.style.borderColor = THEME.accentBorderHover; e.currentTarget.style.boxShadow = `0 0 0 3px ${THEME.accentFaint}`; }}
                onBlur={e => { e.currentTarget.style.borderColor = THEME.accentBorder; e.currentTarget.style.boxShadow = "none"; }}
              />
              <div className="flex justify-end">
                <span className="text-xs" style={{ color: THEME.textCounter }}>{32 - username.length}</span>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME.textLabel }}>About</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value.slice(0, 120))}
                placeholder="Something about you…"
                rows={3}
                className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{ background: THEME.accentFaint, border: `1px solid ${THEME.accentBorder}`, color: THEME.textPrimary, scrollbarWidth: "none", lineHeight: 1.6 }}
                onFocus={e => { e.currentTarget.style.borderColor = THEME.accentBorderHover; e.currentTarget.style.boxShadow = `0 0 0 3px ${THEME.accentFaint}`; }}
                onBlur={e => { e.currentTarget.style.borderColor = THEME.accentBorder; e.currentTarget.style.boxShadow = "none"; }}
              />
              <div className="flex justify-end">
                <span className="text-xs" style={{ color: THEME.textCounter }}>{120 - bio.length}</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl px-4 py-2.5 text-xs" style={{ background: THEME.errorBg, border: `1px solid ${THEME.errorBorder}`, color: THEME.errorText }}>
                {error}
              </div>
            )}

            {/* Divider */}
            <div style={{ height: 1, background: THEME.dividerSubtle }} />

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 rounded-full py-3 text-sm font-medium transition-all"
                style={{ background: THEME.cancelBg, color: THEME.cancelColor, border: `1px solid ${THEME.cancelBorder}` }}
                onMouseEnter={e => { e.currentTarget.style.color = THEME.cancelColorHover; e.currentTarget.style.background = THEME.cancelBgHover; }}
                onMouseLeave={e => { e.currentTarget.style.color = THEME.cancelColor; e.currentTarget.style.background = THEME.cancelBg; }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || saved || !username.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{
                  background: saved ? THEME.accentSaved : `linear-gradient(135deg, rgb(30 0 80) 0%, rgb(109, 40, 217) 50%, rgb(76, 29, 149) 100%)`,
                  boxShadow: saved ? "none" : `0 4px 20px ${THEME.accentGlow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onMouseEnter={e => { if (!isSaving && !saved) e.currentTarget.style.boxShadow = `0 6px 28px ${THEME.accentGlowStrong}, inset 0 1px 0 rgba(255,255,255,0.15)`; }}
                onMouseLeave={e => { if (!isSaving && !saved) e.currentTarget.style.boxShadow = `0 4px 20px ${THEME.accentGlow}, inset 0 1px 0 rgba(255,255,255,0.15)`; }}
              >
                {saved ? <><Check className="h-4 w-4" /> Saved!</>
                  : isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                  : "Save changes"}
              </button>
            </div>
          </div>
        </>)}
      </div>
    </div>
  );
}