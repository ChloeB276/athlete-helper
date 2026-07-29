import type Stripe from "stripe";
import { env } from "~/env";
import { stripe } from "~/lib/stripe";
import { createAdminClient } from "~/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription" || !session.subscription) break;
        await syncSubscription(
          admin,
          session.customer as string,
          session.subscription as string,
        );
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(
          admin,
          subscription.customer as string,
          subscription.id,
        );
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Webhook handling failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}

/**
 * Re-fetches the canonical subscription from Stripe rather than trusting
 * the event payload directly, so out-of-order webhook delivery (Stripe
 * does not guarantee ordering) can't stomp newer state with stale data.
 */
async function syncSubscription(
  admin: AdminClient,
  customerId: string,
  subscriptionId: string,
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId =
    subscription.metadata.supabase_user_id ??
    (await lookupUserIdByCustomer(admin, customerId));
  if (!userId) {
    console.error(`No user mapping for Stripe customer ${customerId}`);
    return;
  }

  const item = subscription.items.data[0];
  const currentPeriodEnd = item
    ? new Date(item.current_period_end * 1000).toISOString()
    : null;

  // Cancelling via the Customer Portal sets `cancel_at` (a timestamp) rather
  // than flipping `cancel_at_period_end` to true in this API version, so
  // that boolean alone can't be trusted -- derive it from `cancel_at` instead.
  const cancelAtPeriodEnd =
    subscription.cancel_at_period_end || subscription.cancel_at !== null;

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      price_id: item?.price.id ?? null,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

async function lookupUserIdByCustomer(admin: AdminClient, customerId: string) {
  const { data } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.user_id ?? null;
}
