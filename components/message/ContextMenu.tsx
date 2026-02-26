"use client";

import { useState } from "react";
import { Reply, Trash2, X, Copy } from "lucide-react";

const REACTION_EMOJIS = ["\ud83d\udc4d", "\u2764\ufe0f", "\ud83d\ude02", "\ud83d\ude2e", "\ud83d\ude22"];

interface ContextMenuProps {
    isMe: boolean;
    onReply: () => void;
    onCopy: () => void;
    onReact: (emoji: string) => void;
    onDeleteForMe: () => void;
    onDeleteForEveryone?: () => void;
    onClose: () => void;
    positionAbove: boolean;
    alignRight: boolean;
}

export function ContextMenu({
    isMe,
    onReply,
    onCopy,
    onReact,
    onDeleteForMe,
    onDeleteForEveryone,
    onClose,
    positionAbove,
    alignRight,
}: ContextMenuProps) {
    const [showDeleteSub, setShowDeleteSub] = useState(false);

    const menuItem = (icon: React.ReactNode, label: string, onClick: () => void, danger = false) => (
        <button
            onClick={onClick}
            className="cursor-pointer flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
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
                        <button key={emoji} onClick={() => { onReact(emoji); onClose(); }}
                            className="cursor-pointer rounded-full p-1.5 text-xl transition-all hover:scale-125" title={emoji}>
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
                            <p className="px-4 py-2 text-xs" style={{ color: "rgba(168,85,247,0.5)" }}>Delete for\u2026</p>
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