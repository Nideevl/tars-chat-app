    const seenStyle = {
    WebkitTextStroke: "0.1px #a855f7",
    fontSize: 13,
    fontStyle: "italic" as const,
    color: "#a855f7",
    marginRight: "3px",
    textShadow: "0 0 6px rgba(168,85,247,0.6), 0 0 12px rgba(168,85,247,0.35)",
};

const sentStyle = {
    WebkitTextStroke: "0.1px rgba(255,255,255,0.1)",
    fontSize: 13,
    fontStyle: "italic" as const,
    color: "rgba(255,255,255,0.6)",
    marginRight: "3px",
};

export function ReadStatusLabel({ readStatus, isGroup, allGroupSeen, groupSeenBy, allUsers, positionAbove, showSeenDetail, onToggleSeenDetail }: {
    readStatus: "sending" | "sent" | "seen";
    isGroup?: boolean;
    allGroupSeen: boolean;
    groupSeenBy: string[];
    allUsers?: { clerkId: string; name: string; imageUrl?: string }[];
    positionAbove: boolean;
    showSeenDetail: boolean;
    onToggleSeenDetail: () => void;
}) {
    // Simple DM case
    if (!isGroup || readStatus !== "seen") {
        return <span style={readStatus === "seen" ? seenStyle : sentStyle}>{readStatus === "seen" ? "Seen" : "Sent"}</span>;
    }

    // Group seen label
    const names = groupSeenBy.map(id => allUsers?.find(u => u.clerkId === id)?.name ?? "Someone");
    const shown = names.slice(0, 2);
    const rest  = names.length - shown.length;
    const label = `Seen by ${shown.join(", ")}${rest > 0 ? ` & ${rest} other${rest > 1 ? "s" : ""}` : ""}`;

    return (
        <div className="relative">
            {allGroupSeen
                ? <span style={seenStyle}>Seen</span>
                : <button onClick={onToggleSeenDetail} className="cursor-pointer transition-opacity hover:opacity-70" style={{ ...seenStyle, textAlign: "right" }}>{label}</button>
            }

            {showSeenDetail && !allGroupSeen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={onToggleSeenDetail} />
                    <div
                        className="absolute z-50 overflow-hidden rounded-2xl shadow-2xl"
                        style={{
                            background: "#0d0d18",
                            backdropFilter: "blur(16px)",
                            WebkitBackdropFilter: "blur(16px)",
                            border: "1px solid rgba(110,80,200,0.25)",
                            width: 220,
                            ...(positionAbove ? { bottom: "calc(100% + 6px)" } : { top: "calc(100% + 6px)" }),
                            right: 0,
                        }}
                    >
                        <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #1a1a1a" }}>
                            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#555" }}>Seen by {groupSeenBy.length}</p>
                        </div>
                        <div className="overflow-y-auto" style={{ maxHeight: 200, scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}>
                            {groupSeenBy.map(uid => {
                                const u    = allUsers?.find(u => u.clerkId === uid);
                                const name = u?.name ?? "Unknown";
                                return (
                                    <div key={uid} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: "1px solid rgba(110,80,200,0.1)" }}>
                                        {u?.imageUrl
                                            ? <img src={u.imageUrl} alt={name} className="h-7 w-7 flex-shrink-0 rounded-full object-cover" style={{ border: "1px solid #333" }} />
                                            : <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold" style={{ background: "rgba(168,85,247,0.15)", color: "#f0eeff", border: "1px solid rgba(168,85,247,0.25)" }}>{name[0]?.toUpperCase()}</div>
                                        }
                                        <span className="truncate text-sm" style={{ color: "#d4caff" }}>{name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}