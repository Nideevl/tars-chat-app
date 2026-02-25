"use client";

import { useRef, useState } from "react";
import { Send, Smile, X, Reply } from "lucide-react";
import { EmojiPicker } from "./EmojiPicker";
import { Id } from "@/convex/_generated/dataModel";

interface ReplyTarget {
    _id: Id<"messages">;
    content: string;
    isDeleted: boolean;
    senderId: string;
    sender?: { name: string } | null;
}

interface MessageInputProps {
    currentUserId: string;
    replyTarget: ReplyTarget | null;
    isSending: boolean;
    onSend: (text: string) => void;
    onTyping: () => void;
    onClearReply: () => void;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function MessageInput({
    currentUserId,
    replyTarget,
    isSending,
    onSend,
    onTyping,
    onClearReply,
    textareaRef,
}: MessageInputProps) {
    const [messageText, setMessageText] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
        if (e.key === "Escape") onClearReply();
    };

    const submit = () => {
        const content = messageText.trim();
        if (!content || isSending) return;
        setMessageText("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        onSend(content);
    };

    return (
        <div className="relative px-5 pb-6">

            {/* Emoji picker panel */}
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
                            transform: "scale(1)",
                            opacity: 1,
                            transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1), opacity 0.15s ease",
                            transformOrigin: "bottom left",
                        }}
                    >
                        <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid var(--bg-border)" }}>
                            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Emoji</span>
                            <button
                                onClick={() => setShowEmojiPicker(false)}
                                className="rounded-full p-1"
                                style={{ color: "var(--text-muted)" }}
                                onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <EmojiPicker
                            onSelectEmoji={(emoji) => {
                                setMessageText(t => t + emoji);
                                textareaRef.current?.focus();
                            }}
                        />
                    </div>
                </>
            )}

            {/* Reply strip */}
            {replyTarget && (
                <div
                    className="mb-1 flex items-center gap-3 rounded-full px-3 py-2 z-50"
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
                        onClick={onClearReply}
                        className="rounded-full p-1 flex-shrink-0"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
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
                        className="mb-0.5 flex-shrink-0"
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
                            onTyping();
                            e.target.style.height = "auto";
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={replyTarget ? "Reply…" : "Message..."}
                        rows={1}
                        className="flex-1 resize-none bg-transparent text-sm outline-none mt-1"
                        style={{
                            color: "var(--text-primary)",
                            maxHeight: 120,
                            lineHeight: "1.5",
                            scrollbarWidth: "none",
                            paddingTop: 2,
                            paddingBottom: 2,
                        }}
                    />

                    {/* Send button */}
                    <button
                        onClick={submit}
                        disabled={!messageText.trim() || isSending}
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-all disabled:opacity-40"
                        style={{ background: "transparent" }}
                    >
                        {isSending
                            ? <div className="h-4 w-4 animate-spin rounded-full border-2" style={{ borderColor: "var(--text-primary)", borderTopColor: "transparent" }} />
                            : <Send strokeWidth={2.5} className="h-5 w-5" style={{ color: messageText.trim() ? "var(--text-primary)" : "var(--text-faint)" }} />
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}