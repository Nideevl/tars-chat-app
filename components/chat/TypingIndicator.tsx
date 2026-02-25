"use client";

export function TypingIndicator({ typingUsers }: { typingUsers: { userName: string }[] }) {
  if (!typingUsers.length) return null;
  return (
    <div className="flex justify-start mt-2">
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm px-4 py-3 ml-9" style={{
        background: "rgba(255,255,255,0.12)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        padding: "12px 14px 10px",
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} className="typing-dot inline-block h-2 w-2 rounded-full" style={{ background: "var(--text-tertiary)" }} />
        ))}
      </div>
    </div>
  );
}