"use client";

import { useQuery } from "convex/react";
import { GroupDefaultAvatar } from "../chat/Groupdefaultavatar";
import { api } from "@/convex/_generated/api";
import { formatMessageTime } from "@/lib/formatDate";
import { Doc } from "@/convex/_generated/dataModel";

interface ConversationItemProps {
  conversation: Doc<"conversations"> & {
    lastMessage: Doc<"messages"> | null;
    otherParticipants: Doc<"users">[];
    unreadCount: number;
  };
  currentUserId: string;
  isSelected: boolean;
  onSelect: () => void;
}

export function ConversationItem({ conversation, currentUserId, isSelected, onSelect }: ConversationItemProps) {
  const isGroup = conversation.isGroup;
  const otherUser = conversation.otherParticipants[0];
  const displayName = isGroup ? conversation.name ?? "Group" : otherUser?.name ?? "Unknown";
  const avatarUrl = isGroup ? null : otherUser?.imageUrl;
  const isOnline = !isGroup && otherUser?.isOnline;

  const typingUsers = useQuery(api.typing.getTypingUsers, { conversationId: conversation._id, currentUserId });
  const isTyping = typingUsers && typingUsers.length > 0;

  let preview = "No messages yet";
  let isDeleted = false;
  if (conversation.lastMessage) {
    if (conversation.lastMessage.isDeleted) { preview = "Message deleted"; isDeleted = true; }
    else {
      const isMe = conversation.lastMessage.senderId === currentUserId;
      if (isGroup && !isMe) {
        const sender = conversation.otherParticipants.find(
          p => p.clerkId === conversation.lastMessage!.senderId
        );
        const senderName = sender?.name?.split(" ")[0] ?? "Someone";
        preview = `${senderName}: ${conversation.lastMessage.content}`;
      } else {
        preview = `${isMe ? "You: " : ""}${conversation.lastMessage.content}`;
      }
    }
  }

  return (
    <button
      onClick={onSelect}
      className="flex w-full items-center gap-3.5 rounded-lg px-3.5 py-3.5 text-left transition-colors"
      style={{ background: isSelected ? "var(--bg-muted)" : "transparent" }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "var(--bg-subtle)"; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {isGroup ? (
          conversation.imageUrl
            ? <img src={conversation.imageUrl} alt={displayName} className="h-11 w-11 rounded-full object-cover" style={{ border: "1px solid #333" }} />
            : <GroupDefaultAvatar size={44} />
        ) : avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="h-11 w-11 rounded-full object-cover" style={{ border: "2px solid #333" }} />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold"
            style={{ background: "var(--bg-border)", color: "var(--text-primary)", border: "1px solid #333" }}>
            {displayName[0]?.toUpperCase()}
          </div>
        )}
        {isOnline && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2"
            style={{ background: "var(--text-primary)", borderColor: "var(--bg-base)" }} />
        )}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium"
            style={{ color: "var(--text-primary)" }}>
            {displayName}
          </span>
          <span className="flex-shrink-0 text-xs"
            style={{
              letterSpacing: "0.4px",
              WebkitTextStroke: "0.2px rgba(255,255,255,0.2)",
              color: conversation.unreadCount > 0 ? "var(--text-primary)" : "var(--text-muted)"
            }}>
            {formatMessageTime(conversation.lastMessageTime)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          {isTyping ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[0,1,2].map(i => (
                  <span key={i}
                    className="typing-dot inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--text-primary)" }} />
                ))}
              </div>
              <span className="text-xs"
                style={{ color: "var(--text-secondary)" }}>
                {isGroup && typingUsers?.[0] ? `${typingUsers[0].userName} typing` : "typing"}
              </span>
            </div>
          ) : (
            <p className="truncate text-xs"
              style={{
                WebkitTextStroke: "0.25px rgba(255,255,255,0.2)",
                letterSpacing: "0.4px",
                color: isDeleted
                  ? "var(--text-faint)"
                  : conversation.unreadCount > 0
                    ? "rgba(255,255,255,0.9)"
                    : "var(--text-muted)",
                fontStyle: isDeleted ? "italic" : "normal"
              }}>
              {preview}
            </p>
          )}

          {conversation.unreadCount > 0 && !isTyping && (
            <span
              className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold"
              style={{ background: "var(--text-primary)", color: "var(--bg-base)" }}
            >
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}