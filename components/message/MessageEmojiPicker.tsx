const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

export function MessageEmojiPicker({ isMe, positionAbove, myReaction, onSelect, onClose }: {
    isMe: boolean;
    positionAbove: boolean;
    myReaction: string | null;
    onSelect: (emoji: string) => void;
    onClose: () => void;
}) {
    return (
        <>
            <div className="fixed inset-0 z-0" onClick={onClose} />
            <div
                className={`absolute ${isMe ? "right-0" : "left-0"} z-30 flex gap-1.5 rounded-full px-2 py-1.5 shadow-2xl backdrop-blur-md`}
                style={{
                    background: "rgba(26,26,26,0.95)",
                    border: "1px solid #2a2a2a",
                    ...(positionAbove ? { bottom: "calc(100% + 8px)" } : { top: "calc(100% + 8px)" }),
                }}
            >
                {REACTION_EMOJIS.map((emoji, i) => {
                    const active = myReaction === emoji;
                    return (
                        <button
                            key={emoji}
                            onClick={() => onSelect(emoji)}
                            className="cursor-pointer relative rounded-full p-2 text-xl transition-all duration-200 ease-out hover:scale-125 hover:-translate-y-1 active:scale-110"
                            style={{
                                background: active ? "rgba(168,85,247,0.25)" : "transparent",
                                outline: active ? "2px solid #a855f7" : "none",
                                outlineOffset: 2,
                                animation: `emoji-wave 350ms cubic-bezier(.34,1.56,.64,1)`,
                                animationDelay: `${i * 70}ms`,
                                animationFillMode: "both",
                            }}
                        >
                            {emoji}
                        </button>
                    );
                })}
            </div>
        </>
    );
}