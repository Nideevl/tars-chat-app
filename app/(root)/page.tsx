"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState, useRef, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import { ProfileSetupModal } from "@/components/ProfileSetupModal";
import { useRouter } from "next/navigation";

const MIN_WIDTH = 320;
const MAX_WIDTH = 720;
const DEFAULT_WIDTH = 450;
const MOBILE_BREAKPOINT = 768; // md

export default function HomePage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  // Mobile: which panel is showing. Desktop: both always visible.
  const [mobileView, setMobileView] = useState<"sidebar" | "chat">("sidebar");
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);

  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  const setOnlineStatus = useMutation(api.presence.setOnlineStatus);
  const upsertUser = useMutation(api.users.upsertUser);

  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const showProfileSetup =
    !!user && convexUser !== undefined && convexUser !== null && !convexUser.profileComplete;

  // Track mobile breakpoint
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { if (isLoaded && !isSignedIn) router.push("/sign-in"); }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!user) return;
    upsertUser({
      clerkId: user.id,
      name: user.fullName ?? user.username ?? "Anonymous",
      email: user.emailAddresses[0]?.emailAddress ?? "",
      imageUrl: user.imageUrl ?? "",
    });
  }, [user, upsertUser]);

  useEffect(() => {
    if (!user) return;
    setOnlineStatus({ clerkId: user.id, isOnline: true });
    const vis = () => setOnlineStatus({ clerkId: user.id, isOnline: !document.hidden });
    const bye = () => setOnlineStatus({ clerkId: user.id, isOnline: false });
    document.addEventListener("visibilitychange", vis);
    window.addEventListener("beforeunload", bye);
    return () => {
      setOnlineStatus({ clerkId: user.id, isOnline: false });
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("beforeunload", bye);
    };
  }, [user, setOnlineStatus]);

  // Desktop drag-to-resize
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [sidebarWidth]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = e.clientX - startX.current;
      setSidebarWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta)));
    };
    const onMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, []);

  const handleSelectConversation = (id: Id<"conversations">) => {
    setSelectedConversationId(id);
    setMobileView("chat");
  };

  const handleBack = () => {
    setMobileView("sidebar");
    // On mobile we don't clear the ID so desktop stays consistent if resized
    if (isMobile) setSelectedConversationId(null);
  };

  if (!isLoaded || !user) {
    return (
      <div className="flex h-full items-center justify-center" style={{ background: "#000" }}>
        <div className="flex flex-col items-center gap-4">
          <img
            src="https://cdn.prod.website-files.com/67568f82f8a560d2dee8bc78/6836b99c0a02d1f0afd10d64_TARSLogo.png"
            alt="TARS" className="h-8 w-auto" style={{ filter: "brightness(0) invert(1)" }}
          />
          <div className="h-0.5 w-24 overflow-hidden rounded-full" style={{ background: "#1a1a1a" }}>
            <div className="h-full w-1/2 animate-pulse rounded-full" style={{ background: "#fff" }} />
          </div>
        </div>
      </div>
    );
  }

  // ── Visibility logic ──────────────────────────────────────────────────────
  // Mobile: show only one panel at a time
  // Desktop: always show both
  const showSidebarPanel = isMobile ? mobileView === "sidebar" : true;
  const showChatPanel    = isMobile ? mobileView === "chat"    : true;

  return (
    <>
      {showProfileSetup && (
        <ProfileSetupModal
          clerkId={user.id}
          defaultName={user.fullName ?? user.username ?? ""}
          defaultImageUrl={user.imageUrl ?? ""}
          onComplete={() => {}}
        />
      )}

      <div className="flex h-full overflow-hidden" style={{ background: "#000" }}>

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        {showSidebarPanel && (
          <div
            className="relative flex-shrink-0 h-full"
            // Mobile: full viewport width. Desktop: draggable pixel width.
            style={{ width: isMobile ? "100%" : sidebarWidth }}
          >
            <Sidebar
              currentUser={user}
              selectedConversationId={selectedConversationId}
              onSelectConversation={handleSelectConversation}
            />

            {/* Drag handle — desktop only */}
            {!isMobile && (
              <div
                onMouseDown={onMouseDown}
                className="absolute right-0 top-0 h-full w-1 cursor-col-resize z-10 transition-colors"
                style={{ background: "transparent" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#333")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                title="Drag to resize"
              />
            )}
          </div>
        )}

        {/* ── Chat area ─────────────────────────────────────────────────────── */}
        {showChatPanel && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {selectedConversationId ? (
              <ChatArea
                conversationId={selectedConversationId}
                currentUserId={user.id}
                currentUserName={convexUser?.username ?? user.fullName ?? user.username ?? "You"}
                onBack={handleBack}
              />
            ) : (
              // Empty state — only ever visible on desktop (mobile is always on sidebar when no chat)
              <div className="flex h-full flex-col items-center justify-center gap-4" style={{ background: "#000" }}>
                <img
                  src="https://cdn.prod.website-files.com/67568f82f8a560d2dee8bc78/6836b99c0a02d1f0afd10d64_TARSLogo.png"
                  alt="TARS" className="h-10 w-auto opacity-20"
                  style={{ filter: "brightness(0) invert(1)" }}
                />
                <p className="text-sm" style={{ color: "#333" }}>Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}