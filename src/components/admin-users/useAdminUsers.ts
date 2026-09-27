import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAllRows } from '@/utils/fetchAllRows';
import type { UserProfile } from './shared';

interface ProfileRow {
  id: string;
  name: string | null;
  user_id: string;
  email: string | null;
  created_at: string;
  mentoria_completed: boolean;
  is_founder: boolean | null;
}

interface AssessmentRow {
  user_id: string;
  created_at: string;
  optional_domains: unknown;
}

const loadProfiles = (): Promise<ProfileRow[]> =>
  fetchAllRows((from, to) =>
    supabase
      .from('profiles')
      .select('id, name, user_id, email, created_at, mentoria_completed, is_founder')
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(from, to)
  );

const loadSubscriptions = (): Promise<{ user_id: string; plan: string; status: string }[]> =>
  fetchAllRows((from, to) =>
    supabase
      .from('user_subscriptions')
      .select('user_id, plan, status')
      .order('id', { ascending: true })
      .range(from, to)
  );

const loadRoles = (): Promise<{ user_id: string; role: string }[]> =>
  fetchAllRows((from, to) =>
    supabase.from('user_roles').select('user_id, role').order('id', { ascending: true }).range(from, to)
  );

// Solo los opcionales del resultado: bajar assessment_result entero para
// mirar dos claves era la mayor parte del payload. La columna va tipada como
// string porque el parser de tipos de postgrest-js no resuelve el camino JSON
// (TS2589); el tipo de la fila lo fija overrideTypes.
const ASSESSMENT_COLUMNS: string = 'user_id, created_at, optional_domains:assessment_result->optionalDomains';

const loadAssessments = (): Promise<AssessmentRow[]> =>
  fetchAllRows((from, to) =>
    supabase
      .from('assessments')
      .select(ASSESSMENT_COLUMNS)
      .order('id', { ascending: true })
      .range(from, to)
      .overrideTypes<AssessmentRow[], { merge: false }>()
  );

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

      // Todo en paralelo y paginado: PostgREST corta en 1000 filas y los
      // .limit(2000) de antes no lo cambiaban. El email sale de profiles, que
      // el trigger on_auth_user_email_sync mantiene al día con auth.users:
      // antes venía de la edge function get-admin-users, cuyo listUsers() sin
      // paginar devolvía solo los primeros 50 usuarios (el resto, sin email).
      const [profiles, subscriptions, roles, assessmentRows] = await Promise.all([
        loadProfiles(),
        loadSubscriptions(),
        loadRoles(),
        loadAssessments().catch((assessmentsError): AssessmentRow[] => {
          if (import.meta.env.DEV) {
            console.error('Error fetching assessments:', assessmentsError);
          }
          return [];
        }),
      ]);

      if (!profiles.length) {
        setUsers([]);
        setAssessments([]);
        if (!silent && !isInitialLoad) {
          toast.success('Datos actualizados correctamente');
        }
        return;
      }

      const usersWithOptionalAnswers = new Set<string>();
      const assessmentRecords: { created_at: string }[] = [];
      assessmentRows.forEach((assessment) => {
        if (assessment.created_at) {
          assessmentRecords.push({ created_at: assessment.created_at });
        }
        const optionalDomains = assessment.optional_domains as { growth?: unknown; ia_aplicada?: unknown } | null;
        if (optionalDomains && (optionalDomains.growth || optionalDomains.ia_aplicada)) {
          usersWithOptionalAnswers.add(assessment.user_id);
        }
      });
      setAssessments(assessmentRecords);

      // Maps en vez de un find por perfil sobre cada lista (cuadrático).
      const subscriptionByProfile = new Map(subscriptions.map((sub) => [sub.user_id, sub]));
      const roleByProfile = new Map<string, string>();
      roles.forEach((r) => {
        // Con más de un rol, admin gana: antes quedaba el primero que devolviera la base.
        if (r.role === 'admin' || !roleByProfile.has(r.user_id)) roleByProfile.set(r.user_id, r.role);
      });

      const usersData: UserProfile[] = profiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
        user_id: profile.user_id,
        created_at: profile.created_at,
        mentoria_completed: profile.mentoria_completed,
        is_founder: profile.is_founder,
        email: profile.email || '',
        subscription: subscriptionByProfile.get(profile.id) || { plan: 'free', status: 'active' },
        role: roleByProfile.get(profile.id) || 'user',
        hasOptionalAnswers: usersWithOptionalAnswers.has(profile.id),
      }));

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
