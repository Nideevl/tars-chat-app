"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { GroupInfoModal } from "./Groupinfomodal";
import { GroupDefaultAvatar } from "./Groupdefaultavatar";
import { Send, ArrowLeft, ChevronDown, MoreVertical, X, Reply, Smile } from "lucide-react";
import { formatDateSeparator, isDifferentDay, formatLastSeen } from "@/lib/formatDate";

// ─── Date Separator ───────────────────────────────────────────────────────────
function DateSeparator({ timestamp }: { timestamp: number }) {
  return (
    <div
      className="relative flex items-center gap-3 my-3 px-2"
      style={{ zIndex: 5 }}
    >
      <div className="flex-1 h-[0.5px]" style={{ background: "black" }} />

      <span
        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
        style={{
          color: "var(--text-muted)",
          background: "var(--bg-base)",
          border: "1px solid var(--bg-border)",
          backdropFilter: "blur(8px)",
        }}
      >
        {formatDateSeparator(timestamp)}
      </span>

      <div className="flex-1 h-[0.5px]" style={{ background: "black" }} />
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
    const [messageText, setMessageText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [sendError, setSendError] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
    const [messagesVisible, setMessagesVisible] = useState(false);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const isAtBottomRef = useRef(true);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastCountRef = useRef(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const initialScrollDoneRef = useRef<string | null>(null); // tracks which convo was initially scrolled
    // Map of messageId → DOM element for jump-to-reply
    const messageRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());

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
    }, [messages, conversationId]);

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
        // Flash highlight
        el.style.transition = "background 0.2s";
        el.style.background = "rgba(96,165,250,0.15)";
        setTimeout(() => { el.style.background = "transparent"; }, 1200);
    }, []);

    const handleTyping = () => {
        setTyping({ conversationId, userId: currentUserId, userName: currentUserName, isTyping: true });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            setTyping({ conversationId, userId: currentUserId, userName: currentUserName, isTyping: false });
        }, 2000);
    };

    const handleSend = async () => {
        const content = messageText.trim();
        if (!content || isSending) return;
        setMessageText("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        setIsSending(true);
        setSendError(false);
        const replyToId = replyTarget?._id;
        setReplyTarget(null);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        setTyping({ conversationId, userId: currentUserId, userName: currentUserName, isTyping: false });
        try {
            await sendMessage({ conversationId, senderId: currentUserId, content, replyToId });
        } catch {
            setSendError(true);
            setMessageText(content);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
        if (e.key === "Escape") setReplyTarget(null);
    };

    const isGroup = conversation?.isGroup;
    const headerName = isGroup ? conversation?.name ?? "Group" : otherUsers?.[0]?.name ?? "...";
    const otherLastSeen = !isGroup ? (otherUsers?.[0]?.lastSeen ?? 0) : 0;
    const otherOnline = !isGroup && otherUsers?.[0]?.isOnline;
    const headerAvatar = isGroup ? null : otherUsers?.[0]?.imageUrl;
    const isTypingNow = typingUsers && typingUsers.length > 0;

    return (
        <div className="flex h-full flex-col" style={{ background: "transparent" }}>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 h-15.5" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(120px) saturate(140%)", borderBottom: "1px solid var(--bg-border)", minHeight: 56 }}>
                <button onClick={onBack} className="rounded-lg p-1.5 md:hidden transition-colors"
                    style={{ color: "var(--text-tertiary)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "transparent"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "transparent"; }}>
                    <ArrowLeft className="h-4 w-4" />
                </button>

                <div className="relative flex-shrink-0">
                    {isGroup ? (
                        conversation?.imageUrl
                            ? <img src={conversation.imageUrl} alt={headerName} className="h-10 w-10 rounded-full object-cover" style={{ border: "1px solid #333" }} />
                            : <GroupDefaultAvatar size={40} />
                    ) : headerAvatar
                        ? <img src={headerAvatar} alt={headerName} className="h-10 w-10 rounded-full object-cover" style={{ border: "1px solid #333" }} />
                        : <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold" style={{ background: "var(--bg-border)", color: "var(--text-primary)", border: "1px solid #333" }}>
                            {headerName[0]?.toUpperCase()}
                        </div>
                    }
                    {otherOnline && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2" style={{ background: "var(--text-primary)", borderColor: "var(--bg-base)" }} />}
                </div>

                <div className="flex-1 min-w-0">
                    <h2
                        className="text-base font-semibold truncate"
                        style={{ color: "var(--text-primary)" , fontSize: "15px"}}
                    >
                        {headerName}
                    </h2>

                    {isTypingNow ? (
                        <div className="flex items-center -mt-0.5 gap-2">
                            <div className="flex items-center gap-1">
                                {[0, 1, 2].map(i => (
                                    <span
                                        key={i}
                                        className="typing-dot inline-block h-1 w-1 rounded-full"
                                        style={{ background: "var(--text-primary)" }}
                                    />
                                ))}
                            </div>

                            <span
                                className="text-sm"
                                style={{
                                    letterSpacing: "0.4px",
                                    color: "var(--text-muted)"
                                }}
                            >
                                {isGroup && typingUsers?.[0]
                                    ? `${typingUsers[0].userName} typing`
                                    : "typing"}
                            </span>
                        </div>
                    ) : (
                        <p
                            className="text-sm"
                            style={{
                                WebkitTextStroke: "0.25px rgba(255,255,255,0.15)",
                                letterSpacing: "0.4px",
                                color: "var(--text-muted)",
                                fontSize: "13px"
                            }}
                        >
                            {isGroup
                                ? `${conversation?.participantIds.length} members`
                                : otherOnline
                                    ? "Active now"
                                    : formatLastSeen(otherLastSeen)}
                        </p>
                    )}
                </div>
                     {isGroup && 
                <button
                    onClick={() => { if (isGroup) setShowGroupInfo(true); }}
                    className="rounded-lg p-1.5 transition-colors"
                    style={{ color: "var(--text-tertiary)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-muted)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}>
                    <MoreVertical className="h-4 w-4" />
                </button>
                     }
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto pl-4 pr-10 py-4"
                style={{
                    background: "transparent",
                    scrollbarWidth: "thin",
                    scrollbarColor: "#333 transparent",
                    // Hide only when we have messages but haven't snapped to bottom yet
                    opacity: (messages === undefined || messages.length === 0 || messagesVisible) ? 1 : 0,
                    transition: messagesVisible ? "opacity 0.1s ease" : "none",
                }}
            >
                {messages === undefined ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                                <div className="skeleton rounded-2xl" style={{ height: 36, width: 80 + i * 30 }} />
                            </div>
                        ))}
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center" ref={el => { if (el) setMessagesVisible(true); }}>
                        <p className="text-sm" style={{ color: "var(--text-faint)" }}>No messages yet. Say hello!</p>
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {messages.map((msg, i) => {
                            const prev = messages[i - 1];
                            const next = messages[i + 1];
                            const isLastMessage = msg.senderId === currentUserId && i === messages.length - 1;
                            const showDateSep = !prev || isDifferentDay(prev._creationTime, msg._creationTime);
                            // Group boundary: a new sender or a date separator breaks the stack
                            const prevSameSender = prev && prev.senderId === msg.senderId && !isDifferentDay(prev._creationTime, msg._creationTime);
                            const nextSameSender = next && next.senderId === msg.senderId && !isDifferentDay(msg._creationTime, next._creationTime);
                            const isFirstInGroup = !prevSameSender;
                            const isLastInGroup = !nextSameSender;
                            return (
                                <div key={msg._id}>
                                    {showDateSep && <DateSeparator timestamp={msg._creationTime} />}
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
                                        messageRef={(el) => {
                                            if (el) messageRefsMap.current.set(msg._id, el);
                                            else messageRefsMap.current.delete(msg._id);
                                        }}
                                    />
                                </div>
                            );
                        })}
                        {isTypingNow && <TypingIndicator typingUsers={typingUsers!} />}
                    </div>
                )}
            </div>

            {/* Scroll to bottom button — appears when user scrolls up */}
            <div
                className="absolute top-[80vh] right-5 z-10 transition-all duration-200"
                style={{
                    bottom: replyTarget ? 120 : 76,
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
                    style={{ background: "var(--bg-muted)", border: "1px solid #333" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-border)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-muted)")}
                    title="Scroll to latest"
                >
                    <ChevronDown className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
                </button>
            </div>

            {/* Send error */}
            {sendError && (
                <div className="mx-4 mb-2 flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "var(--error-bg)", border: "1px solid #440000" }}>
                    <span className="text-xs" style={{ color: "var(--error-text)" }}>Failed to send</span>
                    <button onClick={handleSend} className="text-xs underline" style={{ color: "var(--error-text)" }}>Retry</button>
                </div>
            )}

            {/* Reply strip */}
            {replyTarget && (
                <div
                    className="mx-4 mb-1 flex items-center gap-3 rounded-full px-3 py-2 z-50"
                    style={{ background: "var(--input-bg)", border: "1px solid #2a2a2a" }}
                >
                    <Reply className="h-4 w-4 flex-shrink-0" style={{ color: "var(--seen-text)" }} />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold" style={{ color: "var(--seen-text)" }}>
                            {replyTarget.senderId === currentUserId ? "You" : replyTarget.sender?.name ?? "Unknown"}
                        </p>
                        <p className="truncate text-xs max-w-[55%]" style={{ color: "var(--text-tertiary)" }}>
                            {replyTarget.isDeleted ? "Message deleted" : replyTarget.content}
                        </p>
                    </div>
                    <button
                        onClick={() => setReplyTarget(null)}
                        className="rounded-full p-1 flex-shrink-0"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Input */}
            <div className="relative px-5 pb-6">

                {/* Emoji picker — pops up above input, WhatsApp style */}
                {showEmojiPicker && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                        <div
                            className="absolute left-4 z-50 overflow-hidden rounded-2xl shadow-2xl"
                            style={{
                                bottom: "calc(100% + 8px)",
                                background: "var(--input-bg)",
                                border: "1px solid #2a2a2a",
                                width: 320,
                                transform: showEmojiPicker ? "scale(1)" : "scale(0.8)",
                                opacity: showEmojiPicker ? 1 : 0,
                                transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1), opacity 0.15s ease",
                                transformOrigin: "bottom left",
                            }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid var(--bg-border)" }}>
                                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Emoji</span>
                                <button onClick={() => setShowEmojiPicker(false)} className="rounded-full p-1" style={{ color: "var(--text-muted)" }}
                                    onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                                    onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            {/* Emoji grid — scrollable, grouped like WhatsApp */}
                            <div style={{ maxHeight: 280, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}>
                                {[
                                    { label: "Smileys", emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕"] },
                                    { label: "Gestures", emojis: ["👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "🤲", "🤝", "🙏", "✍️", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃"] },
                                    { label: "Hearts", emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "✡️", "🔯"] },
                                    { label: "Animals", emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄"] },
                                    { label: "Food", emojis: ["🍎", "🍊", "🍋", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🫑", "🥦", "🥬", "🥒", "🌶️", "🫒", "🧄", "🧅", "🥔", "🍠", "🫘", "🌰", "🥜", "🍞", "🥐", "🥖", "🫓", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🌭", "🍔", "🍟", "🍕"] },
                                    { label: "Activities", emojis: ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🏓", "🏸", "🏒", "🥍", "🏑", "🏏", "🪃", "🥅", "⛳", "🪁", "🎣", "🤿", "🎽", "🎿", "🛷", "🥌", "🎯", "🪀", "🪆", "🎮", "🎰", "🎲", "♟️", "🧩", "🪅"] },
                                    { label: "Travel", emojis: ["🚗", "🚕", "🚙", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🛵", "🏍️", "🚲", "🛴", "🛺", "🚂", "✈️", "🚀", "🛸", "🚁", "⛵", "🚢", "🏖️", "🏝️", "🏔️", "🌋", "🗻", "🏕️", "🌅", "🌄", "🌠", "🎑", "🌇", "🏙️", "🌆", "🌉", "🌌", "🌃"] },
                                    { label: "Objects", emojis: ["📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️", "📺", "📻", "🧭", "⏱️", "⏰", "⌚", "📡", "🔋", "🔌", "💡", "🔦", "🕯️", "🪔", "🧱", "💰", "💳", "💎", "⚖️", "🔑", "🗝️", "🔒", "🔓", "🔨", "🪓", "⛏️", "🔧", "🪛", "🔩", "⚙️", "🗜️", "🔗", "⛓️"] },
                                ].map(group => (
                                    <div key={group.label}>
                                        <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>{group.label}</p>
                                        <div className="grid grid-cols-8 gap-0 px-2 pb-1">
                                            {group.emojis.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => {
                                                        setMessageText(t => t + emoji);
                                                        textareaRef.current?.focus();
                                                    }}
                                                    className="rounded-lg p-1.5 text-xl transition-all hover:scale-125 hover:bg-white/10"
                                                    title={emoji}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Pill input row */}
                <div className="flex items-end gap-3">
                    <div
                        className="flex flex-1 gap-3 rounded-full px-4 py-2"
                        style={{ background: "var(--input-bg)", border: "1px solid #222" }}
                    >
                        {/* Emoji toggle */}
                        <button
                            onClick={() => setShowEmojiPicker(v => !v)}
                            className="mb-0.5 flex-shrink-0 transition-transform"
                            style={{
                                color: showEmojiPicker ? "var(--text-primary)" : "var(--text-muted)",
                                transform: showEmojiPicker ? "rotate(90deg)" : "rotate(0deg)",
                                transition: "transform 0.2s ease, color 0.15s",
                            }}
                        >
                            <Smile className="h-7 w-7" />
                        </button>

                        {/* Textarea */}
                        <textarea
                            ref={textareaRef}
                            value={messageText}
                            onChange={e => {
                                setMessageText(e.target.value);
                                handleTyping();
                                e.target.style.height = "auto";
                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder={replyTarget ? "Reply…" : "Message..."}
                            rows={1}
                            className="flex-1 resize-none bg-transparent text-sm outline-none mt-1"
                            style={{ color: "var(--text-primary)", maxHeight: 120, lineHeight: "1.5", scrollbarWidth: "none", paddingTop: 2, paddingBottom: 2 }}
                        />
                        {/* Send button */}
                        <button
                            onClick={handleSend}
                            disabled={!messageText.trim() || isSending}
                            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-all disabled:opacity-40"
                            style={{ background: "transparent" }}
                        >
                            {isSending
                                ? <div className="h-4 w-4 animate-spin rounded-full border-2" style={{ borderColor: "var(--text-primary)", borderTopColor: "transparent" }} />
                                : <Send strokeWidth={2.5} className="h-5 w-5" style={{ color: messageText.trim() ? "var(--text-primary)" : "var(--text-faint)" }} />}
                        </button>
                    </div>
                </div>
            </div>
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