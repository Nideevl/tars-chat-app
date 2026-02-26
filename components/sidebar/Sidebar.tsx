"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useClerk } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/nextjs";
import { ConversationItem } from "./ConversationItem";
import { CreateGroupModal } from "./CreateGroupModal";
import { NewChatPanel } from "./NewChatPanel";
import { EditProfileModal } from "./EditProfileModal";
import { Search, MessageSquarePlus, Users, X, EllipsisVertical, Power } from "lucide-react";

interface SidebarProps {
    currentUser: { id: string; fullName: string | null; username: string | null; imageUrl: string };
    selectedConversationId: Id<"conversations"> | null;
    onSelectConversation: (id: Id<"conversations">) => void;
}

export function Sidebar({ currentUser, selectedConversationId, onSelectConversation }: SidebarProps) {
    const [view, setView] = useState<"chats" | "new-chat">("chats");
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"all" | "unread" | "groups">("all");
    const [showEditProfile, setShowEditProfile] = useState(false);

    const conversations = useQuery(api.conversations.getUserConversations, { userId: currentUser.id });
    const convexUser = useQuery(api.users.getUserByClerkId, { clerkId: currentUser.id });
    const getOrCreateDM = useMutation(api.conversations.getOrCreateDMConversation);

    const handleUserSelect = async (otherUserId: string) => {
        const convId = await getOrCreateDM({ currentUserId: currentUser.id, otherUserId });
        onSelectConversation(convId as Id<"conversations">);
        setView("chats");
    };
    const { openUserProfile } = useClerk();
    const unreadCount = conversations?.filter(c => (c.unreadCount ?? 0) > 0).length ?? 0;
    const groupCount = conversations?.filter(c => c.isGroup).length ?? 0;

    const filtered = conversations?.filter((c) => {
        if (activeTab === "unread" && (c.unreadCount ?? 0) === 0) return false;
        if (activeTab === "groups" && !c.isGroup) return false;
        if (!searchQuery.trim()) return true;
        const name = c.isGroup ? c.name ?? "" : c.otherParticipants[0]?.name ?? "";
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (view === "new-chat") {
        return (
            <NewChatPanel
                currentUserId={currentUser.id}
                onSelectUser={handleUserSelect}
                onCreateGroup={() => { setView("chats"); setShowCreateGroup(true); }}
                onClose={() => setView("chats")}
            />
        );
    }

    return (
        <>
            {/* Root: fills parent exactly, never shrinks/expands on content change */}
            <div className="flex h-full w-full overflow-hidden" style={{ backdropFilter: "blur(12px)", background: "rgba(0,0,0,0.8)", borderRight: "1px solid #222" }}>

                {/* ── Icon rail: desktop only (hidden on mobile) ─────────────────── */}
                <div className="hidden md:flex relative h-full w-[60px] flex-shrink-0 flex-col items-center border-r py-4" style={{ borderColor: "#222" }}>
                    <div className="flex justify-center">
                        <img src="./logo.png" alt="TARS" className="max-h-45 w-auto" />
                    </div>
                    <div className="mt-auto flex flex-col items-center gap-4 pb-4">
                        <button
                            onClick={() => setShowEditProfile(true)}
                            title="Edit profile"
                            className="cursor-pointer relative group h-8 w-8 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors"
                        >
                            {convexUser?.imageUrl ? (
                                <img src={convexUser.imageUrl} alt="Me" className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold bg-zinc-700 text-white">
                                    {(convexUser?.name ?? currentUser.fullName ?? "?")[0]?.toUpperCase()}
                                </div>
                            )}
                            <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-white/10" />
                        </button>
                        <SignOutButton redirectUrl="/sign-in">
                            <button
                                className="cursor-pointer rounded-full transition-colors flex justify-center"
                                style={{ color: "var(--text-muted)" }}
                                onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
                            >
                                <Power strokeWidth={1.75} className="h-6 w-6" />
                            </button>
                        </SignOutButton>
                    </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 h-[62px] flex-shrink-0" style={{ borderBottom: "1px solid #222" }}>
                        {/* Logo text replaced with horizontal logo image */}

                        {/* Desktop → show "Chats" */}
                        <span
                            className="hidden md:inline pl-0.5 text-xl font-semibold"
                            style={{ color: "var(--text-primary)" }}
                        >
                            Chats
                        </span>

                        {/* Mobile → show horizontal logo */}
                        <img
                            src="./horLogo.png"
                            alt="TarsChat"
                            className="h-6 w-auto md:hidden"
                        />

                        <div className="flex items-center gap-1">
                            {/* Avatar shown in header on mobile only (icon rail hidden on mobile) */}
                            <button
                                onClick={() => setShowEditProfile(true)}
                                title="Edit profile"
                                className="cursor-pointer relative group h-8 w-8 flex md:hidden items-center justify-center rounded-full hover:bg-zinc-800 transition-colors mr-1"
                            >
                                {convexUser?.imageUrl ? (
                                    <img src={convexUser.imageUrl} alt="Me" className="h-8 w-8 rounded-full object-cover" />
                                ) : (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold bg-zinc-700 text-white">
                                        {(convexUser?.name ?? currentUser.fullName ?? "?")[0]?.toUpperCase()}
                                    </div>
                                )}
                                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-white/10" />
                            </button>

                            <button onClick={() => setView("new-chat")} title="New message"
                                className="cursor-pointer rounded-lg p-1.5 transition-colors"
                                style={{ color: "var(--text-tertiary)" }}
                                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-muted)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}>
                                <MessageSquarePlus className="h-4 w-4" />
                            </button>
                            <button onClick={() => setShowCreateGroup(true)} title="New group"
                                className="cursor-pointer rounded-lg p-1.5 transition-colors"
                                style={{ color: "var(--text-tertiary)" }}
                                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-muted)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}>
                                <Users className="h-4 w-4" />
                            </button>
                            <button
                                title="Manage Account"
                                onClick={() => openUserProfile()}
                                className="cursor-pointer rounded-lg p-1.5 transition-colors"
                                style={{ color: "var(--text-tertiary)" }}
                                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-muted)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}
                            >
                                <EllipsisVertical className="h-4.5 w-5" />
                            </button>
                            {/* Sign out in header — mobile only (desktop uses icon rail) */}
                            <SignOutButton redirectUrl="/sign-in">
                                <button
                                    title="Sign out"
                                    className="cursor-pointer flex md:hidden rounded-lg p-1.5 transition-colors"
                                    style={{ color: "var(--text-tertiary)" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-muted)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}
                                >
                                    <Power strokeWidth={1.75} className="h-4 w-4" />
                                </button>
                            </SignOutButton>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="px-3 py-2" style={{ borderBottom: "1px solid #1a1a1a" }}>
                        <div className="flex items-center gap-2 rounded-full px-3 py-2" style={{ background: "var(--bg-subtle)", border: "1px solid #2a2a2a" }}>
                            <Search className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onFocus={e => {
                                    const parent = e.currentTarget.parentElement!;
                                    parent.style.border = "1px solid rgba(255,255,255,0.35)";
                                    parent.style.boxShadow = "0 0 0 2px rgba(255,255,255,0.08), 0 4px 18px rgba(255,255,255,0.06)";
                                    parent.style.background = "rgba(255,255,255,0.04)";
                                }}
                                placeholder="Search Chats"
                                className="flex-1 bg-transparent text-sm outline-none"
                                style={{ color: "var(--text-primary)" }}
                            />
                            {searchQuery && (
                                <button className="cursor-pointer" onClick={() => setSearchQuery("")}>
                                    <X className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter tabs: All | Unread N | Groups N */}
                    <div className="flex items-center gap-1.5 px-3 py-2" style={{ borderBottom: "1px solid #111" }}>
                        {(["all", "unread", "groups"] as const).map((tab) => {
                            const label =
                                tab === "all" ? "All"
                                    : tab === "unread" ? `Unread${unreadCount > 0 ? " " + unreadCount : ""}`
                                        : `Groups${groupCount > 0 ? " " + groupCount : ""}`;
                            const active = activeTab === tab;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className="cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-all"
                                    style={{
                                        background: active ? "var(--text-primary)" : "var(--bg-subtle)",
                                        color: active ? "var(--bg-base)" : "var(--text-muted)",
                                        border: active ? "none" : "1px solid #222",
                                    }}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {/* List — min-h-0 is critical: without it flex-1 ignores overflow and expands the parent */}
                    <div className="min-h-0 flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}>
                        {conversations === undefined ? (
                            <div className="space-y-px p-2">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-3">
                                        <div className="skeleton h-10 w-10 flex-shrink-0 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <div className="skeleton h-3 w-24 rounded" />
                                            <div className="skeleton h-2.5 w-36 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filtered && filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center px-8">
                                <MessageSquarePlus className="h-8 w-8" style={{ color: "var(--bg-border-faint)" }} />
                                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                                    {searchQuery ? `No results for "${searchQuery}"` : activeTab === "unread" ? "No unread conversations" : activeTab === "groups" ? "No group chats yet" : "No conversations yet"}
                                </p>
                            </div>
                        ) : (
                            <div className="p-2 space-y-px">
                                {filtered?.map(convo => (
                                    <ConversationItem
                                        key={convo._id}
                                        conversation={convo}
                                        currentUserId={currentUser.id}
                                        isSelected={selectedConversationId === convo._id}
                                        onSelect={() => onSelectConversation(convo._id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>


                </div>{/* end chat list */}
            </div>{/* end root wrapper */}

            {/* Modals — outside the root wrapper so fixed positioning isn't clipped */}
            {showCreateGroup && (
                <CreateGroupModal
                    currentUserId={currentUser.id}
                    onClose={() => setShowCreateGroup(false)}
                    onCreated={(id) => { onSelectConversation(id); setShowCreateGroup(false); }}
                />
            )}

            {showEditProfile && (
                <EditProfileModal
                    clerkId={currentUser.id}
                    currentName={convexUser?.name ?? currentUser.fullName ?? ""}
                    currentBio={convexUser?.bio}
                    currentImageUrl={convexUser?.imageUrl}
                    onClose={() => setShowEditProfile(false)}
                />
            )}
        </>
    );
}