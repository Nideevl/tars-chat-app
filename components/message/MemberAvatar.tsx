import { Doc } from "@/convex/_generated/dataModel";

export function MemberAvatar({ sender }: { sender?: Doc<"users"> | null }) {
    if (sender?.imageUrl) {
        return (
            <img
                src={sender.imageUrl}
                alt=""
                className="h-6 w-6 rounded-full object-cover"
                style={{ border: "1px solid #333" }}
            />
        );
    }
    return (
        <div
            className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
            style={{ background: "rgba(168,85,247,0.15)", color: "#f0eeff", border: "1px solid rgba(168,85,247,0.25)" }}
        >
            {sender?.name?.[0]?.toUpperCase()}
        </div>
    );
}