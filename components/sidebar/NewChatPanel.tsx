"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, Search, Users } from "lucide-react";

interface NewChatPanelProps {
    currentUserId: string;
    onSelectUser: (userId: string) => void;
    onCreateGroup: () => void;
    onClose: () => void;
}

export function NewChatPanel({ currentUserId, onSelectUser, onCreateGroup, onClose }: NewChatPanelProps) {
    const [search, setSearch] = useState("");
    const users = useQuery(api.users.getAllUsers, { currentClerkId: currentUserId, search });

    return (
        <div className="flex h-full w-full flex-col" style={{ background: "var(--bg-base)", borderRight: "1px solid #222" }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid #222" }}>
                <button onClick={onClose} className="rounded-lg p-1.5 transition-colors"
                    style={{ color: "var(--text-tertiary)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-muted)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}>
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>New Message</span>
            </div>

            {/* Search */}
            <div className="px-3 py-2" style={{ borderBottom: "1px solid #1a1a1a" }}>
                <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "var(--bg-subtle)", border: "1px solid #2a2a2a" }}>
                    <Search className="h-3.5 w-3.5" onFocus={e => {
                        const parent = e.currentTarget.parentElement!;
                        parent.style.border = "1px solid rgba(255,255,255,0.35)";
                        parent.style.background = "rgba(255,255,255,0.04)";
                    }} style={{ color: "var(--text-muted)" }} />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search people" autoFocus
                        className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--text-primary)" }} />
                </div>
            </div>

            {/* New Group button */}
            <button onClick={onCreateGroup}
                className="flex items-center gap-3 px-5 py-3 transition-colors"
                style={{ borderBottom: "1px solid #1a1a1a" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-subtle)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
                <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "var(--bg-border)", border: "1px solid #333" }}>
                    <Users className="h-4 w-4" style={{ color: "var(--text-primary)" }} />
                </div>
                <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>New Group</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Create a group conversation</p>
                </div>
            </button>

            {/* User list */}
            <div className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}>
                {users === undefined ? (
                    <div className="flex justify-center py-8">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--text-primary)", borderTopColor: "transparent" }} />
                    </div>
                ) : users.length === 0 ? (
                    <p className="py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                        {search ? `No results for "${search}"` : "No users found"}
                    </p>
                ) : (
                    users.map(user => (
                        <button key={user._id} onClick={() => onSelectUser(user.clerkId)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors"
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
                                {user.isOnline && (
                                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2" style={{ background: "var(--text-primary)", borderColor: "var(--bg-base)" }} />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{user.name}</p>
                                <p className="text-xs" style={{ color: user.isOnline ? "var(--text-secondary)" : "var(--text-muted)" }}>
                                    {user.isOnline ? "Active now" : user.email}
                                </p>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}