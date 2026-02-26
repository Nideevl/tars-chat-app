"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Search, Check, ArrowRight, X } from "lucide-react";

interface CreateGroupModalProps {
    currentUserId: string;
    onClose: () => void;
    onCreated: (id: Id<"conversations">) => void;
}

export function CreateGroupModal({ currentUserId, onClose, onCreated }: CreateGroupModalProps) {
    const [step, setStep] = useState<"members" | "name">("members");
    const [groupName, setGroupName] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const users = useQuery(api.users.getAllUsers, { currentClerkId: currentUserId, search });
    const createGroup = useMutation(api.conversations.createGroupConversation);
    const selectedUsers = users?.filter(u => selectedIds.includes(u.clerkId)) ?? [];

    const toggle = (id: string) => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

    const handleCreate = async () => {
        if (!groupName.trim()) return;
        setIsCreating(true);
        try {
            const id = await createGroup({ name: groupName.trim(), memberIds: [currentUserId, ...selectedIds], creatorId: currentUserId });
            onCreated(id as Id<"conversations">);
        } finally { setIsCreating(false); }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.8)" }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: "var(--modal-bg)", border: "1px solid #2a2a2a" }}
                onClick={(e) => e.stopPropagation()}
            >
                {step === "members" ? (<>
                    <div className="flex px-5 py-4 justify-between" style={{ borderBottom: "1px solid #1a1a1a" }}>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>New Group</p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{selectedIds.length} selected</p>
                        </div>
                        <button className="cursor-pointer" onClick={onClose} style={{ color: "var(--text-tertiary)" }}>
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="px-4 py-3">
                        <div className="flex items-center gap-2 rounded-full px-3 py-2" style={{ background: "var(--bg-subtle)", border: "1px solid #2a2a2a" }}>
                            <Search className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
                            <input type="text"  value={search} onChange={e => setSearch(e.target.value)} placeholder="Search people" autoFocus
                                className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--text-primary)" }} />
                        </div>
                    </div>

                    {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2 px-4 pb-3">
                            {selectedUsers.map(u => (
                                <button key={u.clerkId} onClick={() => toggle(u.clerkId)}
                                    className="cursor-pointer flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                                    style={{ background: "var(--text-primary)", color: "var(--bg-base)" }}>
                                    {u.name.split(" ")[0]} <X className="h-3 w-3" />
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="max-h-60 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}>
                        {users?.map(user => {
                            const sel = selectedIds.includes(user.clerkId);
                            return (
                                <button key={user._id} onClick={() => toggle(user.clerkId)}
                                    className="cursor-pointer flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                                    style={{ borderBottom: "1px solid #111" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-subtle)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                    <div className="relative flex-shrink-0">
                                        {user.imageUrl
                                            ? <img src={user.imageUrl} alt={user.name} className="h-10 w-10 rounded-full object-cover" style={{ border: "1px solid #333" }} />
                                            : <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold" style={{ background: "var(--bg-border)", color: "var(--text-primary)", border: "1px solid #333" }}>
                                                {user.name[0]?.toUpperCase()}
                                            </div>
                                        }
                                        {sel && (
                                            <div className="absolute inset-0 flex items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.9)" }}>
                                                <Check className="h-5 w-5" style={{ color: "var(--bg-base)" }} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{user.name}</p>
                                        <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user.email}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="flex justify-end p-4" style={{ borderTop: "1px solid #1a1a1a" }}>
                            <button onClick={() => setStep("name")}
                                className="cursor-pointer flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors"
                                style={{ background: "var(--text-primary)", color: "var(--bg-base)" }}>
                                Next <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </>) : (<>
                    <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid #1a1a1a" }}>
                        <button onClick={() => setStep("members")} className="cursor-pointer rounded-lg p-1.5" style={{ background: "var(--bg-muted)", color: "var(--text-tertiary)", border: "1px solid #333" }}>
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Group Info</p>
                    </div>

                    <div className="px-5 py-6 space-y-5">
                        <input type="text" value={groupName} onChange={e => setGroupName(e.target.value.slice(0, 50))} placeholder="Group name"
                            autoFocus onKeyDown={e => { if (e.key === "Enter" && groupName.trim()) handleCreate(); }}
                            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                            style={{ background: "var(--bg-subtle)", border: "1px solid #2a2a2a", color: "var(--text-primary)" }} />

                        <p className="text-xs text-right" style={{ color: "var(--text-faint)" }}>{50 - groupName.length} characters remaining</p>

                        <div>
                            <p className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>{selectedIds.length + 1} participants</p>
                            <div className="flex flex-wrap gap-2">
                                {selectedUsers.map(u => (
                                    <div key={u.clerkId} className="flex flex-col items-center gap-1">
                                        {u.imageUrl
                                            ? <img src={u.imageUrl} className="h-10 w-10 rounded-full object-cover" style={{ border: "1px solid #333" }} />
                                            : <div className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold" style={{ background: "var(--bg-border)", color: "var(--text-primary)", border: "1px solid #333" }}>
                                                {u.name[0]?.toUpperCase()}
                                            </div>
                                        }
                                        <span className="max-w-12 truncate text-xs" style={{ color: "var(--text-muted)" }}>{u.name.split(" ")[0]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 px-5 pb-5">
                        <button onClick={onClose} className="cursor-pointer flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors"
                            style={{ background: "var(--bg-muted)", color: "var(--text-tertiary)", border: "1px solid #2a2a2a" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-border)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-muted)")}>
                            Cancel
                        </button>
                        <button onClick={handleCreate} disabled={!groupName.trim() || isCreating}
                            className="cursor-pointer flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-40"
                            style={{ background: "var(--text-primary)", color: "var(--bg-base)" }}>
                            {isCreating ? "Creating..." : "Create Group"}
                        </button>
                    </div>
                </>)}
            </div>
        </div>
    );
}