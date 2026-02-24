import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Send a message (with optional reply)
export const sendMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        senderId: v.string(),
        content: v.string(),
        replyToId: v.optional(v.id("messages")),
    },
    handler: async (ctx, args) => {
        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: args.senderId,
            content: args.content,
            isDeleted: false,
            deletedFor: [],
            replyToId: args.replyToId,
            reactions: [],
        });

        await ctx.db.patch(args.conversationId, {
            lastMessageId: messageId,
            lastMessageTime: Date.now(),
        });

        return messageId;
    },
});

// Get all messages in a conversation (filtered for the requesting user)
export const getMessages = query({
    args: {
        conversationId: v.id("conversations"),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .order("asc")
            .collect();

        const users = await ctx.db.query("users").collect();

        // Filter out messages deleted for this user only
        const visible = messages.filter(
            (m) => !(m.deletedFor ?? []).includes(args.userId)
        );

        return visible.map((msg) => {
            const sender = users.find((u) => u.clerkId === msg.senderId);
            const replyTo = msg.replyToId
                ? messages.find((m) => m._id === msg.replyToId) ?? null
                : null;
            const replyToSender = replyTo
                ? users.find((u) => u.clerkId === replyTo.senderId)
                : null;
            return {
                ...msg,
                sender,
                replyTo: replyTo ? { ...replyTo, sender: replyToSender } : null,
            };
        });
    },
});

// Delete for everyone (sender only — shows "Message deleted" for all)
export const deleteForEveryone = mutation({
    args: {
        messageId: v.id("messages"),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");
        if (message.senderId !== args.userId)
            throw new Error("Cannot delete another user's message for everyone");
        await ctx.db.patch(args.messageId, { isDeleted: true, content: "" });
    },
});

// Delete for me only (hides from this user, others still see it)
export const deleteForMe = mutation({
    args: {
        messageId: v.id("messages"),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");
        const current = message.deletedFor ?? [];
        if (!current.includes(args.userId)) {
            await ctx.db.patch(args.messageId, {
                deletedFor: [...current, args.userId],
            });
        }
    },
});

// Toggle a reaction on a message
export const toggleReaction = mutation({
    args: {
        messageId: v.id("messages"),
        userId: v.string(),
        emoji: v.string(),
    },
    handler: async (ctx, { messageId, userId, emoji }) => {
        const message = await ctx.db.get(messageId);
        if (!message) return;

        const reactions = message.reactions ?? [];

        const existing = reactions.find(r => r.emoji === emoji);

        if (!existing) {
            // No reaction for this emoji → create new
            await ctx.db.patch(messageId, {
                reactions: [
                    ...reactions,
                    { emoji, userIds: [userId] }
                ],
            });
            return;
        }

        const alreadyReacted = existing.userIds.includes(userId);

        if (alreadyReacted) {
            // REMOVE user from emoji
            const updatedReactions = reactions
                .map(r =>
                    r.emoji === emoji
                        ? { ...r, userIds: r.userIds.filter(id => id !== userId) }
                        : r
                )
                .filter(r => r.userIds.length > 0); // remove empty emoji entries

            await ctx.db.patch(messageId, {
                reactions: updatedReactions,
            });
        } else {
            // ADD user to emoji
            const updatedReactions = reactions.map(r =>
                r.emoji === emoji
                    ? { ...r, userIds: [...r.userIds, userId] }
                    : r
            );

            await ctx.db.patch(messageId, {
                reactions: updatedReactions,
            });
        }
    },
});