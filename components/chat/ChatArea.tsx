"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MessageBubble } from "../message/MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { GroupInfoModal } from "./Groupinfomodal";
import { MessageInput } from "./MessageInput";
import { ChatSkeleton } from "./ChatSkeleton";
import { ChatHeader } from "./ChatHeader";
import { ChevronDown } from "lucide-react";
import { formatDateSeparator, isDifferentDay, formatLastSeen } from "@/lib/formatDate";

// ─── Date Separator ───────────────────────────────────────────────────────────
function DateSeparator({ timestamp }: { timestamp: number }) {
    return (
        <div className="flex justify-center my-4">
            <span
                className="text-[11px] px-3 py-1 rounded-full"
                style={{
                    color: "rgba(220,220,255,0.8)",
                    background: "rgba(255,255,255,0.06)",
                    backdropFilter: "blur(80px)",
                    WebkitBackdropFilter: "blur(1px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    letterSpacing: "0.5px",
                }}
            >
                {formatDateSeparator(timestamp)}
            </span>
        </div>
    );
}

interface ChatAreaProps {
    conversationId: Id<"conversations">;
    currentUserId: string;
    currentUserName: string;
    onBack: () => void;
}

// Type for a message that can be replied to
interface ReplyTarget {
    _id: Id<"messages">;
    content: string;
    isDeleted: boolean;
    senderId: string;
    sender?: { name: string } | null;
}

