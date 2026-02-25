"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { formatTimeOnly } from "@/lib/formatDate";
import { Reply, Trash2, X, Copy, Loader2, AlertCircle, Smile, EllipsisVertical } from "lucide-react";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

interface ReplySnippet {
    _id: Id<"messages">;
    content: string;
    isDeleted: boolean;
    senderId: string;
    sender?: { name: string } | null;
}

interface MessageWithSender extends Doc<"messages"> {
    sender?: Doc<"users"> | null;
    replyTo?: ReplySnippet | null;
}

// ─── Reply Preview — shown ABOVE the bubble (outside), like the image ─────────
function ReplyHeader({
    replyTo,
    currentUserId,
    isMe,
    onJump,
}: {
    replyTo: ReplySnippet;
    currentUserId: string;
    isMe: boolean;
    onJump: (id: Id<"messages">) => void;
}) {
    const isReplyToMe = replyTo.senderId === currentUserId;
    const name = isReplyToMe ? "you" : replyTo.sender?.name ?? "Unknown";
    const text = replyTo.isDeleted ? "Message deleted" : replyTo.content;

    return (
        <div className={`flex flex-col mb-1 ${isMe ? "items-end" : "items-start"}`}>
            {/* "Replied to you" label */}
            <span className="text-xs mb-1 px-1 mt-3" style={{ color: "rgba(245,245,245,0.7)" }}>
                Replied to {name}
            </span>
            {/* Quoted message strip */}
            <button
                onClick={() => onJump(replyTo._id)}
                className={`flex flex-col rounded-xl px-3 py-2 text-left transition-opacity hover:opacity-75 max-w-full`}
                style={{
                    background: isMe ? "rgba(255,255,255,0.15)" : "rgba(168,85,247,0.3)",
                    borderLeft: `3px solid ${isMe ? "rgba(168,85,247,0.6)" : "rgba(255,255,255,0.2)"}`,
                }}
            >
                <span
                    className="line-clamp-2 text-xs"
                    style={{
                        color: isMe ? "rgba(220,200,255,0.7)" : "rgba(255,255,255,0.7)",
                        fontStyle: replyTo.isDeleted ? "italic" : "normal",
                    }}
                >
                    {text.length > 80 ? text.slice(0, 80) + "…" : text}
                </span>
            </button>
        </div>
    );
}

