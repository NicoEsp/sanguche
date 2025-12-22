import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionWithProfile {
  id: string;
  user_id: string;
  plan: 'free' | 'premium';
  status: 'active' | 'inactive' | 'cancelled';
  lemon_squeezy_subscription_id: string | null;
  lemon_squeezy_customer_id: string | null;
  lemon_squeezy_order_id: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

export interface WebhookLog {
  id: string;
  event_name: string;
  event_data: Record<string, unknown>;
  user_email: string | null;
  user_id: string | null;
  lemon_squeezy_subscription_id: string | null;
  lemon_squeezy_customer_id: string | null;
  lemon_squeezy_order_id: string | null;
  status: string | null;
  error_message: string | null;
  processing_time_ms: number | null;
  created_at: string;
}

export interface SubscriptionFilters {
  plan?: 'free' | 'premium' | 'all';
  status?: 'active' | 'inactive' | 'cancelled' | 'all';
  search?: string;
}

export interface WebhookFilters {
  eventType?: string;
  status?: 'success' | 'error' | 'all';
}

export function useAdminSubscriptions(filters: SubscriptionFilters = {}) {
  return useQuery({
    queryKey: ['admin-subscriptions', filters],
    queryFn: async () => {
      let query = supabase
        .from('user_subscriptions')
        .select(`
          *,
          profiles!inner(id, name, email)
        `)
        .order('updated_at', { ascending: false });

      if (filters.plan && filters.plan !== 'all') {
        query = query.eq('plan', filters.plan);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by search if provided (client-side for email/name)
      let results = data as SubscriptionWithProfile[];
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        results = results.filter(sub => 
          sub.profiles?.email?.toLowerCase().includes(searchLower) ||
          sub.profiles?.name?.toLowerCase().includes(searchLower)
        );
      }

      return results;
    },
  });
}

export function useAdminWebhookLogs(filters: WebhookFilters = {}, limit = 50) {
  return useQuery({
    queryKey: ['admin-webhook-logs', filters, limit],
    queryFn: async () => {
      let query = supabase
        .from('payment_webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (filters.eventType && filters.eventType !== 'all') {
        query = query.eq('event_name', filters.eventType);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as WebhookLog[];
    },
  });
}

export function useSubscriptionStats() {
  return useQuery({
    queryKey: ['admin-subscription-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('plan, status, lemon_squeezy_subscription_id');

      if (error) throw error;

      const total = data.length;
      const premium = data.filter(s => s.plan === 'premium' && s.status === 'active').length;
      const free = data.filter(s => s.plan === 'free').length;
      const withLemonSqueezy = data.filter(s => s.lemon_squeezy_subscription_id).length;
      const conversionRate = total > 0 ? ((premium / total) * 100).toFixed(1) : '0';

      return {
        total,
        premium,
        free,
        withLemonSqueezy,
        conversionRate,
      };
    },
  });
}
