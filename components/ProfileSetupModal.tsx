"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Camera, X, Check, Loader2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface ProfileSetupModalProps {
  clerkId: string;
  defaultName: string;
  defaultImageUrl: string;
  onComplete: () => void;
}

export function ProfileSetupModal({
  clerkId,
  defaultName,
  defaultImageUrl,
  onComplete,
}: ProfileSetupModalProps) {
  const [username, setUsername] = useState(defaultName);
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"setup" | "done">("setup");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const updateProfile = useMutation(api.users.updateProfile);
  const skipProfileSetup = useMutation(api.users.skipProfileSetup);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleSave = async () => {
    if (!username.trim()) { setError("Username cannot be empty"); return; }
    if (username.trim().length < 2) { setError("Username must be at least 2 characters"); return; }

    setIsSaving(true);
    setError(null);

    try {
      let storageId: Id<"_storage"> | undefined;

      if (avatarFile) {
        // 1. Get upload URL from Convex
        const uploadUrl = await generateUploadUrl();
        // 2. Upload file to Convex storage
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": avatarFile.type },
          body: avatarFile,
        });
        if (!result.ok) throw new Error("Upload failed");
        const { storageId: sid } = await result.json() as { storageId: Id<"_storage"> };
        storageId = sid;
      }

      await updateProfile({
        clerkId,
        username: username.trim(),
        bio: bio.trim() || undefined,
        storageId,
      });

      setStep("done");
      setTimeout(onComplete, 800);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    await skipProfileSetup({ clerkId });
    onComplete();
  };

  const currentAvatar = avatarPreview ?? defaultImageUrl;
  const initials = username.trim()[0]?.toUpperCase() ?? "?";

  if (step === "done") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "var(--overlay)" }}>
        <div className="flex flex-col items-center gap-4 rounded-3xl p-10" style={{ background: "var(--modal-bg)", border: "1px solid #222" }}>
          <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "var(--bg-muted)" }}>
            <Check className="h-8 w-8" style={{ color: "var(--text-primary)" }} />
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Profile saved!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--overlay)" }} onClick={handleSkip}>
      <div
        className="w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl"
        style={{ background: "var(--modal-bg)", border: "1px solid #222" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-7 pb-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
            Welcome to TarsChat
          </p>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Set up your profile
          </h2>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            You can always change this later in settings
          </p>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Avatar picker */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex-shrink-0"
              title="Change profile picture"
            >
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt="Avatar"
                  className="h-24 w-24 rounded-full object-cover"
                  style={{ border: "2px solid #333" }}
                />
              ) : (
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold"
                  style={{ background: "var(--bg-muted)", color: "var(--text-primary)", border: "2px solid #333" }}
                >
                  {initials}
                </div>
              )}
              {/* Camera overlay */}
              <div
                className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "rgba(0,0,0,0.55)" }}
              >
                <Camera className="h-6 w-6" style={{ color: "var(--text-primary)" }} />
              </div>
              {/* Small camera badge */}
              <div
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full"
                style={{ background: "var(--text-primary)", border: "2px solid #0d0d0d" }}
              >
                <Camera className="h-3.5 w-3.5" style={{ color: "var(--bg-base)" }} />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {avatarFile ? avatarFile.name : "Tap to upload a photo"}
            </p>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value.slice(0, 32)); setError(null); }}
              placeholder="Your name"
              maxLength={32}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid #2a2a2a",
                color: "var(--text-primary)",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "var(--text-faint)")}
              onBlur={e => (e.currentTarget.style.borderColor = "var(--bg-border-subtle)")}
            />
            <p className="text-right text-xs" style={{ color: "var(--text-faint)" }}>
              {32 - username.length} left
            </p>
          </div>

          {/* Bio / About */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              About <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value.slice(0, 120))}
              placeholder="Hey there! I'm using TarsChat."
              maxLength={120}
              rows={2}
              className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid #2a2a2a",
                color: "var(--text-primary)",
                scrollbarWidth: "none",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "var(--text-faint)")}
              onBlur={e => (e.currentTarget.style.borderColor = "var(--bg-border-subtle)")}
            />
            <p className="text-right text-xs" style={{ color: "var(--text-faint)" }}>
              {120 - bio.length} left
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg px-3 py-2 text-xs" style={{ background: "var(--error-bg)", color: "var(--error-text)", border: "1px solid #3a0000" }}>
              {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={handleSkip}
            disabled={isSaving}
            className="flex-1 rounded-xl py-3 text-sm font-medium transition-colors"
            style={{ background: "var(--bg-subtle)", color: "var(--text-muted)", border: "1px solid #222" }}
            onMouseEnter={e => { (e.currentTarget.style.color = "var(--text-secondary)"); }}
            onMouseLeave={e => { (e.currentTarget.style.color = "var(--text-muted)"); }}
          >
            Skip for now
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !username.trim()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: "var(--text-primary)", color: "var(--bg-base)" }}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save profile"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}