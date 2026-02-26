"use client";

import { Id } from "@/convex/_generated/dataModel";

interface ReplySnippet {
    _id: Id<"messages">;
    content: string;
    isDeleted: boolean;
    senderId: string;
    sender?: { name: string } | null;
}

export function ReplyHeader({
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
            <span className="text-xs mb-1 px-1 mt-3" style={{ color: "rgba(245,245,245,0.7)" }}>
                Replied to {name}
            </span>
            <button
                onClick={() => onJump(replyTo._id)}
                className="cursor-pointer flex flex-col rounded-xl px-3 py-2 text-left transition-opacity hover:opacity-75 max-w-full"
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
                    {text.length > 80 ? text.slice(0, 80) + "\u2026" : text}
                </span>
            </button>
        </div>
    );
}