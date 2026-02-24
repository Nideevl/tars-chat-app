import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        clerkId: v.string(),
        name: v.string(),
        email: v.string(),
        imageUrl: v.string(),
        isOnline: v.boolean(),
        lastSeen: v.number(),
        username: v.optional(v.string()),
        bio: v.optional(v.string()),
        profileComplete: v.optional(v.boolean()),
    })
        .index("by_clerk_id", ["clerkId"])
        .index("by_email", ["email"]),

    conversations: defineTable({
        participantIds: v.array(v.string()),
        isGroup: v.boolean(),
        name: v.optional(v.string()),
        imageUrl: v.optional(v.string()),  // group avatar
        bio: v.optional(v.string()),        // group description
        lastMessageId: v.optional(v.id("messages")),
        lastMessageTime: v.number(),
        createdBy: v.string(),
    }).index("by_last_message_time", ["lastMessageTime"]),

    messages: defineTable({
        conversationId: v.id("conversations"),
        senderId: v.string(),
        content: v.string(),
        isDeleted: v.boolean(),
        deletedFor: v.optional(v.array(v.string())),
        replyToId: v.optional(v.id("messages")),
        reactions: v.array(
            v.object({
                emoji: v.string(),
                userIds: v.array(v.string()),
            })
        ),
    }).index("by_conversation", ["conversationId"]),

    readReceipts: defineTable({
        conversationId: v.id("conversations"),
        userId: v.string(),
        lastReadTime: v.number(),
    })
        .index("by_conversation_user", ["conversationId", "userId"])
        .index("by_user", ["userId"]),

    typingIndicators: defineTable({
        conversationId: v.id("conversations"),
        userId: v.string(),
        userName: v.string(),
        timestamp: v.number(),
    })
        .index("by_conversation", ["conversationId"])
        .index("by_conversation_user", ["conversationId", "userId"]),
});