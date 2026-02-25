"use client";

const PURPLE_SHIMMER = `
@keyframes purple-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
}
@keyframes glass-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
}
.skel-me {
  background: linear-gradient(
    90deg,
    rgba(76,29,149,0.55) 0%,
    rgba(124,58,237,0.75) 40%,
    rgba(109,51,170,0.65) 60%,
    rgba(76,29,149,0.55) 100%
  );
  background-size: 400px 100%;
  animation: purple-shimmer 1.6s ease-in-out infinite;
}
.skel-other {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.06) 0%,
    rgba(255,255,255,0.13) 40%,
    rgba(255,255,255,0.08) 60%,
    rgba(255,255,255,0.06) 100%
  );
  background-size: 400px 100%;
  animation: glass-shimmer 1.6s ease-in-out infinite;
}
.skel-avatar {
  background: linear-gradient(
    90deg,
    rgba(168,85,247,0.08) 0%,
    rgba(168,85,247,0.18) 50%,
    rgba(168,85,247,0.08) 100%
  );
  background-size: 400px 100%;
  animation: glass-shimmer 1.6s ease-in-out infinite;
}
.skel-date {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.04) 0%,
    rgba(255,255,255,0.09) 50%,
    rgba(255,255,255,0.04) 100%
  );
  background-size: 400px 100%;
  animation: glass-shimmer 2s ease-in-out infinite;
}
`;

// A single "me" bubble (right side, purple)
function MeBubble({
  width,
  tall = false,
  first = false,
  last = false,
  delay = 0,
}: {
  width: number;
  tall?: boolean;
  first?: boolean;
  last?: boolean;
  delay?: number;
}) {
  const R = 18;
  const F = 5;
  let br: string;
  if (first && last) br = `${R}px ${R}px ${R}px ${R}px`;
  else if (first)    br = `${R}px ${R}px ${F}px ${R}px`;
  else if (last)     br = `${R}px ${F}px ${R}px ${R}px`;
  else               br = `${R}px ${F}px ${F}px ${R}px`;

  return (
    <div className="flex justify-end">
      <div
        className="skel-me relative overflow-hidden"
        style={{
          width,
          height: tall ? 60 : 36,
          borderRadius: br,
          animationDelay: `${delay}ms`,
          boxShadow: "0 2px 20px rgba(100,40,210,0.25)",
        }}
      >
        {/* Timestamp ghost */}
        <div
          className="absolute bottom-2 right-3 rounded-sm opacity-30"
          style={{ width: 28, height: 7, background: "rgba(200,180,255,0.4)" }}
        />
      </div>
    </div>
  );
}

// A single "other" bubble (left side, glass) with avatar
function OtherBubble({
  width,
  tall = false,
  showAvatar = false,
  first = false,
  last = false,
  delay = 0,
}: {
  width: number;
  tall?: boolean;
  showAvatar?: boolean;
  first?: boolean;
  last?: boolean;
  delay?: number;
}) {
  const R = 18;
  const F = 5;
  let br: string;
  if (first && last) br = `${R}px ${R}px ${R}px ${R}px`;
  else if (first)    br = `${R}px ${R}px ${R}px ${F}px`;
  else if (last)     br = `${F}px ${R}px ${R}px ${R}px`;
  else               br = `${F}px ${R}px ${R}px ${F}px`;

  return (
    <div className="flex justify-start items-end gap-2">
      {/* Avatar slot — always takes space, only visible when showAvatar */}
      <div className="flex-shrink-0 w-6 h-6 mb-0.5">
        {showAvatar && (
          <div
            className="skel-avatar w-6 h-6 rounded-full"
            style={{ animationDelay: `${delay}ms` }}
          />
        )}
      </div>

      <div
        className="skel-other relative overflow-hidden"
        style={{
          width,
          height: tall ? 60 : 36,
          borderRadius: br,
          backdropFilter: "blur(12px)",
          animationDelay: `${delay}ms`,
        }}
      >
        {/* Timestamp ghost */}
        <div
          className="absolute bottom-2 right-3 rounded-sm opacity-20"
          style={{ width: 28, height: 7, background: "rgba(255,255,255,0.3)" }}
        />
      </div>
    </div>
  );
}

// Date separator pill
function DateSeparatorSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div className="flex justify-center my-4">
      <div
        className="skel-date rounded-full"
        style={{ width: 80, height: 20, animationDelay: `${delay}ms` }}
      />
    </div>
  );
}

// The full skeleton — mimics a realistic conversation layout
export function ChatSkeleton() {
  return (
    <>
      <style>{PURPLE_SHIMMER}</style>

      <div className="flex flex-col gap-0.5 px-2 py-2">

        {/* ── Older messages above a date separator ── */}
        <OtherBubble width={120} showAvatar first last delay={0} />
        <div className="mt-0.5" />
        <MeBubble width={160} first last delay={80} />

        <DateSeparatorSkeleton delay={120} />

        {/* ── A stacked group from "other" ── */}
        <OtherBubble width={200} showAvatar first delay={160} />
        <OtherBubble width={140} delay={200} />
        <OtherBubble width={180} tall last delay={240} />

        <div className="mt-1" />

        {/* ── A stacked group from "me" ── */}
        <MeBubble width={100} first delay={280} />
        <MeBubble width={220} tall delay={320} />
        <MeBubble width={150} last delay={360} />

        <div className="mt-1" />

        {/* ── Solo messages ── */}
        <OtherBubble width={170} showAvatar first last delay={400} />
        <div className="mt-0.5" />
        <MeBubble width={130} first last delay={440} />
        <div className="mt-0.5" />
        <OtherBubble width={90} showAvatar first last delay={480} />

        <div className="mt-1" />

        {/* ── Final me group at bottom ── */}
        <MeBubble width={180} first delay={520} />
        <MeBubble width={110} last delay={560} />

      </div>
    </>
  );
}