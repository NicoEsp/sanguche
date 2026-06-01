import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { UserProfile } from './shared';

interface AdminUsersHook {
  users: UserProfile[];
  assessments: { created_at: string }[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  toggleAdminRole: (userId: string) => Promise<void>;
  toggleMentoriaStatus: (userId: string, currentStatus: boolean) => Promise<void>;
  toggleFounderStatus: (userId: string, currentStatus: boolean) => Promise<void>;
  deleteUser: (userId: string, displayName: string) => Promise<boolean>;
}

export function useAdminUsers(): AdminUsersHook {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [assessments, setAssessments] = useState<{ created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialLoadRef = useRef(true);
  const refreshQueueRef = useRef<number | null>(null);
  const pendingRealtimeUpdateRef = useRef(false);
  const isFetchingRef = useRef(false);

  const fetchUsers = useCallback(async (options: { silent?: boolean } = {}) => {
    const { silent = false } = options;

    if (isFetchingRef.current && silent) {
      pendingRealtimeUpdateRef.current = true;
      return;
    }

    isFetchingRef.current = true;
    const isInitialLoad = initialLoadRef.current;

    try {
      if (isInitialLoad && !silent) {
        setLoading(true);
      } else if (!silent) {
        setRefreshing(true);
      }
      setError(null);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, user_id, created_at, mentoria_completed, is_founder')
        .order('created_at', { ascending: false })
        .limit(2000);

      if (profilesError) throw profilesError;

      if (!profiles?.length) {
        setUsers([]);
        if (!silent && !isInitialLoad) {
          toast.success('Datos actualizados correctamente');
        }
        return;
      }

      const emailMap = new Map<string, string>();

      const emailPromise = supabase.functions.invoke('get-admin-users').catch((err) => {
        if (import.meta.env.DEV) {
          console.error('Error fetching user emails:', err);
        }
        return { data: null, error: err };
      });

      const [emailResult, subscriptionsResult, rolesResult, assessmentsResult] = await Promise.all([
        emailPromise,
        supabase.from('user_subscriptions').select('user_id, plan, status').limit(2000),
        supabase.from('user_roles').select('user_id, role').limit(2000),
        supabase.from('assessments').select('user_id, assessment_result, created_at').limit(5000),
      ]);

      if (subscriptionsResult.error) throw subscriptionsResult.error;
      if (rolesResult.error) throw rolesResult.error;
      if (assessmentsResult.error && import.meta.env.DEV) {
        console.error('Error fetching assessments:', assessmentsResult.error);
      }

      const usersWithOptionalAnswers = new Set<string>();
      const assessmentRecords: { created_at: string }[] = [];
      assessmentsResult.data?.forEach((assessment) => {
        if (assessment.created_at) {
          assessmentRecords.push({ created_at: assessment.created_at });
        }
        const result = assessment.assessment_result as { optionalDomains?: { growth?: unknown; ia_aplicada?: unknown } } | null;
        const optionalDomains = result?.optionalDomains;
        if (optionalDomains && (optionalDomains.growth || optionalDomains.ia_aplicada)) {
          usersWithOptionalAnswers.add(assessment.user_id);
        }
      });
      setAssessments(assessmentRecords);

      const { data: emailData, error: emailError } = emailResult as {
        data?: { users?: Array<{ user_id?: string; email?: string }> };
        error?: unknown;
      };
      if (!emailError && emailData?.users) {
        emailData.users.forEach((u) => {
          if (u.user_id && u.email) emailMap.set(u.user_id, u.email);
        });
      }

      const usersData: UserProfile[] = profiles.map((profile) => {
        const subscription = subscriptionsResult.data?.find((s) => s.user_id === profile.id);
        const userRole = rolesResult.data?.find((r) => r.user_id === profile.id);

        return {
          id: profile.id,
          name: profile.name,
          user_id: profile.user_id,
          created_at: profile.created_at,
          mentoria_completed: profile.mentoria_completed,
          is_founder: profile.is_founder,
          email: emailMap.get(profile.user_id) || '',
          subscription: subscription || { plan: 'free', status: 'active' },
          role: userRole?.role || 'user',
          hasOptionalAnswers: usersWithOptionalAnswers.has(profile.id),
        };
      });

      setUsers(usersData);

      if (!silent && !isInitialLoad) {
        toast.success('Datos actualizados correctamente');
      }
    } catch (err) {
      setError('Error cargando usuarios');
      toast.error('Error cargando usuarios');
    } finally {
      initialLoadRef.current = false;
      isFetchingRef.current = false;
      setLoading(false);
      setRefreshing(false);

      if (pendingRealtimeUpdateRef.current) {
        pendingRealtimeUpdateRef.current = false;
        void fetchUsers({ silent: true });
      }
    }
  }, []);

  useEffect(() => {
    fetchUsers();

    const scheduleRefresh = () => {
      if (isFetchingRef.current) {
        pendingRealtimeUpdateRef.current = true;
        return;
      }
      if (refreshQueueRef.current !== null) return;

      refreshQueueRef.current = window.setTimeout(() => {
        refreshQueueRef.current = null;
        void fetchUsers({ silent: true });
      }, 250);
    };

    const channels = (
      ['profiles', 'user_subscriptions', 'user_roles', 'assessments'] as const
    ).map((table) =>
      supabase
        .channel(`${table}-changes-admin-users`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, scheduleRefresh)
        .subscribe()
    );

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
      if (refreshQueueRef.current !== null) {
        window.clearTimeout(refreshQueueRef.current);
        refreshQueueRef.current = null;
      }
      pendingRealtimeUpdateRef.current = false;
    };
  }, [fetchUsers]);

  const refresh = useCallback(() => fetchUsers(), [fetchUsers]);

  const toggleAdminRole = useCallback(
    async (userId: string) => {
      if (!isAdmin) {
        toast.error('No tienes permisos para realizar esta acción');
        return;
      }

      try {
        const { data, error: rpcError } = await supabase.rpc('admin_toggle_user_role', {
          p_target_profile_id: userId,
          p_role: 'admin',
        });

        if (rpcError) throw rpcError;

        if (data && typeof data === 'object' && 'action' in data) {
          toast.success(
            data.action === 'added' ? 'Rol de administrador asignado' : 'Rol de administrador removido'
          );
          if (import.meta.env.DEV) {
            console.log('Admin role toggled:', data);
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error modificando rol de administrador';
        setError(errorMsg);
        toast.error(errorMsg);
        if (import.meta.env.DEV) console.error('Error toggling admin role:', err);
      }
    },
    [isAdmin]
  );

  const toggleMentoriaStatus = useCallback(
    async (userId: string, currentStatus: boolean) => {
      if (!isAdmin) {
        toast.error('No tienes permisos para realizar esta acción');
        return;
      }

      try {
        const { data, error: rpcError } = await supabase.rpc('admin_update_mentoria_status', {
          p_target_profile_id: userId,
          p_new_status: !currentStatus,
        });

        if (rpcError) throw rpcError;

        if (data && typeof data === 'object' && 'new_status' in data) {
          toast.success(`Mentoría marcada como ${data.new_status ? 'completada' : 'pendiente'}`);
          if (import.meta.env.DEV) {
            console.log('Mentoria status updated:', data);
          }
        }
      } catch (err) {
        const errorMsg = 'Error modificando estado de mentoría';
        setError(errorMsg);
        toast.error(errorMsg);
        if (import.meta.env.DEV) console.error('Error updating mentoria status:', err);
      }
    },
    [isAdmin]
  );

  const toggleFounderStatus = useCallback(
    async (userId: string, currentStatus: boolean) => {
      if (!isAdmin) {
        toast.error('No tienes permisos para realizar esta acción');
        return;
      }

      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_founder: !currentStatus })
          .eq('id', userId);

        if (updateError) throw updateError;
        toast.success(`Usuario ${!currentStatus ? 'marcado como' : 'removido de'} Founder`);
      } catch (err) {
        const errorMsg = 'Error modificando estado de Founder';
        setError(errorMsg);
        toast.error(errorMsg);
        if (import.meta.env.DEV) console.error('Error updating founder status:', err);
      }
    },
    [isAdmin]
  );

  const deleteUser = useCallback(
    async (userId: string, displayName: string) => {
      if (!isAdmin) return false;

      try {
        const { data, error: fnError } = await supabase.functions.invoke('delete-user', {
          body: { profileId: userId },
        });

        if (fnError) throw fnError;

        if (data.success) {
          toast.success(`Usuario "${displayName}" eliminado correctamente`);
          await fetchUsers();
          return true;
        }
        throw new Error(data.error || 'Error desconocido al eliminar usuario');
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error eliminando usuario';
        toast.error(errorMsg);
        return false;
      }
    },
    [isAdmin, fetchUsers]
  );

  return {
    users,
    assessments,
    loading,
    refreshing,
    error,
    refresh,
    toggleAdminRole,
    toggleMentoriaStatus,
    toggleFounderStatus,
    deleteUser,
  };
}
