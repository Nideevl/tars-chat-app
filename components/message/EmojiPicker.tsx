"use client";

interface EmojiPickerProps {
    onSelectEmoji: (emoji: string) => void;
}

export function EmojiPicker({ onSelectEmoji }: EmojiPickerProps) {
    const EMOJI_GROUPS = [
        { label: "Smileys", emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕"] },
        { label: "Gestures", emojis: ["👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "🤲", "🤝", "🙏", "✍️", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃"] },
        { label: "Hearts", emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "✡️", "🔯"] },
        { label: "Animals", emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄"] },
        { label: "Food", emojis: ["🍎", "🍊", "🍋", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🫑", "🥦", "🥬", "🥒", "🌶️", "🫒", "🧄", "🧅", "🥔", "🍠", "🫘", "🌰", "🥜", "🍞", "🥐", "🥖", "🫓", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🌭", "🍔", "🍟", "🍕"] },
        { label: "Activities", emojis: ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🏓", "🏸", "🏒", "🥍", "🏑", "🏏", "🪃", "🥅", "⛳", "🪁", "🎣", "🤿", "🎽", "🎿", "🛷", "🥌", "🎯", "🪀", "🪆", "🎮", "🎰", "🎲", "♟️", "🧩", "🪅"] },
        { label: "Travel", emojis: ["🚗", "🚕", "🚙", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🛵", "🏍️", "🚲", "🛴", "🛺", "🚂", "✈️", "🚀", "🛸", "🚁", "⛵", "🚢", "🏖️", "🏝️", "🏔️", "🌋", "🗻", "🏕️", "🌅", "🌄", "🌠", "🎑", "🌇", "🏙️", "🌆", "🌉", "🌌", "🌃"] },
        { label: "Objects", emojis: ["📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️", "📺", "📻", "🧭", "⏱️", "⏰", "⌚", "📡", "🔋", "🔌", "💡", "🔦", "🕯️", "🪔", "🧱", "💰", "💳", "💎", "⚖️", "🔑", "🗝️", "🔒", "🔓", "🔨", "🪓", "⛏️", "🔧", "🪛", "🔩", "⚙️", "🗜️", "🔗", "⛓️"] },

    ];

    return (
        <div style={{ maxHeight: 280, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}>
            {EMOJI_GROUPS.map(group => (
                <div key={group.label}>
                    <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                        {group.label}
                    </p>

                    <div className="grid grid-cols-8 gap-0 px-2 pb-1">
                        {group.emojis.map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => onSelectEmoji(emoji)}
                                className="cursor-pointer rounded-lg p-1.5 text-xl transition-all hover:scale-125 hover:bg-white/10"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}