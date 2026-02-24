import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get or create a DM conversation between two users
export const getOrCreateDMConversation = mutation({
  args: {
    currentUserId: v.string(), // clerkId
    otherUserId: v.string(),   // clerkId
  },
  handler: async (ctx, args) => {
    // Look for existing DM between these two users
    const existing = await ctx.db.query("conversations").collect();
    const dm = existing.find(
      (c) =>
        !c.isGroup &&
        c.participantIds.length === 2 &&
        c.participantIds.includes(args.currentUserId) &&
        c.participantIds.includes(args.otherUserId)
    );

    if (dm) return dm._id;

    // Create new DM
    return await ctx.db.insert("conversations", {
      participantIds: [args.currentUserId, args.otherUserId],
      isGroup: false,
      lastMessageTime: Date.now(),
      createdBy: args.currentUserId,
    });
  },
});

// Create a group conversation
export const createGroupConversation = mutation({
  args: {
    name: v.string(),
    memberIds: v.array(v.string()), // clerkIds including creator
    creatorId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("conversations", {
      participantIds: args.memberIds,
      isGroup: true,
      name: args.name,
      lastMessageTime: Date.now(),
      createdBy: args.creatorId,
    });
  },
});

// Update group info (name, image, bio) — only participants can do this
export const updateGroupInfo = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const convo = await ctx.db.get(args.conversationId);
    if (!convo || !convo.isGroup) throw new Error("Not a group");
    if (!convo.participantIds.includes(args.userId)) throw new Error("Not a member");

    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = args.name.trim();
    if (args.bio !== undefined) patch.bio = args.bio.trim();
    if (args.storageId) {
      const url = await ctx.storage.getUrl(args.storageId);
      if (url) patch.imageUrl = url;
    }
    await ctx.db.patch(args.conversationId, patch);
  },
});

// Get all conversations for a user, sorted by last message time
export const getUserConversations = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const allConversations = await ctx.db
      .query("conversations")
      .withIndex("by_last_message_time")
      .order("desc")
      .collect();

    // Filter to those the user is a participant in
    const userConvos = allConversations.filter((c) =>
      c.participantIds.includes(args.userId)
    );

    // Enrich with last message and unread count
    const enriched = await Promise.all(
      userConvos.map(async (convo) => {
        // Get last message
        const lastMessage = convo.lastMessageId
          ? await ctx.db.get(convo.lastMessageId)
          : null;

        // Get other participants' user info
        const otherParticipantIds = convo.participantIds.filter(
          (id) => id !== args.userId
        );
        const users = await ctx.db.query("users").collect();
        const otherParticipants = users.filter((u) =>
          otherParticipantIds.includes(u.clerkId)
        );

        // Get read receipt to calculate unread count
        const readReceipt = await ctx.db
          .query("readReceipts")
          .withIndex("by_conversation_user", (q) =>
            q.eq("conversationId", convo._id).eq("userId", args.userId)
          )
          .unique();

        const lastReadTime = readReceipt?.lastReadTime ?? 0;

        // Count messages after lastReadTime not sent by current user
        const allMessages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", convo._id)
          )
          .collect();

        const unreadCount = allMessages.filter(
          (m) =>
            m._creationTime > lastReadTime &&
            m.senderId !== args.userId &&
            !m.isDeleted
        ).length;

        return {
          ...convo,
          lastMessage,
          otherParticipants,
          unreadCount,
        };
      })
    );

    return enriched;
  },
});

// Get a single conversation by ID
export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});