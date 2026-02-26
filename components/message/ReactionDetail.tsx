"use client";

import { useState } from "react";

interface ReactionDetailProps {
    reactions: {
        emoji: string;
        userIds: string[];
        senderNames?: Record<string, string>;
        senderAvatars?: Record<string, string>;
    }[];
    onClose: () => void;
    isMe: boolean;
    positionAbove: boolean;
    currentUserId: string;
    onToggleReaction: (emoji: string) => void;
}

export function ReactionDetail({
    reactions,
    onClose,
    isMe,
    positionAbove,
    currentUserId,
    onToggleReaction,
}: ReactionDetailProps) {
    const [tab, setTab] = useState("all");

    const allRows = reactions.flatMap((r) =>
        r.userIds.map((uid) => {
            const isMine = String(uid).trim() === String(currentUserId).trim();
            return {
                emoji: r.emoji,
                uid,
                isMine,
                name: isMine ? "You" : r.senderNames?.[uid] ?? uid.slice(0, 12),
                avatar: r.senderAvatars?.[uid],
            };
        })
    );

    const visibleRows = tab === "all" ? allRows : allRows.filter((row) => row.emoji === tab);

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div
                className="absolute z-50 overflow-hidden rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#0d0d18",
                    border: "1px solid rgba(255,255,255,0.1)",
                    width: 260,
                    ...(positionAbove ? { bottom: "calc(100% + 8px)" } : { top: "calc(100% + 8px)" }),
                    ...(isMe ? { right: 0 } : { left: 0 }),
                }}
            >
                {/* Tabs */}
                <div
                    className="flex items-center gap-1 overflow-x-auto px-3 py-2.5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", scrollbarWidth: "none" }}
                >
                    <button
                        onClick={() => setTab("all")}
                        className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
                        style={{
                            background: tab === "all" ? "#a855f7" : "rgba(255,255,255,0.05)",
                            color: tab === "all" ? "#fff" : "rgba(200,180,255,0.5)",
                        }}
                    >
                        All {allRows.length}
                    </button>
                    {reactions.map((r) => {
                        const reacted = r.userIds.includes(currentUserId);
                        return (
                            <button
                                key={r.emoji}
                                onClick={async () => {
                                    if (reacted) { await onToggleReaction(r.emoji); onClose(); }
                                    else setTab(r.emoji);
                                }}
                                className="flex flex-shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                                style={{
                                    background: tab === r.emoji ? "#a855f7" : "rgba(255,255,255,0.05)",
                                    color: tab === r.emoji ? "#fff" : "rgba(200,180,255,0.5)",
                                }}
                            >
                                <span>{r.emoji}</span>
                                <span>{r.userIds.length}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Rows */}
                <div className="max-h-52 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}>
                    {visibleRows.map((row, i) => (
                        <div
                            key={i}
                            onClick={async () => { if (row.isMine) { await onToggleReaction(row.emoji); onClose(); } }}
                            className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                            style={{
                                borderBottom: "1px solid #1a1a1a",
                                background: row.isMine ? "rgba(168,85,247,0.08)" : "transparent",
                            }}
                        >
                            {row.avatar ? (
                                <img src={row.avatar} alt={row.name} className="h-8 w-8 flex-shrink-0 rounded-full object-cover" style={{ border: "1px solid #333" }} />
                            ) : (
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                                    style={{ background: "rgba(168,85,247,0.15)", color: "#f0eeff", border: "1px solid rgba(255,255,255,0.1)" }}>
                                    {row.name[0]?.toUpperCase()}
                                </div>
                            )}
                            <div className="flex flex-1 flex-col">
                                <span className="text-sm" style={{ color: "#ffffff" }}>{row.name}</span>
                                {row.isMine && <span className="text-xs" style={{ color: "#9f8cff" }}>Click to remove</span>}
                            </div>
                            <span className="text-xl">{row.emoji}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}