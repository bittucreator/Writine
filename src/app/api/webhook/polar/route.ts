import { Webhooks } from "@polar-sh/nextjs";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client with service role for admin operations (lazy initialization)
const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(url, key);
};

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  
  onPayload: async (payload) => {
    const supabaseAdmin = getSupabaseAdmin();
    console.log('Polar webhook received:', payload.type);
    
    // Handle order.created event
    if (payload.type === 'order.created') {
      const order = payload.data as unknown as {
        id: string;
        customer_id: string;
        subscription_id: string | null;
        product_id: string;
        customer: { email: string } | null;
      };
      
      console.log('Order created:', order.id);
      
      const customerEmail = order.customer?.email;
      if (!customerEmail) {
        console.error('No customer email in order');
        return;
      }

      try {
        // Find user by email
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users.users.find(u => u.email === customerEmail);
        
        if (!user) {
          console.error('User not found for email:', customerEmail);
          return;
        }

        // Check if it's a subscription or one-time purchase
        const isSubscription = order.subscription_id !== null;
        
        // Update or create subscription record
        await supabaseAdmin
          .from('subscriptions')
          .upsert({
            user_id: user.id,
            polar_customer_id: order.customer_id,
            polar_order_id: order.id,
            polar_subscription_id: order.subscription_id,
            polar_product_id: order.product_id,
            status: 'active',
            plan: 'pro',
            current_period_start: new Date().toISOString(),
            current_period_end: isSubscription 
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });

        console.log('Subscription activated for user:', user.id);
      } catch (error) {
        console.error('Error processing order:', error);
      }
    }
    
    // Handle subscription.updated event
    if (payload.type === 'subscription.updated' || payload.type === 'subscription.active') {
      const subscription = payload.data as unknown as {
        id: string;
        status: string;
        current_period_end: string;
        customer: { email: string } | null;
      };
      
      console.log('Subscription updated:', subscription.id);
      
      const customerEmail = subscription.customer?.email;
      if (!customerEmail) return;

      try {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users.users.find(u => u.email === customerEmail);
        
        if (!user) return;

        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: subscription.status === 'active' ? 'active' : 'canceled',
            current_period_end: subscription.current_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        console.log('Subscription updated for user:', user.id);
      } catch (error) {
        console.error('Error updating subscription:', error);
      }
    }
    
    // Handle subscription.canceled event
    if (payload.type === 'subscription.canceled') {
      const subscription = payload.data as unknown as {
        id: string;
        customer: { email: string } | null;
      };
      
      console.log('Subscription canceled:', subscription.id);
      
      const customerEmail = subscription.customer?.email;
      if (!customerEmail) return;

      try {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users.users.find(u => u.email === customerEmail);
        
        if (!user) return;

        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        console.log('Subscription canceled for user:', user.id);
      } catch (error) {
        console.error('Error canceling subscription:', error);
      }
    }

    // Handle payment failed events - pause account after failures
    if (payload.type === 'order.refunded' || payload.type === 'subscription.revoked') {
      const data = payload.data as unknown as {
        id: string;
        customer: { email: string } | null;
      };
      
      console.log('Payment issue detected:', payload.type, data.id);
      
      const customerEmail = data.customer?.email;
      if (!customerEmail) return;

      try {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users.users.find(u => u.email === customerEmail);
        
        if (!user) return;

        // Get current subscription to check failure count
        const { data: currentSub } = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        const failureCount = (currentSub?.payment_failure_count || 0) + 1;

        // After 3 failures, pause the account
        if (failureCount >= 3) {
          await supabaseAdmin
            .from('subscriptions')
            .update({
              status: 'paused',
              payment_failure_count: failureCount,
              paused_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

          console.log('Account paused due to payment failures for user:', user.id);
        } else {
          // Increment failure count
          await supabaseAdmin
            .from('subscriptions')
            .update({
              payment_failure_count: failureCount,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

          console.log('Payment failure recorded for user:', user.id, 'Count:', failureCount);
        }
      } catch (error) {
        console.error('Error handling payment failure:', error);
      }
    }
  },
});
