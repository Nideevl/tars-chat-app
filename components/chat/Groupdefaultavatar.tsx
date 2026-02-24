// Shared component — default avatar shown when a group has no custom image
export function GroupDefaultAvatar({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: "50%", flexShrink: 0, border: "1.5px solid #333"  }}
    >
      {/* Blue circle background */}
      <circle cx="20" cy="20" r="20" fill="#2196F3" />

      {/* Left person (smaller, behind) */}
      <circle cx="13.5" cy="14.5" r="4" fill="white" opacity="0.85" />
      <path
        d="M5 30c0-4.5 3.8-8 8.5-8s8.5 3.5 8.5 8"
        fill="white"
        opacity="0.85"
      />

      {/* Right person (center-front, slightly larger) */}
      <circle cx="24" cy="13" r="4.5" fill="white" />
      <path
        d="M15 30c0-5 4-9 9-9s9 4 9 9"
        fill="white"
      />
    </svg>
  );
}