// Reaction Detail Sheet 
function ReactionDetail({
    reactions,
    onClose,
    isMe,
    positionAbove,
    currentUserId,
    onToggleReaction,
}: {
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
}) {
    const [tab, setTab] = useState("all");

    const allRows = reactions.flatMap((r) =>
        r.userIds.map((uid) => {
            const isMine =
                String(uid).trim() ===
                String(currentUserId).trim();

            return {
                emoji: r.emoji,
                uid,
                isMine,
                name: isMine
                    ? "You"
                    : r.senderNames?.[uid] ??
                    uid.slice(0, 12),
                avatar: r.senderAvatars?.[uid],
            };
        })
    );


    const visibleRows =
        tab === "all"
            ? allRows
            : allRows.filter((row) => row.emoji === tab);

    return (
        <>
            {/* Backdrop — click outside closes */}
            <div className="fixed inset-0 z-40" onClick={onClose} />

            {/* Reaction panel */}
            <div
                className="absolute z-50 overflow-hidden rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#0d0d18",
                    border: "1px solid rgba(255,255,255,0.1)",
                    width: 260,
                    ...(positionAbove
                        ? { bottom: "calc(100% + 8px)" }
                        : { top: "calc(100% + 8px)" }),
                    ...(isMe ? { right: 0 } : { left: 0 }),
                }}
            >
                {/* Tabs */}
                <div
                    className="flex items-center gap-1 overflow-x-auto px-3 py-2.5"
                    style={{
                        borderBottom:
                            "1px solid rgba(255,255,255,0.1)",
                        scrollbarWidth: "none",
                    }}
                >
                    <button
                        onClick={() => setTab("all")}
                        className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
                        style={{
                            background:
                                tab === "all"
                                    ? "#a855f7"
                                    : "rgba(255,255,255,0.05)",
                            color:
                                tab === "all"
                                    ? "#fff"
                                    : "rgba(200,180,255,0.5)",
                        }}
                    >
                        All {allRows.length}
                    </button>

                    {reactions.map((r) => {
                        const reacted =
                            r.userIds.includes(currentUserId);

                        return (
                            <button
                                key={r.emoji}
                                onClick={async () => {
                                    if (reacted) {
                                        await onToggleReaction(r.emoji);
                                        onClose();
                                    } else {
                                        setTab(r.emoji);
                                    }
                                }}
                                className="flex flex-shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                                style={{
                                    background:
                                        tab === r.emoji
                                            ? "#a855f7"
                                            : "rgba(255,255,255,0.05)",
                                    color:
                                        tab === r.emoji
                                            ? "#fff"
                                            : "rgba(200,180,255,0.5)",
                                }}
                            >
                                <span>{r.emoji}</span>
                                <span>{r.userIds.length}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Rows */}
                <div
                    className="max-h-52 overflow-y-auto"
                    style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "#333 transparent",
                    }}
                >
                    {visibleRows.map((row, i) => (
                        <div
                            key={i}
                            onClick={async () => {
                                if (row.isMine) {
                                    await onToggleReaction(row.emoji);
                                    onClose();
                                }
                            }}
                            className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                            style={{
                                borderBottom:
                                    "1px solid #1a1a1a",
                                background: row.isMine
                                    ? "rgba(168,85,247,0.08)"
                                    : "transparent",
                            }}
                        >
                            {row.avatar ? (
                                <img
                                    src={row.avatar}
                                    alt={row.name}
                                    className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                                    style={{
                                        border: "1px solid #333",
                                    }}
                                />
                            ) : (
                                <div
                                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                                    style={{
                                        background:
                                            "rgba(168,85,247,0.15)",
                                        color: "#f0eeff",
                                        border:
                                            "1px solid rgba(255,255,255,0.1)",
                                    }}
                                >
                                    {row.name[0]?.toUpperCase()}
                                </div>
                            )}

                            <div className="flex flex-1 flex-col">
                                <span
                                    className="text-sm"
                                    style={{
                                        color: "#ffffff",
                                    }}
                                >
                                    {row.name}
                                </span>

                                {row.isMine && (
                                    <span
                                        className="text-xs"
                                        style={{
                                            color: "#9f8cff",
                                        }}
                                    >
                                        Click to remove
                                    </span>
                                )}
                            </div>

                            <span className="text-xl">
                                {row.emoji}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

// ─── Context Menu ──────────────
function ContextMenu({
    isMe,
    onReply,
    onCopy,
    onReact,
    onDeleteForMe,
    onDeleteForEveryone,
    onClose,
    positionAbove,
    alignRight,
}: {
    isMe: boolean;
    onReply: () => void;
    onCopy: () => void;
    onReact: () => void;
    onDeleteForMe: () => void;
    onDeleteForEveryone?: () => void;
    onClose: () => void;
    positionAbove: boolean;
    alignRight: boolean;
}) {
    const [showDeleteSub, setShowDeleteSub] = useState(false);

    const menuItem = (icon: React.ReactNode, label: string, onClick: () => void, danger = false) => (
        <button
            onClick={onClick}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
            style={{ color: danger ? "#f87171" : "#c4bae8" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(168,85,247,0.1)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
            {icon}{label}
        </button>
    );

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div
                className="absolute z-50 overflow-hidden rounded-2xl shadow-2xl"
                style={{
                    background: "#0d0d18",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid rgba(110,80,200,0.25)",
                    minWidth: 200,
                    ...(positionAbove ? { bottom: "calc(100% + 6px)" } : { top: "calc(100% + 6px)" }),
                    ...(alignRight ? { right: 0 } : { left: 0 }),
                }}
            >
                {/* Quick emoji strip */}
                <div className="flex items-center gap-1 px-3 py-2.5" style={{ borderBottom: "1px solid #1f1f1f" }}>
                    {REACTION_EMOJIS.map((emoji) => (
                        <button key={emoji} onClick={() => { onReact(); onClose(); }}
                            className="rounded-full p-1.5 text-xl transition-all hover:scale-125" title={emoji}>
                            {emoji}
                        </button>
                    ))}
                </div>

                {menuItem(<Reply className="h-4 w-4" />, "Reply", () => { onReply(); onClose(); })}
                {menuItem(<Copy className="h-4 w-4" />, "Copy", () => { onCopy(); onClose(); })}

                {!showDeleteSub
                    ? menuItem(<Trash2 className="h-4 w-4" />, "Delete", () => setShowDeleteSub(true), true)
                    : (
                        <div style={{ borderTop: "1px solid #1f1f1f" }}>
                            <p className="px-4 py-2 text-xs" style={{ color: "rgba(168,85,247,0.5)" }}>Delete for…</p>
                            {menuItem(<Trash2 className="h-4 w-4" />, "Delete for me", () => { onDeleteForMe(); onClose(); }, true)}
                            {isMe && onDeleteForEveryone && menuItem(<Trash2 className="h-4 w-4" />, "Delete for everyone", () => { onDeleteForEveryone(); onClose(); }, true)}
                            {menuItem(<X className="h-4 w-4" />, "Cancel", () => setShowDeleteSub(false))}
                        </div>
                    )
                }
            </div>
        </>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function MessageBubble({
    message,
    currentUserId,
    showSender,
    isFirstInGroup,
    isLastInGroup,
    allUsers,
    readReceipts,
    isGroup,
    isSending,
    isLastMessage,       // ← NEW: only show Seen/Sent on the very last message
    onReply,
    onJumpToMessage,
    messageRef,
}: {
    message: MessageWithSender;
    currentUserId: string;
    showSender: boolean;
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
    allUsers?: { clerkId: string; name: string; imageUrl?: string }[];
    readReceipts?: Record<string, number>;
    isGroup?: boolean;
    isSending?: boolean;
    isLastMessage?: boolean;
    onReply: (message: MessageWithSender) => void;
    onJumpToMessage: (id: Id<"messages">) => void;
    messageRef?: (el: HTMLDivElement | null) => void;
}) {
    const [showPicker, setShowPicker] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [hover, setHover] = useState(false);
    const [positionAbove, setPositionAbove] = useState(false);

    const bubbleRef = useRef<HTMLDivElement>(null);

    const deleteForEveryone = useMutation(api.messages.deleteForEveryone);
    const deleteForMe = useMutation(api.messages.deleteForMe);
    const toggleReaction = useMutation(api.messages.toggleReaction);

    const isMe = message.senderId === currentUserId;
    const reactions = message.reactions.filter((r) => r.userIds.length > 0);
    const myReaction = reactions.find((r) => r.userIds.includes(currentUserId))?.emoji ?? null;
    const totalReactors = new Set(reactions.flatMap((r) => r.userIds)).size;

    const [showSeenDetail, setShowSeenDetail] = useState(false);
    const seenDetailRef = useRef<HTMLDivElement>(null);

    // ── Read status (computed for all messages, shown selectively) ───────────
    const otherParticipantIds = Object.keys(readReceipts ?? {}).filter((id) => id !== currentUserId);

    // In group: who has seen this message (read past its creation time)
    const groupSeenBy = isGroup
        ? otherParticipantIds.filter((id) => (readReceipts?.[id] ?? 0) >= message._creationTime)
        : [];
    const groupTotalOthers = otherParticipantIds.length;
    const allGroupSeen = groupTotalOthers > 0 && groupSeenBy.length === groupTotalOthers;

    const readStatus: "sending" | "sent" | "seen" = (() => {
        if (isSending) return "sending";
        if (!isMe || message.isDeleted) return "sent";
        if (!readReceipts) return "sent";
        if (isGroup) return groupSeenBy.length > 0 ? "seen" : "sent";
        const anySeen = otherParticipantIds.some((id) => (readReceipts[id] ?? 0) >= message._creationTime);
        return anySeen ? "seen" : "sent";
    })();

    const measurePosition = () => {
        if (!bubbleRef.current) return;
        const rect = bubbleRef.current.getBoundingClientRect();
        setPositionAbove(rect.top > window.innerHeight / 2);
    };

    const openMenu = () => { measurePosition(); setShowMenu(true); setShowPicker(false); setShowDetail(false); };
    const openPicker = () => { measurePosition(); setShowPicker(true); setShowMenu(false); setShowDetail(false); };
    const togglePicker = () => { if (showPicker) { setShowPicker(false); } else { openPicker(); } };
    const openDetail = () => { measurePosition(); setShowDetail(true); setShowPicker(false); setShowMenu(false); };

    const enrichedReactions = reactions.map((r) => ({
        ...r,
        senderNames: Object.fromEntries(r.userIds.map((uid) => [uid, allUsers?.find((u) => u.clerkId === uid)?.name ?? uid.slice(0, 8)])),
        senderAvatars: Object.fromEntries(r.userIds.map((uid) => [uid, allUsers?.find((u) => u.clerkId === uid)?.imageUrl ?? ""])),
    }));

    const handleReact = async (emoji: string) => {
        await toggleReaction({ messageId: message._id, userId: currentUserId, emoji });
        setShowPicker(false);
    };

    const handleCopy = () => { if (message.content) navigator.clipboard.writeText(message.content); };
    const br = (() => {
        const R = 18;
        const F = 5;
        const solo = isFirstInGroup && isLastInGroup;
        const first = isFirstInGroup && !isLastInGroup;
        const middle = !isFirstInGroup && !isLastInGroup;
        const last = !isFirstInGroup && isLastInGroup;
    // this is structure of message bubble depending upon who is sender or reciever
        if (isMe) {
            if (solo) return `${R}px ${R}px ${R}px ${R}px`;
            if (first) return `${R}px ${R}px ${F}px ${R}px`;
            if (middle) return `${R}px ${F}px ${F}px ${R}px`;
            if (last) return `${R}px ${F}px ${R}px ${R}px`;
        } else {
            if (solo) return `${R}px ${R}px ${R}px ${R}px`;
            if (first) return `${R}px ${R}px ${R}px ${F}px`;
            if (middle) return `${F}px ${R}px ${R}px ${F}px`;
            if (last) return `${F}px ${R}px ${R}px ${R}px`;
        }
        return `${R}px`;
    })();

    // ── Whether to show Seen/Sent label ──────────────────────────────────────
    // Always show a spinner/error icon inline for any message.
    // Only show "Seen" / "Sent" text below the last message.
    const showStatusLabel = isMe && isLastMessage && !message.isDeleted;

    return (
        <div
            ref={(el) => {
                (bubbleRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                messageRef?.(el);
            }}
            className={`flex flex-col ${isMe ? "items-end" : "items-start"} ${showSender ? "mt-3" : "mt-0.5"}`}
        >
            {/* Row: avatar + bubble column */}
            <div className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
            >
                {/* Other user avatar in groups */}
                {!isMe && showSender && (
                    <div className="mr-2 mt-auto flex-shrink-0 z-10">
                        {message.sender?.imageUrl
                            ? <img src={message.sender.imageUrl} alt="" className="h-6 w-6 rounded-full object-cover" style={{ border: "1px solid #333" }} />
                            : <div className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold" style={{ background: "rgba(168,85,247,0.15)", color: "#f0eeff", border: "1px solid rgba(168,85,247,0.25)" }}>
                                {message.sender?.name?.[0]?.toUpperCase()}
                            </div>
                        }
                    </div>
                )}
                {!isMe && !showSender && <div className="mr-2 w-6 flex-shrink-0" />}

                <div className={`relative flex max-w-[65%] flex-col ${isMe ? "items-end" : "items-start"}`}>

                    {/* Sender name in groups */}
                    {!isMe && showSender && message.sender && (
                        <span className="mb-1 px-1 text-xs font-medium" style={{ color: "#c084fc" }}>
                            {message.sender.name}
                        </span>
                    )}

                    {/* Reply header — ABOVE the bubble, OUTSIDE */}
                    {message.replyTo && !message.isDeleted && (
                        <ReplyHeader
                            replyTo={message.replyTo}
                            currentUserId={currentUserId}
                            isMe={isMe}
                            onJump={onJumpToMessage}
                        />
                    )}

                    {/* Emoji picker */}
                    {showPicker && (
                        <>
                            <div
                                className="fixed inset-0 z-0"
                                onClick={() => setShowPicker(false)}
                            />

                            <div
                                className={`absolute ${isMe ? "right-0" : "left-0"
                                    } z-30 flex gap-1.5 rounded-full px-2 py-1.5 shadow-2xl backdrop-blur-md`}
                                style={{
                                    background: "rgba(26,26,26,0.95)",
                                    border: "1px solid #2a2a2a",
                                    ...(positionAbove
                                        ? { bottom: "calc(100% + 8px)" }
                                        : { top: "calc(100% + 8px)" }),
                                }}
                            >
                                {REACTION_EMOJIS.map((emoji, index) => {
                                    const isCurrent = myReaction === emoji;

                                    return (
                                        <button
                                            key={emoji}
                                            onClick={() => handleReact(emoji)}
                                            className="
              relative rounded-full p-2 text-xl
              transition-all duration-200 ease-out
              hover:scale-125 hover:-translate-y-1
              active:scale-110
            "
                                            style={{
                                                background: isCurrent ? "rgba(168,85,247,0.25)" : "transparent",
                                                outline: isCurrent ? "2px solid #a855f7" : "none",
                                                outlineOffset: 2,
                                                animation: `emoji-wave 350ms cubic-bezier(.34,1.56,.64,1)`,
                                                animationDelay: `${index * 70}ms`,
                                                animationFillMode: "both",
                                            }}
                                        >
                                            <span className="relative">{emoji}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Context menu */}
                    {showMenu && (
                        <ContextMenu
                            isMe={isMe}
                            onReply={() => onReply(message)}
                            onCopy={handleCopy}
                            onReact={openPicker}
                            onDeleteForMe={() => deleteForMe({ messageId: message._id, userId: currentUserId })}
                            onDeleteForEveryone={isMe ? () => deleteForEveryone({ messageId: message._id, userId: currentUserId }) : undefined}
                            onClose={() => setShowMenu(false)}
                            positionAbove={positionAbove}
                            alignRight={isMe}
                        />
                    )}

                    {/* ── Message bubble + overlapping reaction pill ─────────────────── */}
                    {/* pb-3 makes room for the pill to overlap into */}
                    <div className="relative max-w-[100%]" style={{ paddingBottom: reactions.length > 0 && !message.isDeleted ? 10 : 0 }}>
                        {/* Bubble */}
                        <div style={{
                            background: isMe
                                ? "linear-gradient(135deg, #7C3AED 0%, #6D33AA 40%, #4C1D95 100%)"
                                : "rgba(255,255,255,0.12)",
                            backdropFilter: "blur(12px)",
                            WebkitBackdropFilter: "blur(12px)",
                            // border: isMe ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(255,255,255,0.1)",
                            borderRadius: br,
                            padding: "8px 14px 10px",
                            boxShadow: isMe ? "0 2px 20px rgba(100,40,210,0.3), inset 0 1px 0 rgba(255,255,255,0.08)" : "none",
                        }}>
                            {message.isDeleted ? (
                                <p className="text-sm italic mr-1.5" style={{ color: isMe ? "rgba(200,180,255,0.45)" : "rgba(255,255,255,0.3)" }}>
                                    Message deleted
                                    <span className="inline-block" style={{ width: 44 }} />
                                </p>
                            ) : (
                                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed mr-1.5" style={{ color: "#ffff" }}>
                                    {message.content}
                                    {/* Invisible spacer — reserves space so text never overlaps the floated timestamp */}
                                    <span className="inline-block" style={{ width: isSending ? 52 : 42 }} />
                                </p>

                            )}

                            {/* Timestamp — floated bottom-right, WhatsApp style */}
                            <div
                                style={{
                                    float: "right",
                                    clear: "right",
                                    marginTop: -7,
                                    marginBottom: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    lineHeight: 1,
                                }}
                            >
                                <span style={{ color: isMe ? "rgba(200,180,255,0.8)" : "rgba(255,255,255,0.4)", fontSize: 10, whiteSpace: "nowrap" }}>
                                    {formatTimeOnly(message._creationTime)}
                                </span>
                                {isMe && isSending && (
                                    <Loader2 className="h-2.5 w-2.5 animate-spin" style={{ color: "#555" }} />
                                )}
                                {/* Hover actions */}
                                {hover && !message.isDeleted && (
                                    <div className={`absolute ${isMe ? "right-full mr-2" : "left-full ml-2"} top-1/2 -translate-y-1/2 z-30 flex gap-1.5 rounded-2xl px-3 py-2.5`}>
                                        <button onClick={togglePicker}
                                            className="rounded-lg p-1.5 transition-colors"
                                            style={{ background: "rgba(168,85,247,0.12)" }}
                                            onMouseEnter={e => (e.currentTarget.style.color = "#c084fc")}
                                            onMouseLeave={e => (e.currentTarget.style.color = "#7c6aa0")}
                                        >
                                            <span ><Smile size={18} strokeWidth={1.5} /></span>
                                        </button>
                                        <button onClick={() => onReply(message)}
                                            className="rounded-lg p-1.5 transition-colors"
                                            style={{ background: "rgba(168,85,247,0.12)" }}
                                            onMouseEnter={e => (e.currentTarget.style.color = "#c084fc")}
                                            onMouseLeave={e => (e.currentTarget.style.color = "#7c6aa0")}
                                        >
                                            <Reply className="h-3.5 w-3.5" />
                                        </button>
                                        <button onClick={openMenu}
                                            className="rounded-lg px-1.5 py-0.25 transition-colors"
                                            style={{ background: "rgba(168,85,247,0.12)" }}
                                            onMouseEnter={e => (e.currentTarget.style.color = "#c084fc")}
                                            onMouseLeave={e => (e.currentTarget.style.color = "#7c6aa0")}
                                        >
                                            <span style={{ lineHeight: 1 }}><EllipsisVertical size={15} /></span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Reaction pill — overlaps bubble bottom by ~50% of its height */}
                        {reactions.length > 0 && !message.isDeleted && (
                            <div
                                className={`absolute ${isMe ? "left-2" : "right-2"} `}
                                style={{ bottom: -2 }}
                            >
                                <div className="relative">
                                    <button
                                        onClick={openDetail}
                                        className="flex items-center gap-1 rounded-full px-1 py-0.5 text-sm shadow-lg transition-colors"
                                        style={{
                                            background: isMe
                                                ? "rgba(0,0,0,0.75)"
                                                : "rgba(168,85,247,0.5)",
                                            backdropFilter: "blur(8px)",
                                            border: "2px solid rgba(168,85,247,0.3)",
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = "#333")}
                                        onMouseLeave={e => (e.currentTarget.style.background = "#2a2a2a")}
                                    >
                                        <span className="leading-none" style={{ fontSize: 13 }}>
                                            {reactions.map((r) => r.emoji).join("")}
                                        </span>
                                        {totalReactors > 1 && (
                                            <span className="text-xs font-semibold" style={{ color: "#c084fc" }}>
                                                {totalReactors}
                                            </span>
                                        )}
                                    </button>

                                    {showDetail && (
                                        <ReactionDetail
                                            reactions={enrichedReactions}
                                            onClose={() => setShowDetail(false)}
                                            isMe={isMe}
                                            currentUserId={currentUserId}
                                            positionAbove={positionAbove}
                                            onToggleReaction={handleReact}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Seen / Sent / Group Seen label — only on last message ─────────── */}
            {showStatusLabel && (
                <div className={`flex items-center px-1 z-20 ${isMe ? "justify-end" : "justify-start"}`}>
                    {isGroup && readStatus === "seen" ? (
                        // Group seen — show names or plain "Seen" if everyone saw it
                        <div className="relative" ref={seenDetailRef}>
                            {allGroupSeen ? (
                                // Everyone saw it — plain "Seen", no modal
                                <span style={{
                                    WebkitTextStroke: "0.25px #a855f7", fontSize: 13, fontStyle: "italic", color: "#a855f7", textShadow:
                                        readStatus === "seen"
                                            ? "0 0 6px rgba(168,85,247,0.6), 0 0 12px rgba(168,85,247,0.35)"
                                            : "0 0 4px rgba(120,110,180,0.35)",
                                }}>Seen</span>
                            ) : (
                                // Some saw it — clickable with names
                                <button
                                    onClick={() => {
                                        measurePosition();
                                        setShowSeenDetail(v => !v);
                                    }}
                                    className="transition-opacity hover:opacity-70"
                                    style={{ fontSize: 15, fontStyle: "italic", color: "#a855f7", textAlign: "right" }}
                                >
                                    {(() => {
                                        const seenUsers = groupSeenBy
                                            .map(id => allUsers?.find(u => u.clerkId === id)?.name ?? "Someone")
                                            .filter(Boolean);
                                        const shown = seenUsers.slice(0, 2);
                                        const rest = seenUsers.length - shown.length;
                                        return `Seen by ${shown.join(", ")}${rest > 0 ? ` & ${rest} other${rest > 1 ? "s" : ""}` : ""}`;
                                    })()}
                                </button>
                            )}

                            {/* Seen-by detail dropdown — smart position, capped height */}
                            {showSeenDetail && !allGroupSeen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowSeenDetail(false)} />
                                    <div
                                        className="absolute z-50 overflow-hidden rounded-2xl shadow-2xl"
                                        style={{
                                            background: "#0d0d18",
                                            backdropFilter: "blur(16px)",
                                            WebkitBackdropFilter: "blur(16px)",
                                            border: "1px solid rgba(110,80,200,0.25)",
                                            width: 220,
                                            ...(positionAbove ? { bottom: "calc(100% + 6px)" } : { top: "calc(100% + 6px)" }),
                                            right: 0,
                                        }}
                                    >
                                        <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #1a1a1a" }}>
                                            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#555" }}>
                                                Seen by {groupSeenBy.length}
                                            </p>
                                        </div>
                                        <div className="overflow-y-auto" style={{ maxHeight: 200, scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}>
                                            {groupSeenBy.map((uid) => {
                                                const u = allUsers?.find(u => u.clerkId === uid);
                                                const name = u?.name ?? "Unknown";
                                                return (
                                                    <div key={uid} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: "1px solid rgba(110,80,200,0.1)" }}>
                                                        {u?.imageUrl
                                                            ? <img src={u.imageUrl} alt={name} className="h-7 w-7 flex-shrink-0 rounded-full object-cover" style={{ border: "1px solid #333" }} />
                                                            : <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold" style={{ background: "rgba(168,85,247,0.15)", color: "#f0eeff", border: "1px solid rgba(168,85,247,0.25)" }}>{name[0]?.toUpperCase()}</div>
                                                        }
                                                        <span className="truncate text-sm" style={{ color: "#d4caff" }}>{name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <span style={{
                            textShadow:
                                readStatus === "seen"
                                    ? "0 0 6px rgba(168,85,247,0.6), 0 0 12px rgba(168,85,247,0.35)"
                                    : "0 0 4px rgba(120,110,180,0.35)", WebkitTextStroke: "0.1px #a855f7", fontSize: 13, fontStyle: "italic", color: readStatus === "seen" ? "#a855f7" : "#4a4568"
                        }}>
                            {readStatus === "seen" ? "Seen" : "Sent"}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}