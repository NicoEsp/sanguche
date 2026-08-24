import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionWithProfile {
  id: string;
  user_id: string;
  plan: 'free' | 'premium' | 'repremium' | 'curso_estrategia' | 'cursos_all' | 'productprepa_business' | 'productastic_review';
  status: 'active' | 'inactive' | 'cancelled';
  lemon_squeezy_subscription_id: string | null;
  lemon_squeezy_customer_id: string | null;
  lemon_squeezy_order_id: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
  is_comped: boolean;
  admin_notes: string | null;
  paid_amount: number | null;
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
  plan?: 'free' | 'premium' | 'repremium' | 'curso_estrategia' | 'cursos_all' | 'productprepa_business' | 'productastic_review' | 'all';
  status?: 'active' | 'inactive' | 'cancelled' | 'all';
  search?: string;
  comped?: 'all' | 'paid' | 'comped';
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

      // Filter by comped status
      if (filters.comped && filters.comped !== 'all') {
        if (filters.comped === 'comped') {
          results = results.filter(sub => sub.is_comped === true);
        } else if (filters.comped === 'paid') {
          results = results.filter(sub => sub.is_comped === false);
        }
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
      // Se cuenta en la base, no en el cliente. Antes se traían todas las filas
      // con un select sin límite y se filtraba acá, pero PostgREST corta en
      // 1000 filas sin avisar: con 1144 suscripciones el total salía 1000, y
      // como el select no tenía ORDER BY tampoco había garantía de que las 26
      // pagas entraran en esa ventana. La tasa de conversión se calculaba
      // contra un denominador recortado.
      const count = async (build: (q: any) => any) => {
        const { count: n, error } = await build(
          supabase.from('user_subscriptions').select('*', { count: 'exact', head: true })
        );
        if (error) throw error;
        return n ?? 0;
      };

      const activePlan = (plan: string) => (q: any) => q.eq('plan', plan).eq('status', 'active');

      const [
        total,
        premiumPlain,
        repremiumCount,
        premiumComped,
        repremiumComped,
        cursoEstrategiaCount,
        cursosAllCount,
        productprepaBusinessCount,
        productasticReviewCount,
        free,
        withLemonSqueezy,
      ] = await Promise.all([
        count((q) => q),
        count(activePlan('premium')),
        count(activePlan('repremium')),
        count((q) => activePlan('premium')(q).eq('is_comped', true)),
        count((q) => activePlan('repremium')(q).eq('is_comped', true)),
        count(activePlan('curso_estrategia')),
        count(activePlan('cursos_all')),
        count(activePlan('productprepa_business')),
        count(activePlan('productastic_review')),
        count((q) => q.eq('plan', 'free')),
        count((q) => q.not('lemon_squeezy_subscription_id', 'is', null)),
      ]);

      // "Premium" agrupa premium + repremium, igual que isPremiumPlan.
      const premium = premiumPlain + repremiumCount;
      const comped = premiumComped + repremiumComped;
      const conversionRate = total > 0 ? ((premium / total) * 100).toFixed(1) : '0';

      return {
        total,
        premium,
        premiumPaid: premium - comped,
        premiumComped: comped,
        repremiumCount,
        cursoEstrategiaCount,
        cursosAllCount,
        productprepaBusinessCount,
        productasticReviewCount,
        free,
        withLemonSqueezy,
        conversionRate,
      };
    },
  });
}

export function useToggleCompedStatus() {
  return async (subscriptionId: string, isComped: boolean) => {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ is_comped: isComped })
      .eq('id', subscriptionId);
    
    if (error) throw error;
    return true;
  };
}
