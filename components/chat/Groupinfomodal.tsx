"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Camera, X, Loader2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { GroupDefaultAvatar } from "./Groupdefaultavatar";

interface GroupInfoModalProps {
  conversationId: Id<"conversations">;
  currentUserId: string;
  currentName: string;
  currentBio?: string;
  currentImageUrl?: string;
  memberCount: number;
  onClose: () => void;
}

export function GroupInfoModal({ conversationId, currentUserId, currentName, currentBio, currentImageUrl, memberCount, onClose }: GroupInfoModalProps) {
  const [name, setName] = useState(currentName);
  const [bio, setBio] = useState(currentBio ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const updateGroupInfo = useMutation(api.conversations.updateGroupInfo);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB"); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError("Group name cannot be empty"); return; }
    setIsSaving(true); setError(null);
    try {
      let storageId: Id<"_storage"> | undefined;
      if (avatarFile) {
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": avatarFile.type }, body: avatarFile });
        if (!res.ok) throw new Error("Upload failed");
        const { storageId: sid } = await res.json() as { storageId: Id<"_storage"> };
        storageId = sid;
      }
      await updateGroupInfo({ conversationId, userId: currentUserId, name: name.trim(), bio: bio.trim() || undefined, storageId });
      onClose();
    } catch { setError("Something went wrong. Please try again."); }
    finally { setIsSaving(false); }
  };

  const displayAvatar = avatarPreview ?? currentImageUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--overlay)" }} onClick={onClose}>
      <div className="w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl" style={{ background: "var(--modal-bg)", border: "1px solid #222" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Group Info</h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{memberCount} members</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5" style={{ color: "var(--text-muted)", background: "var(--bg-muted)" }} onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")} onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          <div className="flex justify-center pt-1">
            <button onClick={() => fileInputRef.current?.click()} className="group relative" title="Change group photo">
              <div className="h-20 w-20 overflow-hidden rounded-full" style={{ border: "2px solid #333" }}>
                {displayAvatar ? <img src={displayAvatar} alt="Group" className="h-full w-full object-cover" /> : <GroupDefaultAvatar size={80} />}
              </div>
              <div className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.55)" }}>
                <Camera className="h-5 w-5 text-white" />
              </div>
              <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full" style={{ background: "var(--text-primary)", border: "2px solid #0d0d0d" }}>
                <Camera className="h-3 w-3" style={{ color: "var(--bg-base)" }} />
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Group Name</label>
            <input type="text" value={name} onChange={e => { setName(e.target.value.slice(0, 50)); setError(null); }} className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ background: "var(--bg-subtle)", border: "1px solid #2a2a2a", color: "var(--text-primary)" }} onFocus={e => (e.currentTarget.style.borderColor = "var(--text-faint)")} onBlur={e => (e.currentTarget.style.borderColor = "var(--bg-border-subtle)")} />
            <p className="text-right text-xs" style={{ color: "var(--text-faint)" }}>{50 - name.length} left</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Description</label>
            <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 120))} placeholder="What's this group about?" maxLength={120} rows={2} className="w-full resize-none rounded-xl px-4 py-2.5 text-sm outline-none" style={{ background: "var(--bg-subtle)", border: "1px solid #2a2a2a", color: "var(--text-primary)", scrollbarWidth: "none" }} onFocus={e => (e.currentTarget.style.borderColor = "var(--text-faint)")} onBlur={e => (e.currentTarget.style.borderColor = "var(--bg-border-subtle)")} />
            <p className="text-right text-xs" style={{ color: "var(--text-faint)" }}>{120 - bio.length} left</p>
          </div>

          {error && <p className="rounded-lg px-3 py-2 text-xs" style={{ background: "var(--error-bg)", color: "var(--error-text)", border: "1px solid #3a0000" }}>{error}</p>}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 rounded-xl py-2.5 text-sm font-medium" style={{ background: "var(--bg-subtle)", color: "var(--text-muted)", border: "1px solid #222" }}>Cancel</button>
            <button onClick={handleSave} disabled={isSaving || !name.trim()} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50" style={{ background: "var(--text-primary)", color: "var(--bg-base)" }}>
              {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving</> : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}