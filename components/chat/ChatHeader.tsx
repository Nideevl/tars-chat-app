"use client";

import { ArrowLeft, MoreVertical } from "lucide-react";
import { GroupDefaultAvatar } from "./Groupdefaultavatar";
import { formatLastSeen } from "@/lib/formatDate";
import { Id } from "@/convex/_generated/dataModel";

interface ChatHeaderProps {
    conversation: any;
    conversationId: Id<"conversations">;
    currentUserId: string;
    isGroup?: boolean;
    headerName: string;
    headerAvatar?: string | null;
    otherOnline?: boolean;
    otherLastSeen?: number;
    typingUsers?: any[];
    isTypingNow?: boolean;
    onBack: () => void;
    onOpenGroupInfo: () => void;
}

export function ChatHeader({
    conversation,
    isGroup,
    headerName,
    headerAvatar,
    otherOnline,
    otherLastSeen,
    typingUsers,
    isTypingNow,
    onBack,
    onOpenGroupInfo,
}: ChatHeaderProps) {
    const isLoading =
        !conversation ||
        (isGroup === false && headerName === "...") ||
        (isGroup === false && headerAvatar === undefined);

    return (
        <div
            className="flex items-center gap-3 px-4 h-15.5"
            style={{
                background: "rgba(0,0,0,0.8)",
                backdropFilter: "blur(120px) saturate(140%)",
                borderBottom: "1px solid var(--bg-border)",
                minHeight: 56,
            }}
        >
            <button
                onClick={onBack}
                className="
    rounded-full p-1.5 md:hidden
    transition-colors duration-150
    hover:bg-white/10
    hover:text-white
  "
                style={{ color: "var(--text-tertiary)" }}
            >
                <ArrowLeft className="h-5 w-5" />
            </button>

            {isLoading ? (
                <>
                    <div className="h-10 w-10 rounded-full bg-zinc-800 animate-pulse" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-32 rounded bg-zinc-800 animate-pulse" />
                        <div className="h-2.5 w-20 rounded bg-zinc-800 animate-pulse" />
                    </div>
                </>
            ) : (
                <>
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        {isGroup ? (
                            conversation?.imageUrl ? (
                                <img
                                    src={conversation.imageUrl}
                                    alt={headerName}
                                    className="h-10 w-10 rounded-full object-cover"
                                    style={{ border: "1px solid #333" }}
                                />
                            ) : (
                                <GroupDefaultAvatar size={40} />
                            )
                        ) : headerAvatar ? (
                            <img
                                src={headerAvatar}
                                alt={headerName}
                                className="h-10 w-10 rounded-full object-cover"
                                style={{ border: "1px solid #333" }}
                            />
                        ) : (
                            <div
                                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
                                style={{
                                    background: "var(--bg-border)",
                                    color: "var(--text-primary)",
                                    border: "1px solid #333",
                                }}
                            >
                                {headerName[0]?.toUpperCase()}
                            </div>
                        )}

                        {otherOnline && (
                            <span
                                className="absolute bottom-0.5 right-0 h-3 w-3 rounded-full border-2"
                                style={{
                                    background: "var(--text-primary)",
                                    borderColor: "var(--bg-base)",
                                }}
                            />
                        )}
                    </div>

                    {/* Name + status */}
                    <div className="flex-1 min-w-0">
                        <h2
                            className="text-base font-semibold truncate"
                            style={{ color: "var(--text-primary)", fontSize: "15px" }}
                        >
                            {headerName}
                        </h2>

                        {!isLoading && isTypingNow ? (
                            <div className="flex items-center -mt-0.5 gap-2">

                                {/* animated dots */}
                                <div className="flex items-center gap-1">
                                    {[0, 1, 2].map(i => (
                                        <span
                                            key={i}
                                            className="typing-dot inline-block h-1 w-1 rounded-full"
                                            style={{ background: "var(--text-primary)" }}
                                        />
                                    ))}
                                </div>

                                {/* typing label */}
                                <span
                                    className="text-sm"
                                    style={{
                                        letterSpacing: "0.4px",
                                        color: "var(--text-muted)",
                                        WebkitTextStroke: "0.4px var(--text-muted)"
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
                                    letterSpacing: "0.4px",
                                    color: "var(--text-muted)",
                                    fontSize: "13px",
                                    WebkitTextStroke: "0.4px var(--text-muted)"
                                }}
                            >
                                {isGroup
                                    ? `${conversation?.participantIds.length} members`
                                    : otherOnline
                                        ? "Active now"
                                        : formatLastSeen(otherLastSeen ?? 0)}
                            </p>
                        )}
                    </div>

                    {isGroup && (
                        <button
                            onClick={onOpenGroupInfo}
                            className="cursor-pointer p-3 rounded-full transition-all duration-150 opacity-60 hover:opacity-100 hover:bg-white/10"
                            style={{ color: "#fff" }}
                        >
                            <MoreVertical className="h-4 w-4" />
                        </button>
                    )}
                </>
            )}
        </div>
    );
}