export function ChatArea({ conversationId, currentUserId, currentUserName, onBack }: ChatAreaProps) {
    const [isSending, setIsSending] = useState(false);
    const [sendError, setSendError] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
    const [activePopupId, setActivePopupId] = useState<string | null>(null);
    const [messagesVisible, setMessagesVisible] = useState(false);
    const [showGroupInfo, setShowGroupInfo] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const isAtBottomRef = useRef(true);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastCountRef = useRef(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const initialScrollDoneRef = useRef<string | null>(null); // tracks which convo was initially scrolled
    // Map of messageId → DOM element for jump-to-reply
    const messageRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
    const highlightRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());

    const messages = useQuery(api.messages.getMessages, { conversationId, userId: currentUserId });
    const conversation = useQuery(api.conversations.getConversation, { conversationId });
    const typingUsers = useQuery(api.typing.getTypingUsers, { conversationId, currentUserId });
    const otherUsers = useQuery(api.users.getUsersByClerkIds, {
        clerkIds: conversation?.participantIds.filter(id => id !== currentUserId) ?? [],
    });
    const allParticipants = useQuery(api.users.getUsersByClerkIds, {
        clerkIds: conversation?.participantIds ?? [],
    });
    const readReceipts = useQuery(api.presence.getConversationReadReceipts, { conversationId });

    const setTyping = useMutation(api.typing.setTyping);
    const markRead = useMutation(api.presence.markConversationRead);
    const sendMessage = useMutation(api.messages.sendMessage);

    const isGroup = conversation?.isGroup;
    const headerName = isGroup ? conversation?.name ?? "Group" : otherUsers?.[0]?.name ?? "...";
    const otherLastSeen = !isGroup ? (otherUsers?.[0]?.lastSeen ?? 0) : 0;
    const otherOnline = !isGroup && otherUsers?.[0]?.isOnline;
    const headerAvatar = isGroup ? null : otherUsers?.[0]?.imageUrl;
    const isTypingNow = typingUsers && typingUsers.length > 0;

    useEffect(() => {
        // Only mark as read when the user is actually looking at the tab
        if (document.hidden) return;
        markRead({ conversationId, userId: currentUserId });
    }, [conversationId, currentUserId, messages?.length, markRead]);

    // When user switches back to this tab, mark as read immediately
    useEffect(() => {
        const handleVisibility = () => {
            if (!document.hidden) {
                markRead({ conversationId, userId: currentUserId });
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, [conversationId, currentUserId, markRead]);

    useEffect(() => {
        if (!messages) return;
        const scroll = scrollRef.current;
        if (!scroll) return;

        // ── First load for this conversation: snap to bottom immediately ──────────
        if (initialScrollDoneRef.current !== conversationId) {
            // Use requestAnimationFrame to ensure DOM has rendered the messages
            requestAnimationFrame(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                    setShowScrollButton(false);
                    isAtBottomRef.current = true;
                    setMessagesVisible(true); // reveal after snap — no flicker
                }
            });
            initialScrollDoneRef.current = conversationId;
            lastCountRef.current = messages.length;
            return;
        }

        // ── Subsequent message arrivals ───────────────────────────────────────────
        if (messages.length > lastCountRef.current) {
            if (isAtBottomRef.current) {
                // User is at bottom — keep them there
                requestAnimationFrame(() => {
                    if (scrollRef.current) {
                        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                    }
                });
                setShowScrollButton(false);
            } else {
                // User scrolled up — show the jump button
                setShowScrollButton(true);
            }
        }
        lastCountRef.current = messages.length;
    }, [messages, conversationId, isTypingNow]);

    const handleScroll = useCallback(() => {
        const s = scrollRef.current;
        if (!s) return;
        const atBottom = s.scrollHeight - s.scrollTop - s.clientHeight <= 80;
        isAtBottomRef.current = atBottom;
        // Show button as soon as user scrolls up from bottom
        if (atBottom) {
            setShowScrollButton(false);
        } else {
            setShowScrollButton(true);
        }
    }, []);

    // Keep pinned to bottom when typing indicator appears/disappears
    useEffect(() => {
        if (!isTypingNow) return;
        if (!isAtBottomRef.current) return;
        requestAnimationFrame(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        });
    }, [isTypingNow]);

    // Reset initial scroll flag when conversation changes
    useEffect(() => {
        initialScrollDoneRef.current = null;
        lastCountRef.current = 0;
        isAtBottomRef.current = true;
        setShowScrollButton(false);
        setMessagesVisible(false); // hide until snapped to bottom
    }, [conversationId]);

    // Auto-focus textarea on any printable keypress when nothing else is focused
    useEffect(() => {
        const handleGlobalKey = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            if (e.key.length !== 1) return; // skip special keys
            const active = document.activeElement;
            const isInInput = active && (
                active.tagName === "INPUT" ||
                active.tagName === "TEXTAREA" ||
                (active as HTMLElement).isContentEditable
            );
            if (isInInput) return;
            textareaRef.current?.focus();
            // Don't call preventDefault — let the char land naturally in the textarea
        };
        document.addEventListener("keydown", handleGlobalKey);
        return () => document.removeEventListener("keydown", handleGlobalKey);
    }, []);

    // Jump to a specific message (for reply tap)
    const handleJumpToMessage = useCallback((id: Id<"messages">) => {
        const el = messageRefsMap.current.get(id);
        if (!el) return;

        el.scrollIntoView({ behavior: "smooth", block: "center" });

        setTimeout(() => {
            const row = highlightRefsMap.current.get(id);
            if (!row) return;

            row.style.background = "rgba(168,85,247,0.18)";
            setTimeout(() => {
                row.style.transition = "background 0.6s ease";
                row.style.background = "transparent";
                setTimeout(() => { row.style.transition = ""; }, 600);
            }, 800);
        }, 500);
    }, []);

    const handleTyping = () => {
        setTyping({ conversationId, userId: currentUserId, userName: currentUserName, isTyping: true });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            setTyping({ conversationId, userId: currentUserId, userName: currentUserName, isTyping: false });
        }, 2000);
    };

    const handleSend = async (content: string) => {
        if (!content || isSending) return;
        setIsSending(true);
        setSendError(false);
        const replyToId = replyTarget?._id;
        setReplyTarget(null);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        setTyping({ conversationId, userId: currentUserId, userName: currentUserName, isTyping: false });

        // ← ADD THIS — scroll to bottom immediately when sending
        requestAnimationFrame(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        });

        try {
            await sendMessage({ conversationId, senderId: currentUserId, content, replyToId });
        } catch {
            setSendError(true);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex h-full flex-col">

            <ChatHeader
                conversation={conversation}
                conversationId={conversationId}
                currentUserId={currentUserId}
                isGroup={isGroup}
                headerName={headerName}
                headerAvatar={headerAvatar}
                otherOnline={otherOnline}
                otherLastSeen={otherLastSeen}
                typingUsers={typingUsers}
                isTypingNow={isTypingNow}
                onBack={onBack}
                onOpenGroupInfo={() => setShowGroupInfo(true)}
            />

            {/* Messages */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto pl-4 pr-5 md:pr-8 py-4 pb-2"
                style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#333 transparent",
                    // Hide only when we have messages but haven't snapped to bottom yet
                    opacity: (messages === undefined || messages.length === 0 || messagesVisible) ? 1 : 0,
                    transition: messagesVisible ? "opacity 0.1s ease" : "none",
                }}
            >
                {messages === undefined ? (
                    <ChatSkeleton />
                ) : messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center" ref={el => { if (el) setMessagesVisible(true); }}>
                        <p className="text-sm" style={{ color: "#444" }}>No messages yet. Say hello!</p>
                    </div>
                ) : (
                    <div className="flex flex-col justify-end min-h-full space-y-0.5">
                        {messages.map((msg, i) => {
                            const prev = messages[i - 1];
                            const next = messages[i + 1];
                            const isLastMessage = i === messages.length - 1;
                            const showDateSep = !prev || isDifferentDay(prev._creationTime, msg._creationTime);
                            // Group boundary: a new sender or a date separator breaks the stack
                            const prevSameSender = prev && prev.senderId === msg.senderId && !isDifferentDay(prev._creationTime, msg._creationTime);
                            const nextSameSender = next && next.senderId === msg.senderId && !isDifferentDay(msg._creationTime, next._creationTime);
                            const isFirstInGroup = !prevSameSender;
                            const isLastInGroup = !nextSameSender;
                            return (
                                <div
                                    key={msg._id}
                                    style={{
                                        position: "relative",
                                        zIndex: activePopupId === msg._id ? 100 : 1
                                    }}
                                >
                                    {showDateSep && <DateSeparator timestamp={msg._creationTime} />}
                                    <div style={{ position: "relative" }}>
                                        <div
                                            ref={(el) => {
                                                if (el) highlightRefsMap.current.set(msg._id, el);
                                                else highlightRefsMap.current.delete(msg._id);
                                            }}
                                            className="absolute pointer-events-none"
                                            style={{
                                                top: 0, bottom: 0,
                                                left: "-16px", right: "-16px",
                                                background: "transparent",
                                                zIndex: 0,
                                            }}
                                        />
                                        <div style={{ position: "relative", zIndex: 1 }}>
                                            <MessageBubble
                                                message={msg as any}
                                                currentUserId={currentUserId}
                                                showSender={isFirstInGroup && (isGroup ?? false)}
                                                isFirstInGroup={isFirstInGroup}
                                                isLastInGroup={isLastInGroup}
                                                allUsers={allParticipants ?? undefined}
                                                readReceipts={readReceipts ?? undefined}
                                                isGroup={isGroup ?? false}
                                                isSending={false}
                                                isLastMessage={isLastMessage}
                                                onReply={(m) => setReplyTarget(m as any)}
                                                onJumpToMessage={handleJumpToMessage}
                                                onPickerOpen={() => setActivePopupId(msg._id)}   // ADD
                                                onPickerClose={() => setActivePopupId(null)}
                                                messageRef={(el) => {
                                                    if (el) messageRefsMap.current.set(msg._id, el);
                                                    else messageRefsMap.current.delete(msg._id);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {isTypingNow && <TypingIndicator typingUsers={typingUsers!} />}
                    </div>
                )
                }
            </div>

            {/* Scroll to bottom button — appears when user scrolls up */}
            <div
                className="absolute right-5 z-25 transition-all duration-200"
                style={{
                    bottom: replyTarget ? 140 : 100,
                    opacity: showScrollButton ? 1 : 0,
                    transform: showScrollButton ? "translateY(0) scale(1)" : "translateY(8px) scale(0.9)",
                    pointerEvents: showScrollButton ? "auto" : "none",
                }}
            >
                <button
                    onClick={() => {
                        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
                        setShowScrollButton(false);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full shadow-lg transition-colors"
                    style={{ background: "#1a1a1a", border: "1px solid #333" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#222")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#1a1a1a")}
                    title="Scroll to latest"
                >
                    <ChevronDown className="h-4 w-4" style={{ color: "#aaa" }} />
                </button>
            </div>

            {/* Send error */}
            {sendError && (
                <div className="mx-4 mb-2 flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "var(--error-bg)", border: "1px solid #440000" }}>
                    <span className="text-xs" style={{ color: "var(--error-text)" }}>Failed to send</span>
                </div>
            )}

            <MessageInput
                currentUserId={currentUserId}
                replyTarget={replyTarget}
                isSending={isSending}
                onSend={handleSend}
                onTyping={handleTyping}
                onClearReply={() => setReplyTarget(null)}
                textareaRef={textareaRef}
            />
            {/* Group Info Modal */}
            {showGroupInfo && isGroup && conversation && (
                <GroupInfoModal
                    conversationId={conversationId}
                    currentUserId={currentUserId}
                    currentName={conversation.name ?? "Group"}
                    currentBio={conversation.bio}
                    currentImageUrl={conversation.imageUrl}
                    memberCount={conversation.participantIds.length}
                    onClose={() => setShowGroupInfo(false)}
                />
            )}
        </div>
    );
}   