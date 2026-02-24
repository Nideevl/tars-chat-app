import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

// Clerk webhook to sync users into Convex
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return new Response("Webhook secret not configured", { status: 500 });
    }

    // Verify the webhook signature using svix
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    const payload = await req.text();
    const wh = new Webhook(webhookSecret);

    let event: {
      type: string;
      data: {
        id: string;
        first_name?: string;
        last_name?: string;
        username?: string;
        email_addresses?: Array<{ email_address: string }>;
        image_url?: string;
        profile_image_url?: string;
      };
    };

    try {
      event = wh.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as typeof event;
    } catch {
      return new Response("Invalid webhook signature", { status: 400 });
    }

    // Handle user.created and user.updated events
    if (event.type === "user.created" || event.type === "user.updated") {
      const { id, first_name, last_name, username, email_addresses, image_url, profile_image_url } =
        event.data;

      const name =
        [first_name, last_name].filter(Boolean).join(" ").trim() ||
        username ||
        "Anonymous";

      const email = email_addresses?.[0]?.email_address ?? "";
      const imageUrl = image_url ?? profile_image_url ?? "";

      await ctx.runMutation(api.users.upsertUser, {
        clerkId: id,
        name,
        email,
        imageUrl,
      });
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;