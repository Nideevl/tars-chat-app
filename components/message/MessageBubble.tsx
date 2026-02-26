"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { formatTimeOnly } from "@/lib/formatDate";
import { ContextMenu } from "./ContextMenu"
import { ReactionDetail } from "./ReactionDetail"
import { ReplyHeader } from "./ReplyHeader"
import { Reply, Loader2, Smile, EllipsisVertical } from "lucide-react";
import { MessageEmojiPicker } from "./MessageEmojiPicker";
import { MemberAvatar } from "./MemberAvatar";
import { ReadStatusLabel } from "./ReadStatusLabel";

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

function getBubbleRadius(isMe: boolean, isFirst: boolean, isLast: boolean) {
    const R = 18, F = 5;
    if (isMe) {
        if (isFirst && isLast) return `${R}px ${R}px ${R}px ${R}px`;
        if (isFirst) return `${R}px ${R}px ${F}px ${R}px`;
        if (isLast) return `${R}px ${F}px ${R}px ${R}px`;
        return `${R}px ${F}px ${F}px ${R}px`;
    } else {
        if (isFirst && isLast) return `${R}px ${R}px ${R}px ${R}px`;
        if (isFirst) return `${R}px ${R}px ${R}px ${F}px`;
        if (isLast) return `${F}px ${R}px ${R}px ${R}px`;
        return `${F}px ${R}px ${R}px ${F}px`;
    }
}

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
    isLastMessage,
    onPickerOpen,
    onPickerClose,
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
    onPickerOpen?: () => void;
    onPickerClose?: () => void;
    onReply: (message: MessageWithSender) => void;
    onJumpToMessage: (id: Id<"messages">) => void;
    messageRef?: (el: HTMLDivElement | null) => void;
}) {
    const [showPicker, setShowPicker] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [hover, setHover] = useState(false);
    const [positionAbove, setPositionAbove] = useState(false);
    const bubbleRef = useRef<HTMLDivElement | null>(null);

    const deleteForEveryone = useMutation(api.messages.deleteForEveryone);
    const deleteForMe = useMutation(api.messages.deleteForMe);
    const toggleReaction = useMutation(api.messages.toggleReaction);

    const isMe = message.senderId === currentUserId;
    const reactions = message.reactions.filter((r) => r.userIds.length > 0);
    const myReaction = reactions.find((r) => r.userIds.includes(currentUserId))?.emoji ?? null;
    const totalReactors = new Set(reactions.flatMap((r) => r.userIds)).size;

    const [showSeenDetail, setShowSeenDetail] = useState(false);

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

    const openMenu = () => { measurePosition(); setShowMenu(true); setShowPicker(false); setShowDetail(false); onPickerOpen?.(); };
    const openPicker = () => { measurePosition(); setShowPicker(true); setShowMenu(false); setShowDetail(false); onPickerOpen?.(); };
    const togglePicker = () => { if (showPicker) { setShowPicker(false); onPickerClose?.(); } else { openPicker(); } };
    const openDetail = () => {
        measurePosition();
        setShowDetail(true);
        setShowPicker(false);
        onPickerOpen?.();
        setShowMenu(false);
    };
    const closePicker = () => { setShowPicker(false); onPickerClose?.(); };
    const closeDetail = () => { setShowDetail(false); onPickerClose?.(); };

    const enrichedReactions = reactions.map((r) => ({
        ...r,
        senderNames: Object.fromEntries(r.userIds.map((uid) => [uid, allUsers?.find((u) => u.clerkId === uid)?.name ?? uid.slice(0, 8)])),
        senderAvatars: Object.fromEntries(r.userIds.map((uid) => [uid, allUsers?.find((u) => u.clerkId === uid)?.imageUrl ?? ""])),
    }));

    const handleReact = async (emoji: string) => {
        await toggleReaction({ messageId: message._id, userId: currentUserId, emoji });
        setShowPicker(false);
    };

    return (
        <div
            ref={(el) => {
                bubbleRef.current = el;
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
                {!isMe && isFirstInGroup && <div className="mr-2 mt-auto flex-shrink-0 z-10"><MemberAvatar sender={message.sender} /></div>}
                {!isFirstInGroup && !isMe && !showSender && <div className="mr-2 w-6 flex-shrink-0" />}

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
                        <MessageEmojiPicker isMe={isMe} positionAbove={positionAbove} myReaction={myReaction} onSelect={handleReact} onClose={closePicker} />
                    )}
                    {/* Context menu */}
                    {showMenu && (
                        <ContextMenu
                            isMe={isMe}
                            onReply={() => onReply(message)}
                            onCopy={() => message.content && navigator.clipboard.writeText(message.content)}
                            onReact={(emoji) => handleReact(emoji)}
                            onDeleteForMe={() => deleteForMe({ messageId: message._id, userId: currentUserId })}
                            onDeleteForEveryone={isMe ? () => deleteForEveryone({ messageId: message._id, userId: currentUserId }) : undefined}
                            onClose={() => { setShowMenu(false); onPickerClose?.(); }}
                            positionAbove={positionAbove}
                            alignRight={isMe}
                        />
                    )}

                    {/* ── Message bubble + overlapping reaction pill ─────────────────── */}
                    {/* pb-3 makes room for the pill to overlap into */}
                    <div className="relative max-w-[100%]" style={{ paddingBottom: reactions.length > 0 && !message.isDeleted ? 10 : 0 }}>
                        {/* Bubble */}
                        <div
                            data-bubble="true"
                            style={{
                                background: isMe
                                    ? "linear-gradient(135deg, #7C3AED 0%, #6D33AA 40%, #4C1D95 100%)"
                                    : "rgba(255,255,255,0.12)",
                                backdropFilter: "blur(12px)",
                                WebkitBackdropFilter: "blur(12px)",
                                // border: isMe ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(255,255,255,0.1)",
                                borderRadius: getBubbleRadius(isMe, isFirstInGroup, isLastInGroup),
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
                                            onClose={closeDetail}
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
            {isMe && isLastMessage && !message.isDeleted && (
                <div className={`flex items-center px-1 z-20 ${isMe ? "justify-end" : "justify-start"}`}>
                    <ReadStatusLabel
                        readStatus={readStatus}
                        isGroup={isGroup}
                        allGroupSeen={allGroupSeen}
                        groupSeenBy={groupSeenBy}
                        allUsers={allUsers}
                        positionAbove={positionAbove}
                        showSeenDetail={showSeenDetail}
                        onToggleSeenDetail={() => { measurePosition(); setShowSeenDetail(v => !v); }}
                    />
                </div>
            )}
        </div>
    );
}