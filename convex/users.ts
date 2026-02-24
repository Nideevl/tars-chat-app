import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Upsert a user from Clerk on login
export const upsertUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        // Only update name/imageUrl from Clerk if user hasn't customised their profile
        // Once profileComplete = true, name and imageUrl are owned by the user, not Clerk
        name: existing.profileComplete ? existing.name : args.name,
        email: args.email,
        imageUrl: existing.profileComplete ? existing.imageUrl : args.imageUrl,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      imageUrl: args.imageUrl,
      isOnline: false,
      lastSeen: Date.now(),
      profileComplete: false,
    });
  },
});

// Generate a short-lived upload URL for Convex file storage
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Update user profile (username, bio, avatar) and mark profileComplete
export const updateProfile = mutation({
  args: {
    clerkId: v.string(),
    username: v.string(),
    bio: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")), // if they uploaded a new avatar
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const patch: Record<string, unknown> = {
      username: args.username.trim(),
      bio: args.bio?.trim() ?? "",
      profileComplete: true,
      name: args.username.trim(), // keep name in sync with username
    };

    if (args.storageId) {
      const url = await ctx.storage.getUrl(args.storageId);
      if (url) patch.imageUrl = url;
    }

    await ctx.db.patch(user._id, patch);
  },
});

// Skip profile setup — marks complete without changing anything
export const skipProfileSetup = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (user) await ctx.db.patch(user._id, { profileComplete: true });
  },
});

// Get all users except current user
export const getAllUsers = query({
  args: { currentClerkId: v.string(), search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let users = await ctx.db.query("users").collect();
    users = users.filter((u) => u.clerkId !== args.currentClerkId);
    if (args.search && args.search.trim()) {
      const lower = args.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(lower) ||
          (u.username ?? "").toLowerCase().includes(lower)
      );
    }
    return users;
  },
});

// Get a single user by clerkId
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

// Get multiple users by their clerkIds
export const getUsersByClerkIds = query({
  args: { clerkIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    return users.filter((u) => args.clerkIds.includes(u.clerkId));
  },
});