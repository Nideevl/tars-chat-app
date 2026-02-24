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
const DEFAULT_WIDTH = 420;

export default function HomePage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  const setOnlineStatus = useMutation(api.presence.setOnlineStatus);
  const upsertUser = useMutation(api.users.upsertUser);

  // Fetch the Convex user record to check profileComplete
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  // Show modal when: user is loaded, upserted (convexUser exists), and profileComplete is falsy
  const showProfileSetup =
    !!user &&
    convexUser !== undefined &&
    convexUser !== null &&
    !convexUser.profileComplete;

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
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setSidebarWidth(newWidth);
    };
    const onMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  if (!isLoaded || !user) {
    return (
      <div className="flex h-full items-center justify-center" style={{ background: "#000" }}>
        <div className="flex flex-col items-center gap-4">
          <img
            src="https://cdn.prod.website-files.com/67568f82f8a560d2dee8bc78/6836b99c0a02d1f0afd10d64_TARSLogo.png"
            alt="TARS"
            className="h-8 w-auto"
            style={{ filter: "brightness(0) invert(1)" }}
          />
          <div className="h-0.5 w-24 overflow-hidden rounded-full" style={{ background: "#1a1a1a" }}>
            <div className="h-full w-1/2 animate-pulse rounded-full" style={{ background: "#fff" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Profile setup modal — blocks interaction until dismissed */}
      {showProfileSetup && (
        <ProfileSetupModal
          clerkId={user.id}
          defaultName={user.fullName ?? user.username ?? ""}
          defaultImageUrl={user.imageUrl ?? ""}
          onComplete={() => {
            // convexUser will reactively update via the query
            // modal disappears automatically when profileComplete becomes true
          }}
        />
      )}

      <div className="flex h-full overflow-hidden" style={{ background: "#000" }}>
        {/* Sidebar */}
        <div
          className={`${showSidebar ? "flex" : "hidden"} md:flex flex-shrink-0 relative`}
          style={{ width: sidebarWidth }}
        >
          <Sidebar
            currentUser={user}
            selectedConversationId={selectedConversationId}
            onSelectConversation={(id) => { setSelectedConversationId(id); setShowSidebar(false); }}
          />

          {/* Drag handle */}
          <div
            onMouseDown={onMouseDown}
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize z-10 transition-colors"
            style={{ background: "transparent" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#333")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            title="Drag to resize"
          />
        </div>

        {/* Chat area */}
        <div className={`${!showSidebar ? "flex" : "hidden"} md:flex flex-1 flex-col overflow-hidden`}>
          {selectedConversationId ? (
            <ChatArea
              conversationId={selectedConversationId}
              currentUserId={user.id}
              currentUserName={convexUser?.username ?? user.fullName ?? user.username ?? "You"}
              onBack={() => { setShowSidebar(true); setSelectedConversationId(null); }}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4" style={{ background: "#000" }}>
              <img
                src="https://cdn.prod.website-files.com/67568f82f8a560d2dee8bc78/6836b99c0a02d1f0afd10d64_TARSLogo.png"
                alt="TARS"
                className="h-10 w-auto opacity-20"
                style={{ filter: "brightness(0) invert(1)" }}
              />
              <p className="text-sm" style={{ color: "#333" }}>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}