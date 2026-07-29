"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "~/env";
import { stripe } from "~/lib/stripe";
import { createAdminClient } from "~/lib/supabase/admin";
import { createClient } from "~/lib/supabase/server";

async function getOrigin() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}`;
}

async function getOrCreateStripeCustomerId(userId: string, email: string) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.stripe_customer_id)
    return existing.stripe_customer_id as string;

  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  });

  await admin
    .from("subscriptions")
    .upsert(
      { user_id: userId, stripe_customer_id: customer.id },
      { onConflict: "user_id" },
    );

  return customer.id;
}

export async function createCheckoutSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");

  const customerId = await getOrCreateStripeCustomerId(user.id, user.email);
  const origin = await getOrigin();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
    subscription_data: { metadata: { supabase_user_id: user.id } },
    success_url: `${origin}/settings?checkout=success`,
    cancel_url: `${origin}/settings?checkout=cancel`,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  redirect(session.url);
}

export async function createPortalSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data?.stripe_customer_id) redirect("/settings");

  const origin = await getOrigin();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: data.stripe_customer_id,
    return_url: `${origin}/settings`,
  });
  redirect(portalSession.url);
}
